// ============================================================
//  Multiplayer server for the street game.
//  Start it with:  npm run server
//  It tells every player where the other players are.
//  Players who type the same room code are on the same street.
//  Online (npm start after npm run build) it also sends out the game itself.
// ============================================================
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import { createStaticHandler } from './static.js'
import { sanitizeAvatar } from '../src/avatar.js'

const PORT = process.env.PORT || 3001

// The built game lives in the dist folder next to this server folder
const sendGame = createStaticHandler(fileURLToPath(new URL('../dist', import.meta.url)))
const httpServer = createServer(sendGame)
const io = new Server(httpServer, { cors: { origin: '*' } })

// Everyone who is connected: socket id -> player
const players = new Map()

const cleanText = (value, fallback, max) => String(value ?? '').trim().slice(0, max) || fallback
const cleanNumber = (value) => (Number.isFinite(value) ? Math.max(-1000, Math.min(1000, value)) : 0)

io.on('connection', (socket) => {
  socket.on('join', ({ name, room, avatar } = {}) => {
    const player = {
      id: socket.id,
      name: cleanText(name, 'Player', 16),
      room: cleanText(room, 'tnlf', 20).toLowerCase(),
      avatar: sanitizeAvatar(avatar), // only allowed choices from avatar.js
      x: 0, y: 1, z: 0, rotY: 0, moving: false, sit: 0, dive: 0,
    }
    player.color = player.avatar.topColor // name color in the chat
    players.set(socket.id, player)
    socket.join(player.room)
    // Tell the new player who is already here, and tell everyone else about the new player
    const others = [...players.values()].filter((p) => p.room === player.room && p.id !== socket.id)
    socket.emit('welcome', { id: socket.id, players: others })
    socket.to(player.room).emit('playerJoined', player)
    console.log(`${player.name} joined room "${player.room}" (${others.length + 1} here)`)
  })

  socket.on('move', (m = {}) => {
    const player = players.get(socket.id)
    if (!player) return
    player.x = cleanNumber(m.x)
    player.y = cleanNumber(m.y)
    player.z = cleanNumber(m.z)
    player.rotY = cleanNumber(m.rotY)
    player.moving = !!m.moving
    player.sit = Math.max(0, Math.min(1, cleanNumber(m.sit)))
    player.dive = Math.max(0, Math.min(1, cleanNumber(m.dive)))
    const { id, x, y, z, rotY, moving, sit, dive } = player
    // volatile: if the network is slow, it's fine to skip an old position
    socket.to(player.room).volatile.emit('playerMoved', { id, x, y, z, rotY, moving, sit, dive })
  })

  // Chat: send the message to everyone in the same room (including the sender)
  socket.on('chat', (text) => {
    const player = players.get(socket.id)
    if (!player) return
    const now = Date.now()
    if (now - (player.lastChat ?? 0) < 700) return // no spamming: at most one message every 0.7 s
    const clean = String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
    if (!clean) return
    player.lastChat = now
    io.to(player.room).emit('chat', { id: socket.id, name: player.name, color: player.color, text: clean, at: now })
  })

  // ---------- Voice chat ----------
  // Voices go straight between the players' browsers (WebRTC).
  // The server only introduces them and passes their connection details along.
  socket.on('voice-join', () => {
    const player = players.get(socket.id)
    if (!player) return
    player.voice = true
    // The newcomer calls everyone who is already in voice
    const peers = [...players.values()].filter((p) => p.room === player.room && p.voice && p.id !== socket.id)
    socket.emit('voice-peers', peers.map((p) => p.id))
    sendVoiceUsers(player.room)
  })

  socket.on('voice-leave', () => {
    const player = players.get(socket.id)
    if (!player || !player.voice) return
    player.voice = false
    socket.to(player.room).emit('voice-left', socket.id)
    sendVoiceUsers(player.room)
  })

  socket.on('voice-signal', ({ to, description, candidate } = {}) => {
    const player = players.get(socket.id)
    const target = players.get(to)
    if (!player || !target || target.room !== player.room) return
    if (JSON.stringify({ description, candidate }).length > 20000) return // too big, ignore
    io.to(to).emit('voice-signal', { from: socket.id, description, candidate })
  })

  socket.on('disconnect', () => {
    const player = players.get(socket.id)
    if (!player) return
    players.delete(socket.id)
    if (player.voice) {
      socket.to(player.room).emit('voice-left', socket.id)
      sendVoiceUsers(player.room)
    }
    socket.to(player.room).emit('playerLeft', socket.id)
    console.log(`${player.name} left room "${player.room}"`)
  })
})

// Tell everyone in a room who is in voice chat (to show the 🎙 icons)
function sendVoiceUsers(room) {
  const ids = [...players.values()].filter((p) => p.room === room && p.voice).map((p) => p.id)
  io.to(room).emit('voice-users', ids)
}

httpServer.listen(PORT, () => {
  console.log(`Katropa server running on port ${PORT}`)
})
