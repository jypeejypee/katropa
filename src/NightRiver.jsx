// ============================================================
//  The Pasig River at night (only shows at night; the daytime water is in Bridgetowne.jsx).
//  The water turns night-sky blue and shiny, the riverside lamps glow,
//  and each lamp makes a long wobbly reflection on the water toward you.
// ============================================================
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rng } from './world.js'
import { useGame } from './game.js'
import { riverTexture } from './textures.js'
import { RIVER } from './bridgetowne.js'

const WATER_Y = -2.6
// Lamp posts on both riverside walks: x positions, and how far from the water they stand
export const RIVER_LAMPS = [-18, -30, -42, -54, -66]
export const LAMP_BANK = 1.2
const HEAD_Y = 3.14 // the bottom of the lamp head
const STREAK = { length: 44, width: 1.3 }

export default function NightRiver() {
  const { time } = useGame()
  if (time !== 'night') return null
  return (
    <>
      <NightWater />
      {/* south bank (in front of the towers) and north bank (the GBF Center side) */}
      <LampReflections z={RIVER[0] - LAMP_BANK} side={-1} />
      <LampReflections z={RIVER[1] + LAMP_BANK} side={1} />
    </>
  )
}

// A layer just on top of the daytime water: the same moving pattern, but blue like the night sky and shiny
function NightWater() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_Y + 0.01, (RIVER[0] + RIVER[1]) / 2]}>
      <planeGeometry args={[640, RIVER[1] - RIVER[0]]} />
      {/* emissive: the soft blue of the night sky reflected on the water (so it's never just black) */}
      <meshStandardMaterial map={riverTexture([48, 5])} color="#7f9ce0" roughness={0.12} metalness={0.15}
        emissive="#22406f" emissiveMap={riverTexture([48, 5])} emissiveIntensity={1.4} />
    </mesh>
  )
}

// The glowing lamp heads, and their wobbly reflections on the water.
// side: -1 = lamps on the south bank, 1 = north bank.
function LampReflections({ z, side }) {
  const streaks = useRef([])
  const textures = useMemo(() => ({ glints: streakTexture(), shape: streakShape() }), [])

  useFrame(({ camera, clock }) => {
    textures.glints.offset.y = (clock.elapsedTime * 0.06) % 1
    // you see a lamp's reflection only from across the water (not from behind the lamp on its own bank)
    const show = side < 0 ? camera.position.z > RIVER[0] : camera.position.z < RIVER[1]
    streaks.current.forEach((streak, i) => {
      if (!streak) return
      streak.visible = show
      if (!show) return
      // the reflection points from the lamp toward you, starting at the edge of the water
      const lx = RIVER_LAMPS[i]
      const dx = camera.position.x - lx
      const dz = camera.position.z - z
      const d = Math.hypot(dx, dz) || 1
      const along = LAMP_BANK + 0.3 + STREAK.length / 2
      const sz = THREE.MathUtils.clamp(z + (dz / d) * along, RIVER[0] + 0.5, RIVER[1] - 0.5)
      streak.position.set(lx + (dx / d) * along, WATER_Y + 0.03, sz)
      streak.rotation.set(0, Math.atan2(dx, dz), 0)
    })
  })

  return RIVER_LAMPS.map((x, i) => (
    <group key={x}>
      {/* the glowing bottom of the lamp head, with a soft glow around it */}
      <mesh position={[x, HEAD_Y, z]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.34, 0.34]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <sprite position={[x, HEAD_Y - 0.1, z]} scale={[1.6, 1.6, 1]}>
        <spriteMaterial map={glowTexture()} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <group ref={(g) => (streaks.current[i] = g)}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
          <planeGeometry args={[STREAK.width, STREAK.length]} />
          <meshBasicMaterial map={textures.glints} alphaMap={textures.shape} transparent blending={THREE.AdditiveBlending}
            depthWrite={false} fog={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  ))
}

// Soft round warm glow around a lamp
let glow = null
function glowTexture() {
  if (glow) return glow
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255, 214, 140, 0.8)')
  g.addColorStop(0.3, 'rgba(255, 190, 110, 0.25)')
  g.addColorStop(1, 'rgba(255, 190, 110, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  glow = new THREE.CanvasTexture(canvas)
  glow.colorSpace = THREE.SRGBColorSpace
  return glow
}

// Warm broken lines, like light on small waves (it repeats and slowly moves)
function streakTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 32, 256)
  const random = rng(64)
  for (let i = 0; i < 170; i++) {
    ctx.fillStyle = `rgba(255, 200, 120, ${0.4 + random() * 0.6})`
    ctx.fillRect(random() * 18, random() * 256, 8 + random() * 14, 1 + random() * 3)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 4)
  return texture
}

// Bright at the lamp end (the top of the picture), fading toward you and at the sides
function streakShape() {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  for (let y = 0; y < 128; y++) {
    const fromLamp = y / 128
    for (let x = 0; x < 16; x++) {
      const side = Math.abs(x - 7.5) / 8
      const v = Math.round(255 * (1 - fromLamp) ** 0.9 * (1 - side * side))
      ctx.fillStyle = `rgb(${v}, ${v}, ${v})`
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return new THREE.CanvasTexture(canvas)
}
