import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { COURT, playerPos, playerState, npcPos, npcState, now, touchInput } from './world.js'
import { getGame, setGame } from './game.js'
import { NPC_NAME } from './dialogue.js'
import { netTexture } from './textures.js'
import { isTyping } from './network.js'

// ---------- Game settings (try changing these!) ----------
const WIN_SCORE = 11
const NPC_SPEED = 4.2 // how fast Edson runs (m/s)
const NPC_MISS_CHANCE = 0.18 // how often Edson whiffs
const NPC_OUT_CHANCE = 0.07 // how often Edson hits it out
const REACH = 1.5 // how close the ball must be for you to hit it
const DIVE_REACH = 2.5 // ...and when you dive for it
const SWING_TIME = 0.35
const GRAVITY = 9.8
const BALL_R = 0.07

const PLAYER = 0
const NPC = 1
const { z: NET_Z, halfLength: HALF_L, halfWidth: HALF_W, kitchen: KITCHEN, netHeight: NET_H } = COURT

const sideOf = (z) => (z > NET_Z ? PLAYER : NPC)
const isInside = (p) => Math.abs(p.x) <= HALF_W && Math.abs(p.z - NET_Z) <= HALF_L
const flatDistance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

// Find the speed to throw the ball so it lands on (tx, tz), high enough to clear the net
function launch(ball, tx, tz) {
  const p = ball.pos
  const dx = tx - p.x
  const dz = tz - p.z
  let time = THREE.MathUtils.clamp(Math.hypot(dx, dz) / 11 + 0.35, 0.7, 1.5)
  const upSpeed = (t) => (BALL_R - p.y + 0.5 * GRAVITY * t * t) / t
  for (let i = 0; i < 12; i++) {
    const tNet = (NET_Z - p.z) / (dz / time)
    const yAtNet = p.y + upSpeed(time) * tNet - 0.5 * GRAVITY * tNet * tNet
    if (tNet < 0 || tNet > time || yAtNet > NET_H + 0.2) break
    time += 0.08
  }
  ball.vel.set(dx / time, upSpeed(time), dz / time)
}

// Where the ball will first touch the ground
function landingSpot(ball) {
  const { pos, vel } = ball
  const t = (vel.y + Math.sqrt(vel.y * vel.y + 2 * GRAVITY * Math.max(0, pos.y - BALL_R))) / GRAVITY
  return new THREE.Vector3(pos.x + vel.x * t, BALL_R, pos.z + vel.z * t)
}

export default function Pickleball() {
  const ballMesh = useRef()
  const [, getKeys] = useKeyboardControls()
  const game = useRef(null)
  if (!game.current) {
    game.current = {
      phase: 'serve', // 'serve', 'rally' or 'point' (short pause after a point)
      server: PLAYER,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      lastHitter: PLAYER,
      bounces: 0,
      timer: 0,
      score: [0, 0],
      lastWinner: PLAYER,
      npcTarget: new THREE.Vector3(0, 0, NET_Z - 4.8),
      npcWillMiss: false,
      npcSwung: false,
    }
  }
  const g = game.current

  function startServe(server) {
    g.phase = 'serve'
    g.server = server
    g.timer = 0
    g.bounces = 0
    g.lastHitter = server
    setGame({
      score: [...g.score],
      message: server === PLAYER ? `Ikaw ang mag-se-serve. Pindutin ang ${getGame().touch ? 'HIT' : 'SPACE'}!` : `${NPC_NAME} ang mag-se-serve...`,
    })
  }

  function point(winner, reason) {
    g.phase = 'point'
    g.timer = 0
    g.score[winner]++
    g.lastWinner = winner
    setGame({ score: [...g.score], message: `${reason} ${winner === PLAYER ? 'Point mo!' : `Point ni ${NPC_NAME}!`}` })
    return false
  }

  function afterHit(hitter) {
    g.phase = 'rally'
    g.lastHitter = hitter
    g.bounces = 0
    if (hitter === PLAYER) {
      // Edson decides where to run (and maybe whiffs)
      const land = landingSpot(g)
      g.npcWillMiss = Math.random() < NPC_MISS_CHANCE
      g.npcSwung = false
      g.npcTarget.set(
        land.x + Math.sign(g.vel.x) * 0.3,
        0,
        Math.min(land.z - 1.1, NET_Z - 0.6)
      )
    }
  }

  function playerHit() {
    // Aim with the keys (A/D, W/S) or the phone joystick
    const keys = getKeys()
    const left = keys.left || touchInput.x < -0.35
    const right = keys.right || touchInput.x > 0.35
    const deep = keys.forward || touchInput.y > 0.35
    const short = keys.backward || touchInput.y < -0.35
    const aimX = left ? -2.2 : right ? 2.2 : (Math.random() - 0.5) * 2
    const depth = deep ? 5.6 : short ? 2.6 : 4.3
    g.pos.y = Math.max(g.pos.y, 0.4)
    launch(g, aimX + (Math.random() - 0.5) * 0.6, NET_Z - depth - Math.random() * 0.5)
    afterHit(PLAYER)
    setGame({ message: '' })
  }

  function npcHit(isServe) {
    const hitOut = !isServe && Math.random() < NPC_OUT_CHANCE
    const tx = hitOut ? Math.sign(Math.random() - 0.5) * (HALF_W + 0.7) : (Math.random() - 0.5) * 2 * (HALF_W - 0.5)
    const tz = NET_Z + (isServe ? 3.5 + Math.random() * 2.5 : 2.4 + Math.random() * 3.8)
    npcState.swingUntil = now() + SWING_TIME
    g.pos.y = Math.max(g.pos.y, 0.4)
    launch(g, tx, tz)
    afterHit(NPC)
    setGame({ message: '' })
  }

  // Move the ball a tiny step. Returns false if the point is over.
  function stepBall(dt) {
    const prevZ = g.pos.z
    g.vel.y -= GRAVITY * dt
    g.pos.addScaledVector(g.vel, dt)
    const rally = g.phase === 'rally'
    const other = 1 - g.lastHitter

    // Hit the net?
    if ((prevZ - NET_Z) * (g.pos.z - NET_Z) < 0 && g.pos.y < NET_H && Math.abs(g.pos.x) < HALF_W + 0.3) {
      g.pos.z = prevZ
      g.vel.set(g.vel.x * 0.2, 0, -g.vel.z * 0.15)
      if (rally) return point(other, 'Sa net!')
    }

    // Flew into the buildings?
    if (Math.abs(g.pos.x) > 6.3) {
      g.pos.x = Math.sign(g.pos.x) * 6.3
      g.vel.x *= -0.4
      if (rally) return g.bounces === 0 ? point(other, 'OUT!') : point(g.lastHitter, 'Di naabot!')
    }

    // Bounce on the road
    if (g.pos.y < BALL_R && g.vel.y < 0) {
      g.pos.y = BALL_R
      g.vel.y *= -0.6
      g.vel.x *= 0.8
      g.vel.z *= 0.8
      if (!rally) return true
      if (g.bounces === 0) {
        if (sideOf(g.pos.z) === g.lastHitter) return point(other, 'Hindi tumawid!')
        if (!isInside(g.pos)) return point(other, 'OUT!')
        g.bounces = 1
      } else {
        return point(g.lastHitter, other === PLAYER ? 'Di mo naabot!' : `Di naabot ni ${NPC_NAME}!`)
      }
    }
    return true
  }

  useEffect(() => {
    // Put both players on the court
    playerState.teleport = [1.2, 1.2, NET_Z + 5.5]
    npcPos.set(-1.2, 0, NET_Z - 5.5)
    npcState.facing = 0
    startServe(PLAYER)

    const onKey = (e) => {
      if (isTyping(e)) return
      if (e.code === 'KeyQ') {
        setGame({ mode: 'talk', dialogue: 'quit', message: '' })
        return
      }
      if (e.code !== 'Space') return
      e.preventDefault()
      swing()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      npcState.moving = false
    }
  }, [])

  // Swing the paddle (Space, or the HIT button on phones)
  function swing() {
    if (now() < playerState.swingUntil) return
    playerState.swingUntil = now() + SWING_TIME
    if (g.phase === 'serve' && g.server === PLAYER) {
      if (playerPos.z < NET_Z + 0.5) setGame({ message: 'Bumalik ka muna sa side mo!' })
      else playerHit()
    }
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    if (playerState.hitRequest) {
      playerState.hitRequest = false
      swing()
    }
    const t = now()

    // ----- Edson runs to where the ball is going -----
    let goal
    if (g.phase === 'rally' && g.lastHitter === PLAYER) goal = g.npcTarget
    else if (g.phase === 'serve' && g.server === NPC) goal = { x: g.score[NPC] % 2 ? -1.3 : 1.3, z: NET_Z - 6.2 }
    else goal = { x: THREE.MathUtils.clamp(g.pos.x * 0.4, -2, 2), z: NET_Z - 4.8 }
    const gx = goal.x - npcPos.x
    const gz = goal.z - npcPos.z
    const goalDist = Math.hypot(gx, gz)
    npcState.moving = goalDist > 0.15
    if (npcState.moving) {
      const step = Math.min(goalDist, NPC_SPEED * dt)
      npcPos.x += (gx / goalDist) * step
      npcPos.z = Math.min(npcPos.z + (gz / goalDist) * step, NET_Z - 0.5)
    }
    npcState.facing = 0 // always face the net

    // ----- The ball -----
    if (g.phase === 'serve') {
      if (g.server === PLAYER) {
        g.pos.set(playerPos.x - 0.35, playerPos.y + 0.1, playerPos.z - 0.35)
      } else {
        g.pos.set(npcPos.x - 0.35, 1.0, npcPos.z + 0.35)
        g.timer += dt
        if (g.timer > 1.6 && !npcState.moving) npcHit(true)
      }
    } else {
      for (let i = 0; i < 4; i++) if (!stepBall(dt / 4)) break

      if (g.phase === 'rally') {
        // You hit it if you swing while it's close (before or after it bounces)
        if (
          t < playerState.swingUntil &&
          g.lastHitter === NPC &&
          sideOf(g.pos.z) === PLAYER &&
          flatDistance(g.pos, playerPos) < (playerState.diving ? DIVE_REACH : REACH) &&
          g.pos.y < playerPos.y + 1.5
        ) {
          playerHit()
        }
        // Edson hits it after it bounces once
        if (
          g.lastHitter === PLAYER &&
          g.bounces === 1 &&
          sideOf(g.pos.z) === NPC &&
          !g.npcSwung &&
          flatDistance(g.pos, npcPos) < 1.3 &&
          g.pos.y < 2.2
        ) {
          g.npcSwung = true
          if (g.npcWillMiss) npcState.swingUntil = t + SWING_TIME
          else npcHit(false)
        }
      }

      if (g.phase === 'point') {
        g.timer += dt
        if (g.timer > 1.8) {
          const [mine, theirs] = g.score
          if (Math.max(mine, theirs) >= WIN_SCORE && Math.abs(mine - theirs) >= 2) {
            setGame({ mode: 'talk', dialogue: mine > theirs ? 'won' : 'lost', message: '' })
          } else {
            startServe(g.lastWinner)
          }
        }
      }
    }
    ballMesh.current.position.copy(g.pos)
  })

  return (
    <>
      <CourtLines />
      <Net />
      <mesh ref={ballMesh} castShadow>
        <sphereGeometry args={[BALL_R, 16, 12]} />
        <meshStandardMaterial color="#e8f03c" emissive="#3d4200" />
      </mesh>
    </>
  )
}

function Line({ x, z, w, l }) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, z]}>
      <planeGeometry args={[w, l]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  )
}

// Chalk lines on the road
export function CourtLines() {
  const W = 0.07
  return (
    <>
      <Line x={-HALF_W} z={NET_Z} w={W} l={HALF_L * 2} />
      <Line x={HALF_W} z={NET_Z} w={W} l={HALF_L * 2} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Line x={0} z={NET_Z + s * HALF_L} w={HALF_W * 2} l={W} />
          <Line x={0} z={NET_Z + s * KITCHEN} w={HALF_W * 2} l={W} />
          <Line x={0} z={NET_Z + s * (KITCHEN + HALF_L) / 2} w={W} l={HALF_L - KITCHEN} />
        </group>
      ))}
    </>
  )
}

// Portable net across the road
export function Net() {
  const width = HALF_W * 2 + 0.6
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[0, 0.5, NET_Z]}>
        <CuboidCollider args={[width / 2, 0.5, 0.05]} />
      </RigidBody>
      <mesh position={[0, NET_H / 2 + 0.03, NET_Z]}>
        <planeGeometry args={[width, NET_H - 0.06]} />
        <meshStandardMaterial map={netTexture([width * 8, NET_H * 8])} transparent alphaTest={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh castShadow position={[0, NET_H, NET_Z]}>
        <boxGeometry args={[width, 0.06, 0.03]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * width / 2, NET_H / 2, NET_Z]}>
          <cylinderGeometry args={[0.03, 0.03, NET_H, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </>
  )
}
