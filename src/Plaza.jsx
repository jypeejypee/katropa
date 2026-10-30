import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import { useGame } from './game.js'
import { Tree } from './Props.jsx'
import { Box, Solid } from './BridgetowneLandmarks.jsx'
import { Skateboard } from './Skatepark.jsx'
import Villager from './Villager.jsx'
import { KwekCart, NENA_AVATAR, JUN_AVATAR } from './RecruitSpots.jsx'
import { ANDREW_AVATAR } from './skate.js'
import { RECRUITS } from './recruits.js'
import { concreteTexture, shutterTexture, signTexture, stoneTexture } from './textures.js'
import StaticBatch from './StaticBatch.jsx'

// ============================================================
//  Ang Plaza: the old town plaza you bring back to life.
//  Middle of the square is (0, 0). You arrive at the south side (+z) looking north (-z):
//  the dry fountain in the middle, the old chapel at the back, the basketball court on the right,
//  and empty stalls on the left that open when people join (see recruits.js).
//  What's open is shared by everyone online (game.plaza, from the server).
// ============================================================
const SIZE = 64 // the paved square is SIZE x SIZE meters
const EDGE = SIZE / 2

// Where each recruit's place is: [x, z], and which way it faces
export const STALLS = {
  nena: { at: [-15, 4], facing: Math.PI / 2 },
  jun: { at: [-15, -8], facing: Math.PI / 2 },
  andrew: { at: [14, 13], facing: -Math.PI / 2 },
}
export const BEN_HOME = [3.5, 0, 9.5]

export default memo(function Plaza() {
  return (
    <>
      <StaticBatch>
        <Ground />
        <Chapel />
        <Court />
        <Buildings />
        <Benches />
        {[[-22, 18], [-22, -18], [22, -20], [-8, 24], [8, 24], [24, 24], [-24, 24]].map(([x, z], i) => (
          <Tree key={i} seed={i + 70} position={[x, 0, z]} scale={1.15} />
        ))}
      </StaticBatch>
      <Villager id="ben" name="Lolo Ben" avatar={BEN_AVATAR} position={BEN_HOME} facing={0} />
      <Walls />
      <PlazaLife />
    </>
  )
})

// The parts that change as people join (kept apart, so the still parts above aren't rebuilt)
function PlazaLife() {
  const { plaza } = useGame()
  const open = (id) => plaza.includes(id)
  return (
    <>
      <Fountain flowing={plaza.length >= 3} />
      <Lamps lit={plaza.length} />
      <SariSari open={open('nena')} />
      <KwekSpot open={open('jun')} />
      <SkateCorner open={open('andrew')} />
      {/* The katropa at their places */}
      {open('nena') && <Villager name="Aling Nena" avatar={NENA_AVATAR} position={stallPoint('nena', 0.6, -0.5)} facing={STALLS.nena.facing} />}
      {open('jun') && <Villager name="Kuya Jun" avatar={JUN_AVATAR} position={stallPoint('jun', 0.2, -0.9)} facing={STALLS.jun.facing} />}
      {open('andrew') && <Villager name="Andrew" avatar={ANDREW_AVATAR} position={stallPoint('andrew', -0.5, 0.8)} facing={STALLS.andrew.facing} />}
    </>
  )
}

// A spot at someone's stall (x = along the stall, z = toward the front) in plaza coordinates
function stallPoint(id, x, z) {
  const { at: [sx, sz], facing } = STALLS[id]
  const c = Math.cos(facing)
  const s = Math.sin(facing)
  return [sx + x * c + z * s, 0.02, sz - x * s + z * c]
}

const BEN_AVATAR = {
  model: 'custom', gender: 'male', build: 'slim', skin: '#a4724c',
  eyes: 'sleepy', eyeColor: '#2a1a10', hairStyle: 'bald', hairColor: '#d8d4cc',
  top: 'polo', topColor: '#e8e2c8', bottom: 'pants', bottomColor: '#5a4c3a',
  shoes: 'tsinelas', shoeColor: '#4a3a2a', extra: 'glasses',
}

// Paving, the road around the square, grass beyond it, and one solid floor under everything
function Ground() {
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[200, 0.5, 200]} position={[0, -0.5, 0]} />
      </RigidBody>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#5f7a3c" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[SIZE + 16, SIZE + 16]} />
        <meshStandardMaterial color="#3d3f43" roughness={0.95} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial color="#ece8e0" map={concreteTexture([16, 16])} />
      </mesh>
      {/* A ring of darker tiles around the fountain */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[5.2, 7.4, 48]} />
        <meshStandardMaterial color="#a8927a" />
      </mesh>
    </>
  )
}

// Old lamp posts around the fountain. At night they glow, dim while the plaza is empty,
// a little brighter with every place that opens.
const LAMPS = [[9, 9], [-9, 9], [9, -9], [-9, -9], [-8, 20], [-20, 0], [24, 0]]
function Lamps({ lit }) {
  const { time, quality } = useGame()
  const night = time === 'night'
  const glow = 0.25 + Math.min(lit, 3) * 0.25 // 0.25 empty ... 1 when the first three are open
  return LAMPS.map(([x, z], i) => (
    <group key={i} position={[x, 0, z]}>
      <mesh castShadow position={[0, 2, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 4, 8]} />
        <meshStandardMaterial color="#2d3135" />
      </mesh>
      <mesh position={[0, 4.15, 0]}>
        <sphereGeometry args={[0.28, 14, 10]} />
        <meshStandardMaterial color="#fff2cf" emissive="#ffcf7a" emissiveIntensity={night ? glow * 2.2 : 0.05} />
      </mesh>
      {night && (quality !== 'low' || i < 4) && (
        <pointLight position={[0, 4, 0]} color="#ffd59a" intensity={glow * 20} distance={22} decay={2} />
      )}
    </group>
  ))
}

// The fountain in the middle: dry and dusty at first; running water once 3 places are open
function Fountain({ flowing }) {
  const jets = useRef()
  useFrame((state) => {
    if (!jets.current) return
    const t = state.clock.elapsedTime
    jets.current.children.forEach((jet, i) => (jet.scale.y = 1 + Math.sin(t * 4 + i) * 0.08))
  })
  const stone = '#bdb3a2'
  return (
    <group>
      <RigidBody type="fixed" colliders={false} position={[0, 0.35, 0]}>
        <CylinderCollider args={[0.35, 4.6]} />
      </RigidBody>
      {/* basin rim, inside, middle column and the top bowl */}
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[4.6, 4.8, 0.7, 40, 1, true]} />
        <meshStandardMaterial color={stone} map={stoneTexture([8, 1])} side={2} />
      </mesh>
      <mesh position={[0, 0.69, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.3, 4.8, 40]} />
        <meshStandardMaterial color="#d2c8b6" />
      </mesh>
      <mesh receiveShadow position={[0, flowing ? 0.55 : 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.35, 40]} />
        {flowing
          ? <meshStandardMaterial color="#4f9fc4" metalness={0.3} roughness={0.08} transparent opacity={0.85} />
          : <meshStandardMaterial color="#8d806c" roughness={1} />}
      </mesh>
      <mesh castShadow position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.45, 0.7, 2.6, 16]} />
        <meshStandardMaterial color={stone} />
      </mesh>
      <mesh castShadow position={[0, 2.65, 0]}>
        <cylinderGeometry args={[1.5, 0.5, 0.45, 24]} />
        <meshStandardMaterial color={stone} />
      </mesh>
      <mesh castShadow position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.32, 14, 10]} />
        <meshStandardMaterial color={stone} />
      </mesh>
      {/* Dry leaves in the empty basin, or water spraying up and falling from the top bowl */}
      {!flowing && [[1.5, 2], [-2.2, 0.8], [0.4, -2.6], [-1, -1.9], [2.6, -0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.14, z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.18, 5]} />
          <meshStandardMaterial color="#7a5a2c" />
        </mesh>
      ))}
      {flowing && (
        <group ref={jets}>
          <mesh position={[0, 4.0, 0]}>
            <cylinderGeometry args={[0.04, 0.12, 1.6, 8]} />
            <meshStandardMaterial color="#cfeefa" transparent opacity={0.7} emissive="#7fc8e8" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 1.7, 0]}>
            <cylinderGeometry args={[1.55, 1.9, 1.7, 24, 1, true]} />
            <meshStandardMaterial color="#cfeefa" transparent opacity={0.35} side={2} />
          </mesh>
        </group>
      )}
    </group>
  )
}

// The old chapel at the back of the square, with a bell tower
function Chapel() {
  const z = -EDGE + 2
  const white = '#ece6d8'
  return (
    <group position={[0, 0, z]}>
      <Solid x={[-7, 7]} y={[0, 9]} z={[-12, 0]} />
      <Box size={[12, 8, 12]} position={[0, 4, -6]} color={white} />
      <mesh castShadow position={[0, 9.5, -6]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1]}>
        <boxGeometry args={[8.6, 8.6, 12.2]} />
        <meshStandardMaterial color="#8a3b2c" />
      </mesh>
      {/* Front wall with a curved top, the door, the round window */}
      <Box size={[13, 11, 0.6]} position={[0, 5.5, 0]} color={white} />
      <mesh castShadow position={[0, 11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3.2, 3.2, 0.6, 24, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={white} />
      </mesh>
      <Box size={[2.6, 4.2, 0.2]} position={[0, 2.1, 0.35]} color="#5b3a22" />
      <mesh position={[0, 7.5, 0.33]}>
        <circleGeometry args={[1.1, 24]} />
        <meshStandardMaterial color="#3a4f6a" emissive="#ffcf7a" emissiveIntensity={0.15} />
      </mesh>
      {/* Bell tower on the right, with a cross on top */}
      <Box size={[3.2, 15, 3.2]} position={[8.2, 7.5, -1.6]} color={white} />
      <Box size={[2.2, 2.2, 3.4]} position={[8.2, 12.5, -1.6]} color="#2a2a2a" />
      <mesh castShadow position={[8.2, 16.2, -1.6]}>
        <coneGeometry args={[2.3, 2.6, 4]} />
        <meshStandardMaterial color="#8a3b2c" />
      </mesh>
      <Box size={[0.18, 1.4, 0.18]} position={[8.2, 18.1, -1.6]} color="#d8c58a" />
      <Box size={[0.8, 0.18, 0.18]} position={[8.2, 18.3, -1.6]} color="#d8c58a" />
      <Solid x={[6.6, 9.8]} y={[0, 15]} z={[-3.2, 0]} />
    </group>
  )
}

// Old basketball court on the right side of the square: faded lines, a hoop at each end
function Court() {
  const x = 15
  const z = -8
  return (
    <group position={[x, 0, z]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[14, 24]} />
        <meshStandardMaterial color="#7d8a7a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[1.7, 1.8, 32]} />
        <meshStandardMaterial color="#e6e2d6" />
      </mesh>
      <Box size={[14, 0.01, 0.1]} position={[0, 0.036, 0]} color="#e6e2d6" />
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * 11.4]}>
          <Box size={[0.15, 3.3, 0.15]} position={[0, 1.65, s * 0.6]} color="#3a3d42" />
          <Box size={[1.8, 1.1, 0.06]} position={[0, 3.3, 0]} color="#efefef" />
          <mesh position={[0, 3.05, -s * 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.23, 0.02, 6, 16]} />
            <meshStandardMaterial color="#d2541f" />
          </mesh>
          <Solid x={[-0.1, 0.1]} y={[0, 3.3]} z={[s * 0.6 - 0.1, s * 0.6 + 0.1]} />
        </group>
      ))}
    </group>
  )
}

// Old shops around the square, shutters down (for now)
function Buildings() {
  const rows = [
    // [x, z, width, height, color, facing]  facing = which way the front looks
    [-EDGE - 6, -14, 22, 7, '#d9c7a3', Math.PI / 2],
    [-EDGE - 6, 12, 22, 9, '#b9c9c2', Math.PI / 2],
    [EDGE + 6, -16, 22, 8, '#e0b9a0', -Math.PI / 2],
    [EDGE + 6, 10, 22, 6.5, '#c9c2d9', -Math.PI / 2],
    [-20, EDGE + 6, 20, 7.5, '#e2d39a', Math.PI],
    [20, EDGE + 6, 20, 8.5, '#a9c4d9', Math.PI],
  ]
  return rows.map(([x, z, w, h, color, facing], i) => (
    <group key={i} position={[x, 0, z]} rotation={[0, facing, 0]}>
      <Box size={[w, h, 8]} position={[0, h / 2, -4]} color={color} />
      <mesh position={[0, 1.4, 0.02]}>
        <planeGeometry args={[w - 2, 2.6]} />
        <meshStandardMaterial map={shutterTexture([Math.round(w / 3), 1])} color="#9aa0a6" />
      </mesh>
      {Array.from({ length: Math.floor(w / 4) }, (_, k) => (
        <Box key={k} size={[1.4, 1.2, 0.1]} position={[-w / 2 + 2.5 + k * 4, h - 2, 0.02]} color="#3b4651" />
      ))}
      <Solid x={[-w / 2, w / 2]} y={[0, h]} z={[-8, 0]} />
    </group>
  ))
}

function Benches() {
  return [[-6, 8.5, 0], [6, -8.5, Math.PI], [-8.5, -6, Math.PI / 2], [8.5, 6, -Math.PI / 2]].map(([x, z, r], i) => (
    <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
      <Box size={[2.4, 0.08, 0.5]} position={[0, 0.45, 0]} color="#8b6a46" />
      <Box size={[2.4, 0.5, 0.08]} position={[0, 0.75, -0.24]} color="#8b6a46" />
      {[-1, 1].map((s) => <Box key={s} size={[0.08, 0.45, 0.45]} position={[s * 1.05, 0.22, 0]} color="#3a3a3a" />)}
      <Solid x={[-1.2, 1.2]} y={[0, 0.5]} z={[-0.25, 0.25]} />
    </group>
  ))
}

// Invisible walls at the edges of the square (the road around it is the limit)
function Walls() {
  const out = EDGE + 3
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[0.5, 10, out]} position={[-out, 10, 0]} />
      <CuboidCollider args={[0.5, 10, out]} position={[out, 10, 0]} />
      <CuboidCollider args={[out, 10, 0.5]} position={[0, 10, -out]} />
      <CuboidCollider args={[out, 10, 0.5]} position={[0, 10, out]} />
    </RigidBody>
  )
}

// ---------- The stalls ----------

// A closed stall: bare frame with a faded tarp pulled down and a "SARADO" sign
function ClosedStall() {
  return (
    <group>
      {[[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]].map(([x, z], i) => (
        <Box key={i} size={[0.1, 2.4, 0.1]} position={[x, 1.2, z]} color="#6d6a64" />
      ))}
      <Box size={[3, 2.1, 0.05]} position={[0, 1.2, 0.92]} color="#8f8a80" />
      <Box size={[3.1, 0.06, 2]} position={[0, 2.42, 0]} color="#77736b" />
      <mesh position={[0, 1.4, 0.96]}>
        <planeGeometry args={[1.2, 0.4]} />
        <meshStandardMaterial map={signTexture({ text: 'SARADO', bg: '#f1ece0', fg: '#9b2b22' }, 1.2, 0.4)} />
      </mesh>
      <Solid x={[-1.5, 1.5]} y={[0, 2.4]} z={[-1, 1]} />
    </group>
  )
}

// Where someone's stall stands, facing the middle of the square
function StallSpot({ id, children }) {
  const { at: [x, z], facing } = STALLS[id]
  return <group position={[x, 0.02, z]} rotation={[0, facing, 0]}>{children}</group>
}

// Glowing string lights over an open stall (they light up at night)
function StringLights({ width = 3 }) {
  const { time } = useGame()
  const on = time === 'night'
  return Array.from({ length: 7 }, (_, i) => (
    <mesh key={i} position={[-width / 2 + (i / 6) * width, 2.55 - Math.sin((i / 6) * Math.PI) * 0.15, 1.1]}>
      <sphereGeometry args={[0.05, 8, 6]} />
      <meshStandardMaterial color="#fff1c2" emissive="#ffc85a" emissiveIntensity={on ? 2.5 : 0.2} />
    </mesh>
  ))
}

function StallLight() {
  const { time, quality } = useGame()
  if (time !== 'night' || quality === 'low') return null
  return <pointLight position={[0, 2.3, 1.6]} color="#ffcf8a" intensity={6} distance={9} decay={2} />
}

// Aling Nena's sari-sari store: green stall, shelves of goods, a striped awning
function SariSari({ open }) {
  return (
    <StallSpot id="nena">
      {!open ? <ClosedStall /> : (
        <group>
          <Box size={[3, 1.0, 1.4]} position={[0, 0.5, -0.2]} color="#2e7d4f" />
          <Box size={[3, 1.6, 0.1]} position={[0, 1.8, -0.9]} color="#e9e2cf" />
          {[1.35, 1.85, 2.3].map((y, r) => Array.from({ length: 8 }, (_, k) => (
            <Box key={`${r}${k}`} size={[0.22, 0.3, 0.2]} position={[-1.2 + k * 0.34, y, -0.75]}
              color={['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#457b9d'][(k + r) % 5]} />
          )))}
          {[-1, 1].map((s) => <Box key={s} size={[0.1, 2.6, 0.1]} position={[s * 1.45, 1.3, 0.9]} color="#e9e2cf" />)}
          <mesh castShadow position={[0, 2.65, 0.25]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[3.3, 0.06, 2]} />
            <meshStandardMaterial color="#e63946" />
          </mesh>
          <mesh position={[0, 2.95, -0.9]}>
            <planeGeometry args={[2.6, 0.5]} />
            <meshStandardMaterial map={signTexture({ text: "Sari-sari ni Aling Nena", bg: '#fff4d6', fg: '#1d5a35' }, 2.6, 0.5)} />
          </mesh>
          <StringLights />
          <StallLight />
          <Solid x={[-1.5, 1.5]} y={[0, 1]} z={[-0.9, 0.5]} />
        </group>
      )}
    </StallSpot>
  )
}

// Kuya Jun's kwek-kwek cart (busiest at night)
function KwekSpot({ open }) {
  return (
    <StallSpot id="jun">
      {!open ? <ClosedStall /> : (
        <group>
          <group position={[0, 0, 0.3]} rotation={[0, Math.PI / 2, 0]}><KwekCart /></group>
          <mesh position={[0, 2.5, -0.6]}>
            <planeGeometry args={[2.2, 0.45]} />
            <meshStandardMaterial map={signTexture({ text: 'KWEK-KWEK ni Kuya Jun', bg: '#ffb703', fg: '#5a2a00' }, 2.2, 0.45)} side={2} />
          </mesh>
          <Box size={[0.08, 2.4, 0.08]} position={[-1.1, 1.2, -0.6]} color="#555" />
          <Box size={[0.08, 2.4, 0.08]} position={[1.1, 1.2, -0.6]} color="#555" />
          <Solid x={[-0.7, 0.7]} y={[0, 1]} z={[-0.3, 0.9]} />
        </group>
      )}
    </StallSpot>
  )
}

// Andrew's skate corner: a small quarter ramp, a rail, and a rack of boards
function SkateCorner({ open }) {
  return (
    <StallSpot id="andrew">
      {!open ? (
        <group>
          {/* taped-off empty corner with cones */}
          {[[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]].map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, 0.3, z]}>
              <coneGeometry args={[0.18, 0.6, 10]} />
              <meshStandardMaterial color="#ff7a1a" />
            </mesh>
          ))}
          <Box size={[5, 0.03, 0.06]} position={[0, 0.5, 2.5]} color="#ffd23f" />
          <Box size={[5, 0.03, 0.06]} position={[0, 0.5, -2.5]} color="#ffd23f" />
        </group>
      ) : (
        <group>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[7, 7]} />
            <meshStandardMaterial color="#b9b5ad" />
          </mesh>
          {/* quarter ramp at the back */}
          <mesh castShadow receiveShadow position={[0, 0.6, -2.6]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[1.2, 1.2, 4, 16, 1, false, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#d8d3c8" side={2} />
          </mesh>
          <Box size={[4, 1.2, 0.3]} position={[0, 0.6, -3.35]} color="#9a958c" />
          <Solid x={[-2, 2]} y={[0, 1.2]} z={[-3.5, -2.2]} />
          {/* grind rail */}
          <Box size={[0.06, 0.06, 3.4]} position={[2.3, 0.45, 0.3]} color="#c9ccd0" metalness={0.8} roughness={0.3} />
          {[-1, 1].map((s) => <Box key={s} size={[0.05, 0.45, 0.05]} position={[2.3, 0.22, 0.3 + s * 1.5]} color="#555" />)}
          {/* rack of boards */}
          <Box size={[1.6, 1.4, 0.1]} position={[-2.6, 0.7, -1]} color="#5c4a3a" />
          {['#2a9d8f', '#e63946', '#f4a261'].map((c, i) => (
            <group key={c} position={[-2.5, 0.75, -1.4 + i * 0.45]} rotation={[0, 0, Math.PI / 2 - 0.15]}>
              <Skateboard deck={c} />
            </group>
          ))}
          <mesh position={[0, 2.6, -3.5]}>
            <planeGeometry args={[2.6, 0.5]} />
            <meshStandardMaterial map={signTexture({ text: 'Skate corner ni Andrew', bg: '#1d1d1d', fg: '#ffd23f' }, 2.6, 0.5)} side={2} />
          </mesh>
        </group>
      )}
    </StallSpot>
  )
}

// What's open, as text (for Lolo Ben and the katropa screen)
export const openStallNames = (plaza) => plaza.map((id) => RECRUITS[id]?.stall).filter(Boolean)
