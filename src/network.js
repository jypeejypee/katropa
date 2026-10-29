import { io } from 'socket.io-client'
import * as THREE from 'three'
import { playerPos, playerState } from './world.js'
import { getGame, setGame } from './game.js'
import { attachVoice } from './voice.js'
import { timeFromClock } from './timeOfDay.js'

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

export function connect({ name, room, avatar, adminCode }) {
  if (socket) return
  setGame({ online: 'connecting' })
  socket = io(SERVER_URL, { transports: ['websocket'] })
  attachVoice(socket)

  socket.on('connect', () => {
    socket.emit('join', { name, room, avatar, adminCode })
    setGame({ online: 'online' })
  })
  socket.on('connect_error', () => setGame({ online: 'offline' }))
  socket.on('disconnect', () => {
    remotePlayers.clear()
    updateList()
    setGame({ online: 'offline' })
  })

  socket.on('welcome', ({ id, players, name: myName, admin }) => {
    myId = id
    setGame({ myId: id, admin: !!admin, playerName: myName ?? getGame().playerName })
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
  // Settings for the whole room (the admin can change them)
  socket.on('settings', (settings) => {
    const timeSetting = settings.time ?? 'auto'
    setGame({ timeSetting, time: timeSetting === 'auto' ? timeFromClock() : timeSetting })
  })
  socket.on('notice', (text) => toast(text))

  // 2-player pickleball: the server sends the ball and score many times a second
  socket.on('pb-state', (state) => {
    pbNet.state = state
    pbNet.at = performance.now()
    const old = getGame().pb
    const key = `${state.phase}|${state.score}|${state.message}|${state.players.map((p) => p.id + p.name)}|${state.server}`
    if (!old || old.key !== key) setGame({ pb: { ...state, key } })
  })
  socket.on('pb-end', ({ text, players }) => {
    pbNet.state = null
    const { mode } = getGame()
    setGame({ pb: null, ...(mode === 'pickleball2' ? { mode: 'walk' } : {}) })
    if (players.includes(myId) || mode === 'pickleball2') toast(text)
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

// The latest 2-player pickleball state from the server (read every frame by Pickleball2P.jsx)
export const pbNet = { state: null, at: 0 }

export function sendPb(event, data) {
  if (socket?.connected) socket.emit(event, data)
}

// Admin only (the server checks): change a setting for everyone in the room
export function adminSet(changes) {
  if (socket?.connected) socket.emit('admin-set', changes)
}

export const isOnline = () => !!socket?.connected

// Short message at the top of the screen for a few seconds
export function toast(text) {
  setGame({ toast: { text, at: Date.now() } })
}

// Send a chat message to everyone in the room
export function sendChat(text) {
  if (socket?.connected) socket.emit('chat', text)
}

// True when the player is typing in a text box (so game keys like W or J don't do anything)
export const isTyping = (e) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
