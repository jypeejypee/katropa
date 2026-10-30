import { memo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import StaticBatch from './StaticBatch.jsx'
import { Skatepark } from './Skatepark.jsx'
import { Tree } from './Props.jsx'
import { Traffic } from './Vehicles.jsx'
import { asphaltTexture, concreteTexture, dashTexture, deckTexture, riverTexture } from './textures.js'
import {
  MEDIAN, CAR_EDGE, BIKE_EDGE, WALK_EDGE, START, END, RIVER, HALF_WIDTH, SIDE_ROAD, VICTOR,
  lamps, palms, trees, traffic,
} from './bridgetowne.js'
import {
  Box, Solid, Victor, Coils, Opus, GbfCenter, Towers, Palm, DoubleLamp, Bollard, Bowl, Railing,
} from './BridgetowneLandmarks.jsx'

const LENGTH = END - START + 20
const MID = (START + END) / 2
const ORANGE = '#e3a13a'

// Flat piece of ground (paint, paving, grass) lying on the ground between two corners
function Patch({ x: [x0, x1], z: [z0, z1], y = 0.01, ...material }) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, y, (z0 + z1) / 2]}>
      <planeGeometry args={[x1 - x0, z1 - z0]} />
      <meshStandardMaterial {...material} />
    </mesh>
  )
}

// Land on both sides of the river (solid), the river, and the bridge over it
function GroundAndRiver() {
  // the land goes on past the fog, so you never see where it ends
  const wide = HALF_WIDTH * 2 + 500
  const pasig = [START - 250, RIVER[0]]
  const qc = [RIVER[1], END + 250]
  return (
    <>
      {[pasig, qc].map(([z0, z1]) => (
        <RigidBody key={z0} type="fixed" colliders="cuboid">
          <mesh receiveShadow position={[0, -0.5, (z0 + z1) / 2]}>
            <boxGeometry args={[wide, 1, z1 - z0]} />
            <meshStandardMaterial color="#6f8048" />
          </mesh>
        </RigidBody>
      ))}
      {/* River banks */}
      {RIVER.map((z) => (
        <Box key={z} size={[wide, 3.5, 1]} position={[0, -2.75, z + Math.sign(z) * 0.5]} color="#8f8b80" />
      ))}
      <Patch x={[-320, 320]} z={RIVER} y={-2.6} map={riverTexture([48, 5])} roughness={0.15} metalness={0.25} />
      {/* Bridge deck and its two piers */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[14.5, 0.7, (RIVER[1] - RIVER[0]) / 2]} position={[0, -0.7, 0]} />
      </RigidBody>
      <Box size={[29, 1.4, RIVER[1] - RIVER[0]]} position={[0, -0.7, 0]} color="#b9b4aa" />
      {[-9, 9].map((z) => <Box key={z} size={[22, 2.6, 2.5]} position={[0, -2.7, z]} color="#a29d93" />)}
    </>
  )
}

function Road() {
  return (
    <>
      <Patch x={[-BIKE_EDGE, BIKE_EDGE]} z={[START - 10, END + 10]} y={0.02} map={asphaltTexture([4, Math.round(LENGTH / 4)])} roughness={0.9} />
      {/* Dashed line between the two lanes, solid lines at the bike lanes */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Patch x={[s * 4.4 - 0.07, s * 4.4 + 0.07]} z={[START - 10, END + 10]} y={0.04}
            map={dashTexture([1, Math.round(LENGTH / 4)])} transparent alphaTest={0.5} />
          {[CAR_EDGE, BIKE_EDGE - 0.15].map((x) => (
            <Patch key={x} x={[s * x - 0.07, s * x + 0.07]} z={[START - 10, END + 10]} y={0.04} color="#eeeeee" />
          ))}
        </group>
      ))}
      {/* Median: low concrete curb with grass */}
      <RigidBody type="fixed" colliders={false} position={[0, 0.06, MID]}>
        <CuboidCollider args={[MEDIAN, 0.06, LENGTH / 2]} />
      </RigidBody>
      <Box size={[MEDIAN * 2, 0.12, LENGTH]} position={[0, 0.06, MID]} color="#cfcac0" />
      <Patch x={[-MEDIAN + 0.15, MEDIAN - 0.15]} z={[START - 10, END + 10]} y={0.125} color="#5f7d3c" />
      {/* Side street on the left, the road through the Opus tunnel on the right, and the orange box at the crossing */}
      <Patch x={[-HALF_WIDTH, -BIKE_EDGE]} z={SIDE_ROAD} y={0.02} map={asphaltTexture([16, 3])} roughness={0.9} />
      <Patch x={[BIKE_EDGE, HALF_WIDTH + 60]} z={SIDE_ROAD} y={0.02} map={asphaltTexture([30, 3])} roughness={0.9} />
      {/* Pedestrian crossing at the tunnel */}
      {Array.from({ length: 6 }, (_, i) => SIDE_ROAD[0] + 1 + i * 1.6).map((z) => (
        <Patch key={z} x={[18, 21.5]} z={[z, z + 0.7]} y={0.04} color="#eeeeee" />
      ))}
      <OrangeBox x={[-CAR_EDGE, CAR_EDGE]} z={SIDE_ROAD} />
    </>
  )
}

// Orange border with an X inside, painted on the road
function OrangeBox({ x: [x0, x1], z: [z0, z1] }) {
  const w = x1 - x0
  const d = z1 - z0
  const diagonal = Math.hypot(w, d)
  const angle = Math.atan2(d, w)
  return (
    <>
      <Patch x={[x0, x1]} z={[z0, z0 + 0.15]} y={0.045} color={ORANGE} />
      <Patch x={[x0, x1]} z={[z1 - 0.15, z1]} y={0.045} color={ORANGE} />
      {[angle, -angle].map((a) => (
        <mesh key={a} rotation={[-Math.PI / 2, 0, a]} position={[(x0 + x1) / 2, 0.046, (z0 + z1) / 2]}>
          <planeGeometry args={[diagonal, 0.15]} />
          <meshStandardMaterial color={ORANGE} />
        </mesh>
      ))}
    </>
  )
}

// Raised sidewalks. They stop at the side street (left) and at the Opus tunnel (right).
function Sidewalks() {
  const width = WALK_EDGE - BIKE_EDGE
  const pieces = [
    [1, START - 10, SIDE_ROAD[0]],
    [1, SIDE_ROAD[1], END + 10],
    [-1, START - 10, SIDE_ROAD[0]],
    [-1, SIDE_ROAD[1], END + 10],
  ]
  return pieces.map(([s, z0, z1]) => {
    const x = s * (BIKE_EDGE + width / 2)
    const z = (z0 + z1) / 2
    const len = z1 - z0
    return (
      <group key={`${s}${z0}`}>
        <RigidBody type="fixed" colliders={false} position={[x, 0.06, z]}>
          <CuboidCollider args={[width / 2, 0.06, len / 2]} />
        </RigidBody>
        <Box size={[width, 0.12, len]} position={[x, 0.06, z]} color="#ffffff" map={concreteTexture([1, Math.round(len / width)])} />
      </group>
    )
  })
}

// Paved areas: The Victor's plaza, in front of Opus and GBF Center, the riverbank walks
function Plazas() {
  const paving = '#d6d0c4'
  return (
    <>
      {/* The Victor's plaza, and the walk by the river on the right after the bridge */}
      <Patch x={[WALK_EDGE, 45]} z={[-86, -38]} color={paving} />
      <Patch x={[45, HALF_WIDTH]} z={[-40, RIVER[0]]} color={paving} />
      <Patch x={[WALK_EDGE, 45]} z={[-38, RIVER[0]]} color={paving} />
      {/* In front of Opus and GBF Center, and the walk by the river on the right before the bridge */}
      <Patch x={[WALK_EDGE, 16]} z={[RIVER[1], 150]} color={paving} />
      <Patch x={[-16.2, -WALK_EDGE]} z={[SIDE_ROAD[1], 105]} color={paving} />
      {/* Riverside walk in front of the towers being built: wooden deck with little lamp posts */}
      <Patch x={[-HALF_WIDTH, -WALK_EDGE]} z={[-38, RIVER[0]]} y={0.03} map={deckTexture([30, 5])} />
      {[-18, -30, -42, -54, -66].map((x) => (
        <group key={x}>
          <Box size={[0.14, 3.2, 0.14]} position={[x, 1.6, RIVER[0] - 1.2]} color="#25292d" />
          <Box size={[0.4, 0.5, 0.4]} position={[x, 3.4, RIVER[0] - 1.2]} color="#25292d" />
        </group>
      ))}
      {/* Wooden bench on the deck */}
      <Box size={[3, 0.45, 0.6]} position={[-36, 0.25, -32]} color="#c9b49a" />
      <Solid x={[-37.5, -34.5]} y={[0, 0.45]} z={[-32.3, -31.7]} />
    </>
  )
}

// Invisible walls at the edges of the map
function Boundaries() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[0.5, 10, LENGTH / 2]} position={[-HALF_WIDTH, 10, MID]} />
      <CuboidCollider args={[0.5, 10, LENGTH / 2]} position={[HALF_WIDTH, 10, MID]} />
      <CuboidCollider args={[HALF_WIDTH, 10, 0.5]} position={[0, 10, START - 1]} />
      <CuboidCollider args={[HALF_WIDTH, 10, 0.5]} position={[0, 10, END + 1]} />
    </RigidBody>
  )
}

// The bridge railings, and railings along both riverbanks so nobody falls in
function Railings() {
  const bank = 0.3
  return (
    <>
      <Railing from={[-12.1, -30]} to={[-12.1, 32]} />
      <Railing from={[12.1, -38]} to={[12.1, 32]} />
      {[RIVER[0] - bank, RIVER[1] + bank].map((z) => (
        <group key={z}>
          <Railing from={[-HALF_WIDTH, z]} to={[-12.2, z]} color="#2d3238" />
          <Railing from={[12.2, z]} to={[HALF_WIDTH, z]} color="#2d3238" />
        </group>
      ))}
    </>
  )
}

// [middle, height, half length] of the big arches; the coils only run along the bridge
const LEFT_ARCHES = [[-10, 8, 10], [13, 6, 8]]
const RIGHT_ARCHES = [[-6, 10, 11], [16, 6, 8]]
const bollards = Array.from({ length: 34 }, (_, i) => -50 + i * 2.4)
const bowls = [-43, -29, -15, -1, 13, 27]

export default memo(function Bridgetowne() {
  return (
    <>
      <StaticBatch>
        <GroundAndRiver />
        <Road />
        <Sidewalks />
        <Plazas />
        <Boundaries />
        <Railings />

        <Victor />
        <Coils side={-1} z0={-30} z1={30} arches={LEFT_ARCHES} />
        <Coils side={1} z0={-30} z1={30} arches={RIGHT_ARCHES} />
        <Opus />
        <GbfCenter />
        <Towers />
        <Skatepark />

        {lamps.map((z) => <DoubleLamp key={z} z={z} />)}
        {bollards.map((z) => [-1, 1].map((s) => <Bollard key={`${s}${z}`} x={s * (CAR_EDGE + 0.15)} z={z} />))}
        {bowls.map((z, i) => <Bowl key={z} x={0} z={z} seed={i + 1} />)}
        {/* Bowls around The Victor (only on the plaza side, not toward the road) */}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = -Math.PI / 2 + (i / 4) * Math.PI
          return <Bowl key={`v${i}`} x={VICTOR.x + Math.cos(a) * 15} z={VICTOR.z + Math.sin(a) * 15} seed={i + 20} />
        })}
        {palms.map(([x, z], i) => <Palm key={i} x={x} z={z} height={11 + (i % 3) * 1.5} seed={i + 1} />)}
        {trees.map(([x, z], i) => <Tree key={i} seed={i + 40} position={[x, 0, z]} scale={1.1} />)}
      </StaticBatch>
      {/* Moving things stay outside the StaticBatch */}
      <Traffic cars={traffic} start={START} end={END} court={false} />
    </>
  )
})
