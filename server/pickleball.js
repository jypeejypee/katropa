// ============================================================
//  2-player pickleball. The server moves the ball, so both players
//  always see the same game and nobody can cheat.
//  Side 0 = the side closer to the start of the street (z bigger than the net), side 1 = the far side.
// ============================================================
import { COURT } from '../src/court.js'

const { z: NET_Z, halfLength: HALF_L, halfWidth: HALF_W, netHeight: NET_H } = COURT
const GRAVITY = 9.8
const BALL_R = 0.07
const WIN_SCORE = 11
const REACH = 1.6 // how close the ball must be to hit it (a bit more than solo, for network delay)
const DIVE_REACH = 2.6
const TICK = 1 / 30

const sideOf = (z) => (z > NET_Z ? 0 : 1)
const isInside = (p) => Math.abs(p.x) <= HALF_W && Math.abs(p.z - NET_Z) <= HALF_L
const clean = (v, max) => (Number.isFinite(v) ? Math.max(-max, Math.min(max, v)) : 0)

export function setupPickleball(io, players) {
  const matches = new Map() // room -> match

  const nameOf = (m, side) => players.get(m.players[side])?.name ?? 'Player'

  function publicState(m) {
    return {
      phase: m.phase,
      players: m.players.map((id) => ({ id, name: players.get(id)?.name ?? '' })),
      score: m.score,
      server: m.server,
      message: m.message,
      ball: m.pos,
      vel: m.vel,
    }
  }
  const send = (m) => io.to(m.room).emit('pb-state', publicState(m))

  // Throw the ball so it lands on (tx, tz), high enough to clear the net
  function launch(m, tx, tz) {
    const p = m.pos
    const dx = tx - p.x
    const dz = tz - p.z
    let time = Math.min(1.5, Math.max(0.7, Math.hypot(dx, dz) / 11 + 0.35))
    const upSpeed = (t) => (BALL_R - p.y + 0.5 * GRAVITY * t * t) / t
    for (let i = 0; i < 12; i++) {
      const tNet = (NET_Z - p.z) / (dz / time)
      const yAtNet = p.y + upSpeed(time) * tNet - 0.5 * GRAVITY * tNet * tNet
      if (tNet < 0 || tNet > time || yAtNet > NET_H + 0.2) break
      time += 0.08
    }
    m.vel = { x: dx / time, y: upSpeed(time), z: dz / time }
  }

  function startServe(m, side) {
    m.phase = 'serve'
    m.server = side
    m.timer = 0
    m.bounces = 0
    m.lastHitter = side
    m.message = `${nameOf(m, side)} ang mag-se-serve`
  }

  function point(m, winner, reason) {
    if (m.phase === 'point') return // already decided (the ball is still rolling)
    m.phase = 'point'
    m.timer = 0
    m.score[winner]++
    m.lastWinner = winner
    m.message = `${reason} Point ni ${nameOf(m, winner)}!`
  }

  function hit(m, side, aim, depth) {
    // aim: -1 left, 0 middle, 1 right (as the hitter sees it); depth: -1 short, 0 normal, 1 deep
    const facing = side === 0 ? 1 : -1 // side 0 looks toward -z, so its "right" is +x
    const x = aim ? aim * 2.2 * facing : (Math.random() - 0.5) * 2
    const d = depth > 0 ? 5.6 : depth < 0 ? 2.6 : 4.3
    const toward = side === 0 ? -1 : 1
    m.pos.y = Math.max(m.pos.y, 0.4)
    launch(m, x + (Math.random() - 0.5) * 0.6, NET_Z + toward * (d + Math.random() * 0.5))
    m.phase = 'rally'
    m.lastHitter = side
    m.bounces = 0
    m.message = ''
  }

  // Move the ball a tiny step. Returns false if the point is over.
  function stepBall(m, dt) {
    const prevZ = m.pos.z
    m.vel.y -= GRAVITY * dt
    m.pos.x += m.vel.x * dt
    m.pos.y += m.vel.y * dt
    m.pos.z += m.vel.z * dt
    const other = 1 - m.lastHitter
    if ((prevZ - NET_Z) * (m.pos.z - NET_Z) < 0 && m.pos.y < NET_H && Math.abs(m.pos.x) < HALF_W + 0.3) {
      m.pos.z = prevZ
      m.vel = { x: m.vel.x * 0.2, y: 0, z: -m.vel.z * 0.15 }
      point(m, other, 'Sa net!')
      return false
    }
    if (Math.abs(m.pos.x) > 6.3) {
      point(m, m.bounces === 0 ? other : m.lastHitter, m.bounces === 0 ? 'OUT!' : 'Di naabot!')
      return false
    }
    if (m.pos.y < BALL_R && m.vel.y < 0) {
      m.pos.y = BALL_R
      m.vel = { x: m.vel.x * 0.8, y: -m.vel.y * 0.6, z: m.vel.z * 0.8 }
      if (m.bounces === 0) {
        if (sideOf(m.pos.z) === m.lastHitter) return point(m, other, 'Hindi tumawid!'), false
        if (!isInside(m.pos)) return point(m, other, 'OUT!'), false
        m.bounces = 1
      } else {
        point(m, m.lastHitter, `Di naabot ni ${nameOf(m, other)}!`)
        return false
      }
    }
    return true
  }

  function end(m, text) {
    matches.delete(m.room)
    io.to(m.room).emit('pb-end', { text, players: m.players })
  }

  function tick() {
    for (const m of matches.values()) {
      if (m.phase === 'waiting') continue
      if (m.phase === 'serve') {
        const p = players.get(m.players[m.server])
        if (p) m.pos = { x: p.x - 0.35, y: p.y + 0.1, z: p.z + (m.server === 0 ? -0.35 : 0.35) }
      } else if (m.phase === 'rally') {
        for (let i = 0; i < 4; i++) if (!stepBall(m, TICK / 4)) break
      } else if (m.phase === 'point') {
        for (let i = 0; i < 4; i++) stepBall(m, TICK / 4) // let the ball roll (the point is already decided)
        m.timer += TICK
        if (m.timer > 1.8) {
          const [a, b] = m.score
          if (Math.max(a, b) >= WIN_SCORE && Math.abs(a - b) >= 2) {
            end(m, `🏆 Panalo si ${nameOf(m, a > b ? 0 : 1)}! (${a} - ${b})`)
            continue
          }
          startServe(m, m.lastWinner)
        }
      }
      send(m)
    }
  }
  setInterval(tick, TICK * 1000)

  return {
    // Someone just entered the room: show them the game that's going on (so they can watch or join)
    greet(socket) {
      const player = players.get(socket.id)
      const m = player && matches.get(player.room)
      if (m) socket.emit('pb-state', publicState(m))
    },
    // A player wants to play: open a new game, or join the one that's waiting
    join(socket) {
      const player = players.get(socket.id)
      if (!player) return
      const m = matches.get(player.room)
      if (!m) {
        matches.set(player.room, {
          room: player.room, players: [socket.id], phase: 'waiting', score: [0, 0],
          pos: { x: 0, y: 1, z: NET_Z + 5.5 }, vel: { x: 0, y: 0, z: 0 }, server: 0,
          message: `Hinihintay ang kalaro ni ${player.name}...`,
        })
        send(matches.get(player.room))
      } else if (m.phase === 'waiting' && m.players[0] !== socket.id) {
        m.players.push(socket.id)
        startServe(m, 0)
        send(m)
      } else if (!m.players.includes(socket.id)) {
        socket.emit('notice', `May naglalaro na: ${m.players.map((id) => players.get(id)?.name).join(' vs ')}. Manood ka muna!`)
      }
    },
    swing(socket, s = {}) {
      const player = players.get(socket.id)
      const m = player && matches.get(player.room)
      if (!m) return
      const side = m.players.indexOf(socket.id)
      if (side < 0 || m.phase === 'waiting') return
      // Everyone else in the room sees the paddle swing (the opponent and people watching)
      if (!s.dive) socket.to(m.room).emit('pb-swung', socket.id)
      // Use the position sent with the swing (more up to date), if it's close to what the server knows
      let px = clean(s.x, 1000)
      let pz = clean(s.z, 1000)
      if (Math.hypot(px - player.x, pz - player.z) > 3) {
        px = player.x
        pz = player.z
      }
      const aim = Math.sign(clean(s.aim, 1))
      const depth = Math.sign(clean(s.depth, 1))
      if (m.phase === 'serve' && m.server === side) {
        const ownSide = side === 0 ? pz > NET_Z + 0.5 : pz < NET_Z - 0.5
        if (ownSide) hit(m, side, aim, depth)
        else socket.emit('notice', 'Bumalik ka muna sa side mo!')
        return
      }
      if (m.phase !== 'rally' || m.lastHitter === side || sideOf(m.pos.z) !== side) return
      const reach = s.dive ? DIVE_REACH : REACH
      if (Math.hypot(m.pos.x - px, m.pos.z - pz) < reach && m.pos.y < player.y + 1.5) hit(m, side, aim, depth)
    },
    leave(socketId, why) {
      const player = players.get(socketId)
      const m = player && matches.get(player.room)
      if (!m || !m.players.includes(socketId)) return
      end(m, why ?? `Umalis si ${player.name}. Tapos ang laro.`)
    },
  }
}
