import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import { rng } from './world.js'
import { getGame } from './game.js'
import { VICTOR, LAMP_ARM, LAMP_HEIGHT, SIDE_ROAD } from './bridgetowne.js'
import {
  finTexture, hexTexture, glassTexture, blackLouverTexture, constructionTexture, podiumTexture,
  hoardingTexture, railBarsTexture, signTexture, louverTexture,
} from './textures.js'

const yAxis = new THREE.Vector3(0, 1, 0)
const zAxis = new THREE.Vector3(0, 0, 1)
const GOLD = '#c79c58'
const TAN = '#c8904f' // the rattan-colored coils on the bridge

// Shared materials that glow at night (NightLights.jsx turns them on)
export const victorMaterial = new THREE.MeshStandardMaterial({ color: '#b9bdc3', metalness: 0.45, roughness: 0.4 })
export const nightGlass = new THREE.MeshStandardMaterial({
  color: '#cfdde8', map: glassTexture([9, 26]), metalness: 0.3, roughness: 0.15,
  emissive: '#ffe2a8', emissiveMap: glassTexture([9, 26]), emissiveIntensity: 0,
})

export function Box({ size, position, color, rotation, ...material }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} {...material} />
    </mesh>
  )
}

// A flat wall picture facing one way: 'west' (-x), 'east' (+x), 'north' (+z) or 'south' (-z).
// w = width along the wall, h = height, y = middle height.
const FACING = { west: -Math.PI / 2, east: Math.PI / 2, north: 0, south: Math.PI }
export function Face({ facing, x, y, z, w, h, ...material }) {
  return (
    <mesh position={[x, y, z]} rotation={[0, FACING[facing], 0]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial {...material} />
    </mesh>
  )
}

// Solid invisible box between two corners (so the player can't walk into a building)
export function Solid({ x: [x0, x1], y: [y0, y1] = [0, 10], z: [z0, z1] }) {
  return (
    <RigidBody type="fixed" colliders={false} position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]}>
      <CuboidCollider args={[(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2]} />
    </RigidBody>
  )
}

// A tapered cylinder from one point to another (arms and legs of The Victor)
function Segment({ from, to, r1, r2, material }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = b.clone().sub(a)
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(yAxis, dir.clone().normalize()),
      length: dir.length(),
    }
  }, [from, to])
  return (
    <mesh castShadow position={position} quaternion={quaternion} material={material}>
      <cylinderGeometry args={[r2, r1, length, 14]} />
    </mesh>
  )
}

function Ball({ position, r, scale, material }) {
  return (
    <mesh castShadow position={position} scale={scale} material={material}>
      <sphereGeometry args={[r, 18, 12]} />
    </mesh>
  )
}

// ---------- The Victor ----------
// The giant silver man with his right fist up, at the Pasig end of the bridge.
// Built facing -z, so you see his back when you walk over the bridge (like in the photos).
// His right side is +x. He stands on the right side of the road, just past the bridge.
export function Victor() {
  const m = victorMaterial
  const base = 1.2 // height of the round planter he stands on
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[VICTOR.x, base / 2, VICTOR.z]}>
        <CylinderCollider args={[base / 2, 6.2]} />
      </RigidBody>
      <group position={[VICTOR.x, 0, VICTOR.z]}>
        {/* Round planter */}
        <mesh castShadow receiveShadow position={[0, base / 2, 0]}>
          <cylinderGeometry args={[6.2, 6.4, base, 40]} />
          <meshStandardMaterial color="#cfcac0" />
        </mesh>
        <mesh receiveShadow position={[0, base + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[6, 40]} />
          <meshStandardMaterial color="#5c7f3a" />
        </mesh>
        {Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2
          return (
            <mesh key={i} castShadow position={[Math.cos(a) * 5.3, base + 0.35, Math.sin(a) * 5.3]} scale={[1, 0.7, 1]}>
              <icosahedronGeometry args={[0.6, 0]} />
              <meshStandardMaterial color={i % 3 ? '#4f7a33' : '#b5443a'} flatShading />
            </mesh>
          )
        })}

        <group position={[0, base, 0]}>
          {/* Legs */}
          {[-1, 1].map((s) => (
            <group key={s}>
              <Segment from={[s * 2.4, 23, 0]} to={[s * 2.9, 12.5, -0.3]} r1={2.5} r2={1.8} material={m} />
              <Ball position={[s * 2.9, 12.5, -0.3]} r={1.75} material={m} />
              <Segment from={[s * 2.9, 12.5, -0.3]} to={[s * 3.3, 1.6, 0]} r1={1.7} r2={0.95} material={m} />
              <mesh castShadow position={[s * 3.3, 0.7, -0.9]} material={m}>
                <boxGeometry args={[1.8, 1.4, 4]} />
              </mesh>
            </group>
          ))}
          <Ball position={[0, 24, 0.2]} r={3.6} scale={[1.3, 0.95, 0.9]} material={m} />
          {/* Body, chest and shoulders */}
          <mesh castShadow position={[0, 30.5, 0]} scale={[1, 1, 0.68]} material={m}>
            <cylinderGeometry args={[4.4, 3.3, 12, 20]} />
          </mesh>
          <Ball position={[0, 35.6, 0]} r={4.5} scale={[1.15, 0.7, 0.7]} material={m} />
          <Segment from={[0, 37.5, 0]} to={[0, 41, -0.1]} r1={1.5} r2={1.3} material={m} />
          <Ball position={[0, 43.5, -0.2]} r={2.7} scale={[0.9, 1.15, 1]} material={m} />
          {/* Right arm up, fist to the sky */}
          <Ball position={[4.9, 36.5, 0]} r={1.8} material={m} />
          <Segment from={[4.9, 36.5, 0]} to={[6.3, 45, 0.3]} r1={1.6} r2={1.25} material={m} />
          <Ball position={[6.3, 45, 0.3]} r={1.25} material={m} />
          <Segment from={[6.3, 45, 0.3]} to={[6.6, 53, -0.3]} r1={1.25} r2={0.95} material={m} />
          <Ball position={[6.6, 54.4, -0.3]} r={1.6} scale={[1, 1.1, 1]} material={m} />
          {/* Left arm down, fist closed */}
          <Ball position={[-4.9, 36.5, 0]} r={1.8} material={m} />
          <Segment from={[-4.9, 36.5, 0]} to={[-6.0, 28.5, 0.2]} r1={1.6} r2={1.2} material={m} />
          <Ball position={[-6.0, 28.5, 0.2]} r={1.2} material={m} />
          <Segment from={[-6.0, 28.5, 0.2]} to={[-6.6, 21, -0.2]} r1={1.2} r2={0.9} material={m} />
          <Ball position={[-6.7, 19.8, -0.3]} r={1.4} material={m} />
        </group>
      </group>
    </>
  )
}

// ---------- The rattan coils on the bridge ----------
// A long tube (the spine) with rings hanging from it, rising into big arches here and there.
// x: where it runs, z0 to z1: from where to where, arches: [middle z, how high, half its length]
function coilPath({ x, z0, z1, base, wave = 0, phase = 0, arches = [] }) {
  const points = []
  for (let z = z0; z <= z1 + 0.01; z += 2) {
    let y = base + wave * Math.sin(z * 0.3 + phase)
    for (const [mid, height, half] of arches) {
      const t = (z - mid) / half
      if (Math.abs(t) < 1) y += height * Math.cos((t * Math.PI) / 2) ** 2
    }
    // The ends dip down to the ground
    const end = Math.min(z - z0, z1 - z) / 6
    if (end < 1) y = 0.5 + (y - 0.5) * end
    points.push(new THREE.Vector3(x, y, z))
  }
  return points
}

function coilGeometry(strands, spacing) {
  const parts = []
  const ring = new THREE.TorusGeometry(0.9, 0.07, 4, 12)
  const q = new THREE.Quaternion()
  const m = new THREE.Matrix4()
  const down = new THREE.Vector3()
  const one = new THREE.Vector3(1, 1, 1)
  for (const strand of strands) {
    const curve = new THREE.CatmullRomCurve3(coilPath(strand))
    const length = curve.getLength()
    parts.push(new THREE.TubeGeometry(curve, Math.ceil(length * 1.5), 0.2, 8, false))
    const count = Math.floor(length / spacing)
    for (let i = 1; i < count; i++) {
      const p = curve.getPointAt(i / count)
      const t = curve.getTangentAt(i / count)
      q.setFromUnitVectors(zAxis, t)
      // hang the ring below the spine (straight down, but square to the spine)
      down.set(0, -1, 0).addScaledVector(t, t.y).normalize()
      p.addScaledVector(down, 0.8)
      parts.push(ring.clone().applyMatrix4(m.compose(p, q, one)))
    }
  }
  const merged = mergeGeometries(parts)
  parts.forEach((g) => g.dispose())
  return merged
}

// side: -1 = left of the road, 1 = right
export function Coils({ side, z0, z1, arches }) {
  const geometry = useMemo(() => {
    const x = side * 13.4
    const spacing = getGame().quality === 'low' ? 1.0 : 0.6
    return coilGeometry([
      { x, z0, z1, base: 2.0, arches },
      { x: x + side * 0.7, z0: z0 + 3, z1: z1 - 3, base: 1.9, wave: 0.9, phase: side, arches: arches.map(([z, h, w]) => [z + 4, h * 0.55, w]) },
    ], spacing)
  }, [side, z0, z1, arches])
  return (
    <mesh castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial color={TAN} roughness={0.55} />
    </mesh>
  )
}

// ---------- Opus ----------
// The long mall on the right before the bridge: dark fins, big copper hexagon panels in gold frames,
// the orange tunnel through the building (the road to Ortigas Ave), and the dark tower above it.
const OPUS = { x0: 16, x1: 66, z0: 29, z1: 146, h: 30 }

// Copper hexagons in a gold frame on the front of Opus
function HexPanel({ z0, z1, y0, y1 }) {
  const w = z1 - z0
  const h = y1 - y0
  const x = OPUS.x0 - 0.06
  return (
    <group>
      <Face facing="west" x={x} y={(y0 + y1) / 2} z={(z0 + z1) / 2} w={w} h={h} map={hexTexture([w / 3.2, h / 2.77])} roughness={0.6} />
      {[y0, y1].map((y) => <Box key={y} size={[0.5, 0.4, w + 0.4]} position={[x - 0.15, y, (z0 + z1) / 2]} color={GOLD} metalness={0.5} roughness={0.4} />)}
      {[z0, z1].map((z) => <Box key={z} size={[0.5, h, 0.4]} position={[x - 0.15, (y0 + y1) / 2, z]} color={GOLD} metalness={0.5} roughness={0.4} />)}
    </group>
  )
}

export function Opus() {
  const { x0, x1, z0, z1, h } = OPUS
  const [t0, t1] = SIDE_ROAD // the tunnel to Ortigas Ave goes through here
  const top = 11 // height of the tunnel
  const xm = (x0 + x1) / 2
  const depth = x1 - x0
  // The front wall between two z's: fins above, shops on the ground floor under a dark canopy
  const front = (a, b, shops = true) => (
    <group key={a}>
      <Face facing="west" x={x0 - 0.03} y={18} z={(a + b) / 2} w={b - a} h={24} map={finTexture([(b - a) / 4, 12])} />
      {shops && <Face facing="west" x={x0 - 0.04} y={3} z={(a + b) / 2} w={b - a} h={6} map={glassTexture([(b - a) / 3, 2])} color="#8d98a2" />}
      {shops && <Box size={[2, 0.3, b - a]} position={[x0 - 1, 5.6, (a + b) / 2]} color="#1e1f21" />}
    </group>
  )
  return (
    <>
      {/* The building, in two parts with the tunnel between them (and the floors above the tunnel) */}
      <Solid x={[x0, x1]} y={[0, h]} z={[z0, t0]} />
      <Solid x={[x0, x1]} y={[0, h]} z={[t1, z1]} />
      <Solid x={[x0, x1]} y={[top, h]} z={[t0, t1]} />
      <Box size={[depth, h, t0 - z0]} position={[xm, h / 2, (z0 + t0) / 2]} color="#2b2e32" />
      <Box size={[depth, h, z1 - t1]} position={[xm, h / 2, (t1 + z1) / 2]} color="#2b2e32" />
      <Box size={[depth, h - top, t1 - t0]} position={[xm, (h + top) / 2, (t0 + t1) / 2]} color="#2b2e32" />

      {front(z0, t0 - 1.6)}
      {front(t1 + 1.6, z1)}
      <Face facing="west" x={x0 - 0.03} y={(top + 3 + h) / 2} z={(t0 + t1) / 2} w={t1 - t0 + 3.2} h={h - top - 3}
        map={finTexture([(t1 - t0) / 4, 8])} />
      {/* Fins on the side facing the river */}
      <Face facing="south" x={xm} y={18} z={z0 - 0.03} w={depth} h={24} map={finTexture([depth / 4, 12])} />
      <Box size={[0.3, 0.3, z1 - z0]} position={[x0 - 0.15, h - 0.15, (z0 + z1) / 2]} color={GOLD} metalness={0.5} roughness={0.4} />

      <HexPanel z0={30} z1={37.5} y0={14} y1={28} />
      <HexPanel z0={56} z1={70} y0={8} y1={24} />
      <HexPanel z0={76} z1={92} y0={9} y1={29} />
      <HexPanel z0={108} z1={126} y0={7} y1={29} />
      <HexPanel z0={130} z1={144} y0={10} y1={28} />
      {/* Glass box on the front, by the bridge */}
      <Box size={[1.5, 6, 6]} position={[x0 - 0.75, 9, 32]} color="#cfdde8" map={glassTexture([2, 2])} metalness={0.3} roughness={0.15} />

      {/* ---- The tunnel to Ortigas Ave: orange frame, dark wooden slats, rows of lights ---- */}
      {[t0 - 0.8, t1 + 0.8].map((z) => <Box key={z} size={[0.7, top + 2, 1.6]} position={[x0 - 0.35, (top + 2) / 2, z]} color="#c4683e" />)}
      <Box size={[0.7, 2, t1 - t0 + 3.2]} position={[x0 - 0.35, top + 1, (t0 + t1) / 2]} color="#c4683e" />
      <Face facing="north" x={xm} y={top / 2} z={t0 + 0.02} w={depth} h={top} map={louverTexture([depth / 2, 3])} />
      <Face facing="south" x={xm} y={top / 2} z={t1 - 0.02} w={depth} h={top} map={louverTexture([depth / 2, 3])} />
      <mesh position={[xm, top - 0.02, (t0 + t1) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[depth, t1 - t0]} />
        <meshStandardMaterial map={louverTexture([depth / 2, 3])} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => x0 + 3 + i * 6.5).map((x) =>
        [t0 + 2.5, (t0 + t1) / 2, t1 - 2.5].map((z) => (
          <mesh key={`${x}${z}`} position={[x, top - 0.05, z]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshStandardMaterial color="#fff2cc" emissive="#fff2cc" emissiveIntensity={0.9} />
          </mesh>
        ))
      )}
      {/* Green road sign inside the tunnel */}
      <Face facing="west" x={x0 + 1} y={top - 1.2} z={(t0 + t1) / 2} w={4.4} h={1.1}
        map={signTexture({ text: 'ORTIGAS AVE', bg: '#1f6b3a', fg: '#ffffff' }, 4.4, 1.1)} />

      {/* The tower above the tunnel: dark with gold fins */}
      <Box size={[24, 76, 30]} position={[34, h + 38, 44]} color="#ffffff" map={finTexture([7, 38])} />
      {[[22, 29], [46, 29], [22, 59], [46, 59]].map(([x, z]) => (
        <Box key={`${x}${z}`} size={[0.6, 76, 0.6]} position={[x, h + 38, z]} color={GOLD} metalness={0.5} roughness={0.4} />
      ))}
      <Box size={[25, 2, 31]} position={[34, h + 77, 44]} color="#1e2023" />
    </>
  )
}

// ---------- GBF Center ----------
// Office tower on the left, right where the bridge starts (from the Street View photo):
// a glass tower that comes almost down to the ground, a black block of thin louvers on the side-street face,
// a glass corner, grey stone pillars, and the glass ground floor with MERIENDA set back under it.
// Main road face = x -16.2 (facing +x), side-street face = z 52 (facing -z).
const GBF = { x0: -50, x1: -16.2, z0: 56, z1: 106, lift: 5.5, h: 110 }

export function GbfCenter() {
  const { x0, x1, z0, z1, lift, h } = GBF
  const xm = (x0 + x1) / 2
  const zm = (z0 + z1) / 2
  const back = 2.5 // how far the ground floor is set back under the building
  const pillar = (x, z) => (
    <group key={`${x}${z}`}>
      <Solid x={[x - 0.45, x + 0.45]} y={[0, lift]} z={[z - 0.45, z + 0.45]} />
      <Box size={[0.9, lift, 0.9]} position={[x, lift / 2, z]} color="#8f8e8b" roughness={0.5} />
    </group>
  )
  return (
    <>
      {/* The building above the ground floor (solid, so the camera stays outside) */}
      <Solid x={[x0, x1]} y={[lift, 45]} z={[z0, z1]} />
      <mesh castShadow receiveShadow position={[xm, lift + (h - lift) / 2, zm]} material={nightGlass}>
        <boxGeometry args={[x1 - x0, h - lift, z1 - z0]} />
      </mesh>
      {/* Light ceiling under the building */}
      <Box size={[x1 - x0 + 0.2, 0.3, z1 - z0 + 0.2]} position={[xm, lift - 0.1, zm]} color="#d9d6d0" />

      {/* Black louver block on the side-street face, next to the glass corner */}
      <Box size={[x1 - 9 - x0 + 0.2, 40, 24]} position={[(x0 - 0.2 + x1 - 9) / 2, lift + 20, z0 + 11.8]} color="#ffffff" map={blackLouverTexture([8, 10])} />
      {/* Glass corner: slightly sticking out, reflecting the sky */}
      <Box size={[9, 40, 1]} position={[x1 - 4.5, lift + 20, z0 - 0.3]} color="#d7e3ec" map={glassTexture([3, 12])} metalness={0.4} roughness={0.08} />

      {/* Glass ground floor, set back behind the pillars */}
      <Solid x={[x0, x1 - back]} y={[0, lift]} z={[z0 + back, z1]} />
      <Box size={[x1 - back - x0, lift, z1 - z0 - back]} position={[(x0 + x1 - back) / 2, lift / 2, (z0 + back + z1) / 2]} color="#3a3f44" />
      <Face facing="east" x={x1 - back + 0.02} y={lift / 2} z={(z0 + back + z1) / 2} w={z1 - z0 - back} h={lift}
        map={glassTexture([12, 2])} color="#eef3f6" />
      <Face facing="south" x={(x0 + x1 - back) / 2} y={lift / 2} z={z0 + back - 0.02} w={x1 - back - x0} h={lift}
        map={glassTexture([10, 2])} color="#cfd7dd" />
      <Face facing="east" x={x1 - back + 0.04} y={3.9} z={z0 + 8} w={5} h={0.8}
        map={signTexture({ text: 'MERIENDA by Pan de Manila', bg: '#1d2a3a', fg: '#ffffff' }, 5, 0.8)} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => pillar(x1 - 1, z0 + 1 + i * 8))}
      {[1, 2, 3, 4].map((i) => pillar(x1 - 1 - i * 8, z0 + 1))}
      {/* Black stone sign at the corner */}
      <Box size={[0.8, 2.4, 3]} position={[-14.6, 1.2, 53.5]} color="#1d1d1f" roughness={0.3} />
      <Face facing="east" x={-14.18} y={1.5} z={53.5} w={2.4} h={1}
        map={signTexture({ text: 'GBF CENTER', bg: '#1d1d1f', fg: '#e6e6e6' }, 2.4, 1)} />
      <Solid x={[-15, -14.2]} y={[0, 2.4]} z={[52, 55]} />
    </>
  )
}

// ---------- After the bridge ----------
// Round towers still being built (green safety nets, cranes) behind a blue-grey fence on the left,
// and a finished glass tower on the right past The Victor.
function RoundTower({ x, z, rx, rz, y = 0, height, map, material }) {
  return (
    <group position={[x, y + height / 2, z]} scale={[rx, 1, rz]}>
      <mesh castShadow receiveShadow material={material}>
        <cylinderGeometry args={[1, 1, height, 28]} />
        {!material && <meshStandardMaterial map={map} />}
      </mesh>
      {/* green glass ledge where the tower meets the parking floors */}
      <mesh position={[0, -height / 2 + 0.5, 0]}>
        <cylinderGeometry args={[1.18, 1.18, 0.3, 28]} />
        <meshStandardMaterial color="#5fae8f" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

function Crane({ x, y, z, turn = 0 }) {
  return (
    <group position={[x, y, z]} rotation={[0, turn, 0]}>
      <Box size={[1.2, 32, 1.2]} position={[0, 16, 0]} color="#e9e6df" />
      <Box size={[44, 1, 1]} position={[14, 32.5, 0]} color="#e9e6df" />
      <Box size={[12, 1.2, 1.2]} position={[-8, 32.5, 0]} color="#e9e6df" />
      <Box size={[3, 2.5, 1.6]} position={[-12, 31.5, 0]} color="#8d8d8d" />
      <Box size={[2, 2, 2]} position={[0, 31, 1.4]} color="#d8b43a" />
      <Box size={[0.08, 26, 0.08]} position={[28, 19.5, 0]} color="#333333" />
    </group>
  )
}

export function Towers() {
  const net = constructionTexture([4, 8])
  return (
    <>
      {/* Fence around the construction site (along the road and along the riverside walk) */}
      <Solid x={[-14.1, -13.9]} y={[0, 3]} z={[-130, -38]} />
      <Solid x={[-70, -14]} y={[0, 3]} z={[-38.1, -37.9]} />
      <Box size={[0.15, 3, 92]} position={[-14, 1.5, -84]} color="#ffffff" map={hoardingTexture([30, 1])} />
      <Box size={[56, 3, 0.15]} position={[-42, 1.5, -38]} color="#ffffff" map={hoardingTexture([19, 1])} />

      <Box size={[66, 14, 74]} position={[-51, 7, -81]} color="#ffffff" map={podiumTexture([16, 3])} />
      <RoundTower x={-38} z={-72} rx={13} rz={10} y={14} height={98} map={net} />
      <RoundTower x={-68} z={-56} rx={10} rz={8.5} y={14} height={80} map={constructionTexture([3, 7])} />
      <Box size={[20, 70, 15]} position={[-50, 49, -106]} color="#ffffff" map={constructionTexture([5, 6])} />
      <Crane x={-46} y={84} z={-106} />
      <Crane x={-38} y={112} z={-72} turn={0.9} />

      {/* Finished glass tower on the right, past The Victor */}
      <Solid x={[27, 61]} y={[0, 10]} z={[-130, -95]} />
      <Box size={[34, 10, 35]} position={[44, 5, -112.5]} color="#ffffff" map={podiumTexture([8, 2])} />
      <RoundTower x={44} z={-112.5} rx={12} rz={10} y={10} height={88} material={nightGlass} />
    </>
  )
}

// ---------- Small things ----------

// Tall royal palm: smooth grey trunk, green top, drooping fronds
export function Palm({ x, z, height = 12, seed = 1 }) {
  const fronds = useMemo(() => {
    const random = rng(seed * 31 + 7)
    return Array.from({ length: 9 }, (_, i) => ({ turn: (i / 9) * Math.PI * 2 + random() * 0.4, droop: 0.3 + random() * 0.5 }))
  }, [seed])
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[x, height / 2, z]}>
        <CylinderCollider args={[height / 2, 0.3]} />
      </RigidBody>
      <group position={[x, 0, z]}>
        <mesh castShadow position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.22, 0.35, height, 8]} />
          <meshStandardMaterial color="#aaa69d" />
        </mesh>
        <mesh castShadow position={[0, height + 0.7, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 1.4, 8]} />
          <meshStandardMaterial color="#5f7d3b" />
        </mesh>
        {fronds.map(({ turn, droop }, i) => (
          <group key={i} position={[0, height + 1.3, 0]} rotation={[0, turn, 0]}>
            <group rotation={[-0.5, 0, 0]}>
              <mesh castShadow position={[0, 0, 1.1]}>
                <boxGeometry args={[0.7, 0.04, 2.2]} />
                <meshStandardMaterial color="#4c7a33" side={THREE.DoubleSide} />
              </mesh>
              <group position={[0, 0, 2.2]} rotation={[0.5 + droop, 0, 0]}>
                <mesh castShadow position={[0, 0, 1.1]}>
                  <boxGeometry args={[0.6, 0.04, 2.2]} />
                  <meshStandardMaterial color="#5a8a3a" side={THREE.DoubleSide} />
                </mesh>
              </group>
            </group>
          </group>
        ))}
      </group>
    </>
  )
}

// Black street light on the median with a lamp on each side
export function DoubleLamp({ z }) {
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[0, LAMP_HEIGHT / 2, z]}>
        <CylinderCollider args={[LAMP_HEIGHT / 2, 0.15]} />
      </RigidBody>
      <mesh castShadow position={[0, (LAMP_HEIGHT + 1.2) / 2, z]}>
        <cylinderGeometry args={[0.09, 0.15, LAMP_HEIGHT + 1.2, 8]} />
        <meshStandardMaterial color="#2a2c2e" />
      </mesh>
      <Box size={[LAMP_ARM * 2 + 0.4, 0.08, 0.08]} position={[0, LAMP_HEIGHT + 0.15, z]} color="#2a2c2e" />
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.8, 0.12, 0.35]} position={[s * LAMP_ARM, LAMP_HEIGHT + 0.06, z]} color="#3a3d40" />
      ))}
    </>
  )
}

// Stainless steel post with a yellow band (between the bike lane and the cars). Solid, so you bump into it.
export function Bollard({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <RigidBody type="fixed" colliders={false} position={[0, 0.45, 0]}>
        <CylinderCollider args={[0.45, 0.1]} />
      </RigidBody>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.9, 10]} />
        <meshStandardMaterial color="#c9cdd1" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <cylinderGeometry args={[0.103, 0.103, 0.08, 10]} />
        <meshStandardMaterial color="#e6c21e" />
      </mesh>
    </group>
  )
}

// Round white concrete bowl with a small tree
export function Bowl({ x, z, seed = 1 }) {
  const random = rng(seed * 13 + 5)
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[x, 0.4, z]}>
        <CylinderCollider args={[0.4, 0.8]} />
      </RigidBody>
      <group position={[x, 0, z]}>
        <mesh castShadow receiveShadow position={[0, 0.42, 0]} scale={[1, 0.62, 1]}>
          <sphereGeometry args={[0.85, 16, 10]} />
          <meshStandardMaterial color="#d7d9d6" />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 1.4, 6]} />
          <meshStandardMaterial color="#5b4a3a" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} castShadow position={[(random() - 0.5) * 0.6, 2.0 + i * 0.35, (random() - 0.5) * 0.6]}>
            <icosahedronGeometry args={[0.55 - i * 0.1, 0]} />
            <meshStandardMaterial color={['#5f8a3b', '#4e7a2e', '#6e9443'][i]} flatShading />
          </mesh>
        ))}
      </group>
    </>
  )
}

// Railing along a straight line from [x, z] to [x, z]: posts, a top rail, and thin bars.
// It's solid, so the player can't fall into the river.
export function Railing({ from, to, color = '#3a2b24', height = 1.15 }) {
  const [ax, az] = from
  const [bx, bz] = to
  const length = Math.hypot(bx - ax, bz - az)
  const angle = Math.atan2(-(bz - az), bx - ax)
  const mid = [(ax + bx) / 2, (az + bz) / 2]
  const posts = Math.max(1, Math.round(length / 2.5))
  return (
    <>
      <Solid x={[Math.min(ax, bx) - 0.1, Math.max(ax, bx) + 0.1]} y={[0, height + 0.3]} z={[Math.min(az, bz) - 0.1, Math.max(az, bz) + 0.1]} />
      <group position={[mid[0], 0, mid[1]]} rotation={[0, angle, 0]}>
        <Box size={[length, 0.12, 0.22]} position={[0, height, 0]} color={color} />
        <Box size={[length, 0.06, 0.06]} position={[0, 0.15, 0]} color={color} />
        {Array.from({ length: posts + 1 }, (_, i) => (
          <Box key={i} size={[0.22, height + 0.1, 0.22]} position={[-length / 2 + (i * length) / posts, (height + 0.1) / 2, 0]} color={color} />
        ))}
        <mesh position={[0, height / 2 + 0.05, 0]}>
          <planeGeometry args={[length, height - 0.1]} />
          <meshStandardMaterial map={railBarsTexture([length / 0.16, 1], color)} transparent alphaTest={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  )
}
