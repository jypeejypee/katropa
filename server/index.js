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
import { setupPickleball } from './pickleball.js'
import { timingSafeEqual } from 'node:crypto'

const PORT = process.env.PORT || 3001
const startedAt = Date.now()

// Admin: the name "jaypee" plus the secret ADMIN_CODE (set it on Render: Environment -> ADMIN_CODE).
// Without the right code, someone typing "jaypee" joins as a Guest.
const ADMIN_NAME = 'jaypee'
const ADMIN_CODE = process.env.ADMIN_CODE ?? ''
const TIME_SETTINGS = ['auto', 'noon', 'afternoon', 'night']
function isAdminCode(code) {
  const a = Buffer.from(String(code ?? ''))
  const b = Buffer.from(ADMIN_CODE)
  return ADMIN_CODE.length > 0 && a.length === b.length && timingSafeEqual(a, b)
}

// The built game lives in the dist folder next to this server folder
const sendGame = createStaticHandler(fileURLToPath(new URL('../dist', import.meta.url)))
const httpServer = createServer(sendGame)
const io = new Server(httpServer, { cors: { origin: '*' } })

// Everyone who is connected: socket id -> player
const players = new Map()
// Settings each room shares (changed by the admin): room -> { time }
const roomSettings = new Map()
const settingsOf = (room) => roomSettings.get(room) ?? { time: 'auto' }

const cleanText = (value, fallback, max) => String(value ?? '').trim().slice(0, max) || fallback
const cleanNumber = (value) => (Number.isFinite(value) ? Math.max(-1000, Math.min(1000, value)) : 0)

const pickleball = setupPickleball(io, players)

// Record of who came in, who left and what they said (the admin can see it in the game).
// Kept in memory only: it starts empty again when the server restarts or wakes up from sleep.
// Each line is also printed, so it shows in Render's Logs too.
const activity = []
function record(type, player, text) {
  activity.push({ at: Date.now(), type, name: player.name, room: player.room, text })
  if (activity.length > 1000) activity.shift()
  console.log(type === 'chat' ? `[chat] ${player.room} ${player.name}: ${text}` : `${player.name} ${type === 'join' ? 'joined' : 'left'} room "${player.room}"`)
}

io.on('connection', (socket) => {
  socket.on('join', ({ name, room, avatar, adminCode } = {}) => {
    const player = {
      id: socket.id,
      name: cleanText(name, 'Player', 16),
      room: cleanText(room, 'tnlf', 20).toLowerCase(),
      avatar: sanitizeAvatar(avatar), // only allowed choices from avatar.js
      x: 0, y: 1, z: 0, rotY: 0, moving: false, sit: 0, dive: 0,
    }
    player.color = player.avatar.topColor // name color in the chat
    if (player.name.toLowerCase() === ADMIN_NAME) {
      if (isAdminCode(adminCode)) player.admin = true
      else {
        player.name = `Guest${Math.floor(100 + Math.random() * 900)}`
        socket.emit('notice', 'Mali ang admin code, kaya Guest muna ang pangalan mo.')
      }
    }
    players.set(socket.id, player)
    socket.join(player.room)
    // Tell the new player who is already here, and tell everyone else about the new player
    const others = [...players.values()].filter((p) => p.room === player.room && p.id !== socket.id)
    socket.emit('welcome', { id: socket.id, players: others, name: player.name, admin: !!player.admin })
    socket.emit('settings', settingsOf(player.room))
    pickleball.greet(socket)
    socket.to(player.room).emit('playerJoined', player)
    record('join', player)
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
    player.skate = m.skate ? 1 : 0 // riding a skateboard
    const { id, x, y, z, rotY, moving, sit, dive, skate } = player
    // volatile: if the network is slow, it's fine to skip an old position
    socket.to(player.room).volatile.emit('playerMoved', { id, x, y, z, rotY, moving, sit, dive, skate })
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
    record('chat', player, clean)
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

  // Admin changes a setting for everyone in the room
  socket.on('admin-set', (changes = {}) => {
    const player = players.get(socket.id)
    if (!player?.admin) return
    const next = { ...settingsOf(player.room) }
    if (TIME_SETTINGS.includes(changes.time)) next.time = changes.time
    roomSettings.set(player.room, next)
    io.to(player.room).emit('settings', next)
  })

  // Admin asks for the record of visitors and chat (all rooms)
  socket.on('admin-log', () => {
    if (!players.get(socket.id)?.admin) return
    socket.emit('admin-log', { since: startedAt, entries: activity })
  })

  // 2-player pickleball
  socket.on('pb-join', () => pickleball.join(socket))
  socket.on('pb-swing', (s) => pickleball.swing(socket, s))
  socket.on('pb-leave', () => pickleball.leave(socket.id))

  socket.on('disconnect', () => {
    pickleball.leave(socket.id)
    const player = players.get(socket.id)
    if (!player) return
    players.delete(socket.id)
    if (player.voice) {
      socket.to(player.room).emit('voice-left', socket.id)
      sendVoiceUsers(player.room)
    }
    socket.to(player.room).emit('playerLeft', socket.id)
    record('leave', player)
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
