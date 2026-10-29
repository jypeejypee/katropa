import { io } from 'socket.io-client'
import * as THREE from 'three'
import { playerPos, playerState } from './world.js'
import { getGame, setGame } from './game.js'
import { attachVoice } from './voice.js'

// Where the multiplayer server is. By default it's reached through the game's own address
// (vite.config.js passes it on to npm run server on port 3001).
// When you put the game online, set VITE_SERVER_URL to your server's address.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined
const SEND_EVERY = 0.1 // seconds between position updates

// The other players: id -> { name, avatar, pos (smoothed), target (latest from the server) }
// Positions change many times a second, so they live here instead of in the game store.
export const remotePlayers = new Map()

let socket = null
let myId = null

// Tell React which players exist (only when someone joins or leaves)
function updateList() {
  setGame({ others: [...remotePlayers.values()].map(({ id, name, avatar }) => ({ id, name, avatar })) })
}

function addPlayer(p) {
  remotePlayers.set(p.id, {
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    pos: new THREE.Vector3(p.x, p.y, p.z),
    target: { x: p.x, y: p.y, z: p.z, rotY: p.rotY, moving: p.moving, sit: p.sit, dive: p.dive },
  })
}

export function connect({ name, room, avatar }) {
  if (socket) return
  setGame({ online: 'connecting' })
  socket = io(SERVER_URL, { transports: ['websocket'] })
  attachVoice(socket)

  socket.on('connect', () => {
    socket.emit('join', { name, room, avatar })
    setGame({ online: 'online' })
  })
  socket.on('connect_error', () => setGame({ online: 'offline' }))
  socket.on('disconnect', () => {
    remotePlayers.clear()
    updateList()
    setGame({ online: 'offline' })
  })

  socket.on('welcome', ({ id, players }) => {
    myId = id
    remotePlayers.clear()
    players.forEach(addPlayer)
    updateList()
  })
  socket.on('playerJoined', (p) => {
    addPlayer(p)
    updateList()
  })
  socket.on('playerMoved', (m) => {
    const p = remotePlayers.get(m.id)
    if (p) Object.assign(p.target, m)
  })
  socket.on('chat', (m) => {
    const { chat, bubbles } = getGame()
    const who = m.id === myId ? 'me' : m.id
    setGame({
      chat: [...chat, m].slice(-30),
      bubbles: { ...bubbles, [who]: { text: m.text, at: performance.now() } },
    })
  })
  socket.on('playerLeft', (id) => {
    remotePlayers.delete(id)
    updateList()
  })

  // Send our own position a few times a second
  setInterval(() => {
    if (!socket.connected || getGame().mode === 'start') return
    socket.emit('move', {
      x: playerPos.x,
      y: playerPos.y,
      z: playerPos.z,
      rotY: playerState.facing,
      moving: playerState.moving,
      sit: playerState.sit,
      dive: playerState.dive,
    })
  }, SEND_EVERY * 1000)
}

// Send a chat message to everyone in the room
export function sendChat(text) {
  if (socket?.connected) socket.emit('chat', text)
}

// True when the player is typing in a text box (so game keys like W or J don't do anything)
export const isTyping = (e) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
