import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { BUILDING_LINE } from './world.js'
import { gateTexture, signTexture } from './textures.js'

// The yellow-green 2-storey house across the street from Taytay New Life Fellowship
// (from the photos): black gate with gold ornaments, KTV ROOM, and Cuesociety Bar + Cafe.
// Built facing +z, then turned to face the road. Local x = world z (minus the middle).
const Z1 = -36 // gate end
const Z2 = -14 // Cuesociety end (next to Polystar Glass)
const W = Z2 - Z1
const MID = (Z1 + Z2) / 2
const D = 10 // depth
const H = 6.2 // height to the roof edge
const GREEN = '#d3df9c'
const CREAM = '#f1ece0'
const BROWN = '#8a5641'
const CUE = signTexture({ text: 'CUESOCIETY\nBAR + CAFE', bg: '#111111', fg: '#ffffff' }, 3.2, 0.95)

function Box({ size, position, color, rotation, ...material }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} {...material} />
    </mesh>
  )
}

function Plane({ size, position, color, map, ...material }) {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} map={map} {...material} />
    </mesh>
  )
}

// Triangle gable at the front with a brown edge and a round vent
function Gable({ x, width }) {
  const h = 2.0
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-width / 2, 0)
    s.lineTo(width / 2, 0)
    s.lineTo(0, h)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false })
  }, [width])
  const slope = Math.atan2(h, width / 2)
  const edge = Math.hypot(h, width / 2) + 0.3
  return (
    <group position={[x, H, 0.25]}>
      <mesh castShadow geometry={shape} position={[0, 0, -0.4]}>
        <meshStandardMaterial color={GREEN} />
      </mesh>
      {[-1, 1].map((s) => (
        <Box key={s} size={[edge, 0.28, 0.5]} position={[(s * width) / 4, h / 2 + 0.05, -0.15]}
          rotation={[0, 0, -s * slope]} color={BROWN} />
      ))}
      <mesh position={[0, h * 0.42, 0.01]}>
        <circleGeometry args={[0.38, 24]} />
        <meshStandardMaterial color={CREAM} />
      </mesh>
      <mesh position={[0, h * 0.42, 0.02]}>
        <ringGeometry args={[0.12, 0.3, 8]} />
        <meshStandardMaterial color="#7d8a5a" />
      </mesh>
    </group>
  )
}

function UpperWindow({ x }) {
  return (
    <group position={[x, 4.6, 0.02]}>
      <Plane size={[1.9, 1.7]} position={[0, 0, 0]} color={CREAM} />
      <Plane size={[1.6, 1.4]} position={[0, 0, 0.01]} color="#2f3a40" />
      <Plane size={[1.6, 1.4]} position={[0, 0, 0.02]} map={gateTexture()} transparent opacity={0.85} />
    </group>
  )
}

// Dark banner on the fence, like the menu posters in the photo
function Banner({ x, w = 1.2, h = 2.0, y = 1.25, text }) {
  return <Plane size={[w, h]} position={[x, y, 0.62]} map={signTexture({ text, bg: '#1d2340', fg: '#ffffff' }, w, h)} />
}

export default function AcrossTNLF() {
  const L = (z) => z - MID // world z -> local x
  const cx = BUILDING_LINE + D / 2
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[D / 2, H / 2, W / 2]} position={[cx, H / 2, MID]} />
        {/* fence in front of KTV and Cuesociety */}
        <CuboidCollider args={[0.1, 0.9, (Z2 - (-29)) / 2]} position={[BUILDING_LINE - 0.6, 0.9, (Z2 + -29) / 2]} />
      </RigidBody>

      <group position={[cx, 0, MID]} rotation={[0, -Math.PI / 2, 0]}>
        <group position={[0, 0, D / 2]}>
          {/* Walls */}
          <Box size={[W, H, D]} position={[0, H / 2, -D / 2]} color={GREEN} />
          {/* Cream band between the floors and brown roof edge */}
          <Box size={[W + 0.1, 0.45, 0.35]} position={[0, 3.2, 0.1]} color={CREAM} />
          <Box size={[W + 0.6, 0.3, 0.9]} position={[0, H + 0.1, 0.2]} color={BROWN} />
          <Box size={[W + 0.4, 0.5, D]} position={[0, H + 0.45, -D / 2 + 0.2]} color="#9c6650" />
          <Gable x={L(-31)} width={5} />
          <Gable x={L(-21.5)} width={5.5} />
          {[-34.5, -31, -25.5, -21.5, -17].map((z) => <UpperWindow key={z} x={L(z)} />)}
          {/* Aircon and drain pipes */}
          <Box size={[0.9, 0.7, 0.35]} position={[L(-23.8), 4.4, 0.25]} color="#eeeeee" />
          {[-28.6, -18.5].map((z) => (
            <mesh key={z} position={[L(z), 3.6, 0.15]}>
              <cylinderGeometry args={[0.05, 0.05, 5, 8]} />
              <meshStandardMaterial color={CREAM} />
            </mesh>
          ))}

          {/* ---- Gate with gold round ornaments (z -36 to -29) ---- */}
          <Plane size={[6.6, 2.9]} position={[L(-32.5), 1.45, 0.03]} map={gateTexture([6, 2])} color="#3a3a3a" />
          {[0.85, 2.25].map((y) =>
            Array.from({ length: 9 }, (_, i) => (
              <mesh key={`${y}-${i}`} position={[L(-35.6 + i * 0.77), y, 0.06]}>
                <torusGeometry args={[0.17, 0.035, 6, 18]} />
                <meshStandardMaterial color="#c9963a" metalness={0.7} roughness={0.35} />
              </mesh>
            ))
          )}
          <mesh position={[L(-32.5), 2.95, 0.05]}>
            <torusGeometry args={[0.8, 0.05, 6, 20, Math.PI]} />
            <meshStandardMaterial color="#1c1c1c" />
          </mesh>

          {/* ---- KTV and Cuesociety: dark inside, black fence, cream rounded awning ---- */}
          <Plane size={[Z2 - -29, 2.9]} position={[L((Z2 + -29) / 2), 1.45, 0.02]} color="#2a2a2e" />
          <mesh castShadow position={[L((Z2 + -29) / 2), 2.95, 0.55]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.7, 0.7, Z2 - -29, 20, 1, true, 0, Math.PI]} />
            <meshStandardMaterial color="#e6dfb8" side={THREE.DoubleSide} />
          </mesh>
          <group position={[L((Z2 + -29) / 2), 0, 0.6]}>
            <Box size={[Z2 - -29, 0.05, 0.05]} position={[0, 1.75, 0]} color="#1c1c1c" />
            <Box size={[Z2 - -29, 0.05, 0.05]} position={[0, 0.1, 0]} color="#1c1c1c" />
            {Array.from({ length: Math.floor((Z2 - -29) / 0.25) }, (_, i) => (
              <Box key={i} size={[0.025, 1.7, 0.025]} position={[-(Z2 - -29) / 2 + 0.1 + i * 0.25, 0.9, 0]} color="#1c1c1c" />
            ))}
          </group>
          <Banner x={L(-27.2)} w={2.6} h={1.5} y={1.5} text={'KTV ROOM\nSTARTS @ 300'} />
          <Banner x={L(-24.6)} text={'STANDARD\nTOWERS\nPREMIUM\nTOWERS\nBEER'} />
          <Banner x={L(-23.2)} text={'PIKA-PIKA\nRICE MEAL\n+ 2 RICE'} />
          <Banner x={L(-21.6)} w={0.9} h={1.2} y={1.1} text={'100 per\nhour'} />
          <Banner x={L(-15.4)} w={1.1} h={2.0} text={'OPEN\n1PM - 12AM\nSAT-SUN\n1PM - 2AM'} />
          {/* Cuesociety sign */}
          <Box size={[3.4, 1.1, 0.15]} position={[L(-19.8), 3.95, 1.3]} color="#111" />
          <Plane size={[3.2, 0.95]} position={[L(-19.8), 3.95, 1.38]} map={CUE} emissiveMap={CUE}
            emissive="#ffffff" emissiveIntensity={0.4} />
        </group>
      </group>

    </>
  )
}
