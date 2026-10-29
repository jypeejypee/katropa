import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { BUILDING_LINE } from './world.js'
import { ParkedVehicle } from './Vehicles.jsx'
import { Bamboo } from './Props.jsx'
import {
  panelTexture, windowRowTexture, stoneTexture, slatGateTexture, signTexture,
} from './textures.js'

const W = 15 // width along the street
const D = 12 // depth
const F = D / 2 // the front (compound wall) is at local z = F
const GARAGE = 1.9 // half the width of the garage opening
const WALL_H = 3.3
const ALLEY = 2.5 // the narrow alley on the right side
const POLE_X = 2.4 // the concrete poles: one just right of the garage...
const POLE2_X = 6.4 // ...and one near the alley
const LOGO = signTexture({ text: 'TNLF', bg: '#ffffff', fg: '#111111' }, 0.48, 0.48)
const LETTERS = signTexture({ text: 'TAYTAY NEW LIFE FELLOWSHIP', bg: '#111111', fg: '#ffffff' }, 4.3, 0.4)

// Grey pipe gate across the alley
function AlleyGate({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      {[0.1, 1.3].map((y) => (
        <Box key={y} size={[ALLEY, 0.05, 0.05]} position={[0, y, 0]} color="#8c9196" />
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <Box key={i} size={[0.025, 1.2, 0.025]} position={[-ALLEY / 2 + 0.1 + i * 0.19, 0.7, 0]} color="#8c9196" />
      ))}
    </group>
  )
}

// Tall concrete pole with a painted base (pink, white, green) and posters
function PaintedPole({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <Box size={[0.26, 8.5, 0.26]} position={[0, 4.25, 0]} color="#b7b5b0" />
      <Box size={[0.28, 1.0, 0.28]} position={[0, 0.5, 0]} color="#3fae5a" />
      <Box size={[0.28, 1.3, 0.28]} position={[0, 1.65, 0]} color="#e39aa8" />
      <Box size={[1.4, 0.08, 0.08]} position={[0, 8.0, 0]} color="#777" />
      <Panel size={[0.24, 0.42]} position={[0, 2.4, 0.15]}
        map={signTexture({ text: 'ANAY\n540-0917', bg: '#f6f1ea', fg: '#c62828' }, 0.24, 0.42)} />
      <Panel size={[0.24, 0.6]} position={[0, 1.85, -0.15]} rotation={[0, Math.PI, 0]}
        map={signTexture({ text: 'PA-\nLINIS', bg: '#f3e6e0', fg: '#b71c1c' }, 0.24, 0.6)} />
    </group>
  )
}

function Box({ size, position, color, rotation, map, ...material }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} map={map} {...material} />
    </mesh>
  )
}

function Panel({ size, position, rotation, color, map, transparent, alphaTest }) {
  return (
    <mesh receiveShadow position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} map={map} transparent={transparent} alphaTest={alphaTest} side={THREE.DoubleSide} />
    </mesh>
  )
}

// Taytay New Life Fellowship, built from the Street View picture. Stands on the LEFT side of the road.
// Built facing +z, then turned to face the road (like Building.jsx).
export default function NewLifeFellowship({ z }) {
  const cx = -(BUILDING_LINE + F) // world x of the middle
  // local (x, z) -> world: x = cx + localZ, z = z - localX
  return (
    <>
      {/* Solid parts so you can't walk through (in world coordinates) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[3.6, 4.25, W / 2]} position={[cx - 2.4, 4.25, z]} />
        <CuboidCollider args={[1.4, 2.75, W / 2]} position={[cx + 2.6, 5.75, z]} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <CuboidCollider args={[0.1, WALL_H / 2, (W / 2 - GARAGE) / 2]}
              position={[cx + F - 0.1, WALL_H / 2, z - s * (GARAGE + (W / 2 - GARAGE) / 2)]} />
            <CuboidCollider args={[2.35, 1.5, 0.1]} position={[cx + 3.55, 1.5, z - s * (GARAGE + 0.05)]} />
          </group>
        ))}
      </RigidBody>

      <group position={[cx, 0, z]} rotation={[0, Math.PI / 2, 0]}>
        {/* Ground floor block behind the garage */}
        <Box size={[W, 3, 7.2]} position={[0, 1.5, -2.4]} color="#e9e8e4" />
        {/* Upper floors, sticking out over the garage */}
        <Box size={[W, 5.5, 10]} position={[0, 5.75, -1]} color="#d9dadb" />
        <Panel size={[W, 3.1]} position={[0, 6.95, 4.01]} map={panelTexture([W / 2.2, 2])} />
        {/* Row of windows with the red canopy over them */}
        <Panel size={[W * 0.62, 1.4]} position={[-0.6, 4.25, 4.02]} map={windowRowTexture([6, 1])} />
        <Box size={[W * 0.66, 0.14, 1.0]} position={[-0.6, 5.2, 4.5]} color="#b3262b" />
        <Box size={[W * 0.66, 0.3, 0.06]} position={[-0.6, 5.12, 5.0]} color="#b3262b" />

        {/* White compound wall with dark stones, on both sides of the garage */}
        {[-1, 1].map((s) => {
          const segW = W / 2 - GARAGE
          const x = s * (GARAGE + segW / 2)
          return (
            <group key={s}>
              <Box size={[segW, WALL_H, 0.2]} position={[x, WALL_H / 2, F - 0.1]} color="#f0efeb" />
              {/* Rough dark stones in a white frame, with little lights at the bottom */}
              <Box size={[segW - 1.6, 1.9, 0.06]} position={[x + s * 0.3, 1.2, F + 0.01]} color="#ffffff"
                map={stoneTexture([(segW - 1.6) / 1.2, 1.6])} />
              {[-1, 0, 1].map((i) => (
                <mesh key={i} position={[x + s * 0.3 + i * 1.2, 0.26, F + 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.06, 12]} />
                  <meshStandardMaterial color="#fff6d0" emissive="#ffe9a8" emissiveIntensity={1.5} />
                </mesh>
              ))}
              {/* Tan pillar beside the garage */}
              <Box size={[0.5, 2.6, 0.35]} position={[s * (GARAGE + 0.25), 1.3, F + 0.08]} color="#a88a55" />
              <Box size={[0.2, 3, 4.7]} position={[s * (GARAGE + 0.05), 1.5, 3.55]} color="#e4e2dc" />
            </group>
          )
        })}

        {/* Garage: concrete floor, dark back wall, canopy, wooden slat screen */}
        <Panel size={[GARAGE * 2, 4.8]} position={[0, 0.02, 3.6]} rotation={[-Math.PI / 2, 0, 0]} color="#b9b4aa" />
        <Panel size={[GARAGE * 2, 3]} position={[0, 1.5, 1.21]} color="#3d342d" />
        <Box size={[0.7, 0.45, 0.3]} position={[-0.9, 2.3, 1.4]} color="#e8e8e8" />
        <Box size={[GARAGE * 2 + 0.6, 0.15, 1.3]} position={[0, 3.05, F + 0.15]} color="#9a9a9a" />
        {Array.from({ length: 7 }, (_, i) => (
          <Box key={i} size={[5.4, 0.13, 0.06]} position={[0, 3.3 + i * 0.2, F + 0.05]} color="#c9b48a" />
        ))}
        {[-2.7, 0, 2.7].map((x) => (
          <Box key={x} size={[0.08, 1.45, 0.08]} position={[x, 3.85, F + 0.02]} color="#6d6d6d" />
        ))}
        {/* Grey slat gates: one swung open, one slid to the side */}
        <group position={[-GARAGE, 0, F + 0.05]} rotation={[0, -1.2, 0]}>
          <Panel size={[1.3, 2.9]} position={[0.65, 1.45, 0]} map={slatGateTexture([1, 18])} transparent alphaTest={0.5} />
        </group>
        <Panel size={[1.4, 2.9]} position={[1.2, 1.45, F + 0.08]} map={slatGateTexture([1, 18])} transparent alphaTest={0.5} />

        {/* TNLF sign: black lightbox with a white round logo, on a grey band */}
        <Panel size={[5.4, 0.9]} position={[4.5, 2.65, F + 0.005]} color="#8d8f91" />
        <Box size={[5.0, 0.55, 0.16]} position={[4.6, 2.75, F + 0.08]} color="#111111" />
        <mesh position={[2.45, 2.75, F + 0.165]}>
          <circleGeometry args={[0.24, 24]} />
          <meshStandardMaterial map={LOGO} emissiveMap={LOGO} emissive="#ffffff" emissiveIntensity={0.9} />
        </mesh>
        {/* The letters glow (emissive), so the lightbox shines at night */}
        <mesh position={[4.85, 2.75, F + 0.165]}>
          <planeGeometry args={[4.3, 0.4]} />
          <meshStandardMaterial map={LETTERS} emissiveMap={LETTERS} emissive="#ffffff" emissiveIntensity={0.9} />
        </mesh>
      </group>

      {/* Right side: alley with a grey gate, orange post with meters, concrete pole with pink base */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.1, 0.7, ALLEY / 2]} position={[-BUILDING_LINE, 0.7, z - W / 2 - ALLEY / 2]} />
        <CuboidCollider args={[0.18, 4, 0.18]} position={[-BUILDING_LINE + 0.6, 4, z - POLE_X]} />
        <CuboidCollider args={[0.18, 4, 0.18]} position={[-BUILDING_LINE + 1.2, 4, z - POLE2_X]} />
      </RigidBody>
      <group position={[cx, 0, z]} rotation={[0, Math.PI / 2, 0]}>
        <Panel size={[ALLEY, D]} position={[W / 2 + ALLEY / 2, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} color="#a8a49c" />
        <AlleyGate x={W / 2 + ALLEY / 2} z={F} />
        {/* Yellow square post with electric meters */}
        <Box size={[0.35, 4.6, 0.35]} position={[W / 2 + 0.2, 2.3, F + 0.2]} color="#e6b422" />
        <Box size={[0.32, 0.5, 0.18]} position={[W / 2 + 0.2, 3.3, F + 0.46]} color="#9ea3a6" />
        <Box size={[0.28, 0.35, 0.16]} position={[W / 2 + 0.2, 1.4, F + 0.45]} color="#9ea3a6" />
        <Box size={[0.25, 0.4, 0.15]} position={[W / 2 + 0.2, 4.1, F + 0.45]} color="#7a3b2e" />
        <PaintedPole x={POLE_X} z={F + 0.6} />
        <PaintedPole x={POLE2_X} z={F + 1.2} />
        {/* Bamboo against the wall at the alley end of the planter */}
        <Bamboo position={[W / 2 - 0.7, 1.0, F + 0.45]} seed={8} />
      </group>

      {/* White SUV parked in the garage, facing the road */}
      <ParkedVehicle type="van" color="#f4f4f4" position={[cx + 3.6, 0, z + 0.45]} rotation={Math.PI / 2} />
    </>
  )
}
