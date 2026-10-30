import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, ConvexHullCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js'
import { playerPos, npcPos, lerpAngle } from './world.js'
import { getGame, setGame, useGame } from './game.js'
import { Person, animatePerson } from './Person.jsx'
import { signTexture, concreteTexture } from './textures.js'
import { Box, Solid } from './BridgetowneLandmarks.jsx'
import { ANDREW_NAME, ANDREW_HOME, ANDREW_AVATAR, PARK } from './skate.js'

const TALK_DISTANCE = 2.8
const CONCRETE = '#a9a7a2' // ramps: a bit darker than the ground so you can see them
const COPING = '#8d9399' // metal edge on the ramps

// Skateboard, built along z (the nose points to +z), with the wheels standing on y = 0
export function Skateboard({ deck = '#e63946' }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[0.22, 0.025, 0.8]} />
        <meshStandardMaterial color={deck} />
      </mesh>
      <mesh position={[0, 0.114, 0]}>
        <boxGeometry args={[0.215, 0.004, 0.76]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.95} />
      </mesh>
      {[-0.27, 0.27].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.07, z]}>
            <boxGeometry args={[0.16, 0.04, 0.05]} />
            <meshStandardMaterial color="#b7bcc2" metalness={0.6} roughness={0.35} />
          </mesh>
          {[-0.09, 0.09].map((x) => (
            <mesh key={x} position={[x, 0.035, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.035, 10]} />
              <meshStandardMaterial color="#f4f1e6" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// A ramp made from its corner points: solid, so the player rides up it
function Ramp({ points, color = CONCRETE }) {
  const { geometry, vertices } = useMemo(() => ({
    geometry: new ConvexGeometry(points.map((p) => new THREE.Vector3(...p))),
    vertices: new Float32Array(points.flat()),
  }), [points])
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <ConvexHullCollider args={[vertices]} />
      </RigidBody>
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  )
}

// Wedge that rises toward +x from x0 to x1, h meters high
const wedge = (x0, x1, z0, z1, h) => [
  [x0, 0, z0], [x0, 0, z1], [x1, 0, z0], [x1, 0, z1], [x1, h, z0], [x1, h, z1],
]
// Box with a slope on both ends (a funbox): flat top from t0 to t1
const funbox = (x0, t0, t1, x1, z0, z1, h) => [
  [x0, 0, z0], [x0, 0, z1], [x1, 0, z0], [x1, 0, z1],
  [t0, h, z0], [t0, h, z1], [t1, h, z0], [t1, h, z1],
]

const KICKER = wedge(20, 22.6, -38.5, -35.5, 0.55)
const FUNBOX = funbox(27, 28.8, 34.2, 36, -38, -34.5, 0.5)
const BANK = wedge(40, 44.5, -42, -33, 1.7)

// The skatepark between The Victor and the river: smooth concrete, a kicker, a funbox, a ledge and a bank
export function Skatepark() {
  const [x0, x1] = PARK.x
  const [z0, z1] = PARK.z
  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.02, (z0 + z1) / 2]}>
        <planeGeometry args={[x1 - x0, z1 - z0]} />
        <meshStandardMaterial color="#ffffff" map={concreteTexture([8, 4])} />
      </mesh>
      <Ramp points={KICKER} />
      <Ramp points={FUNBOX} />
      <Ramp points={BANK} />
      {/* Metal edges on top of the ramps */}
      <Box size={[0.08, 0.06, 3]} position={[22.6, 0.56, -37]} color={COPING} metalness={0.6} roughness={0.35} />
      {[28.8, 34.2].map((x) => <Box key={x} size={[0.08, 0.06, 3.5]} position={[x, 0.51, -36.25]} color={COPING} metalness={0.6} roughness={0.35} />)}
      <Box size={[0.1, 0.08, 9]} position={[44.5, 1.72, -37.5]} color={COPING} metalness={0.6} roughness={0.35} />
      {/* Long low ledge: ollie up and ride along it */}
      <Solid x={[18, 31]} y={[0, 0.42]} z={[-32.3, -31.3]} />
      <Box size={[13, 0.42, 1]} position={[24.5, 0.21, -31.8]} color="#b9b5ad" />
      <Box size={[13, 0.04, 0.06]} position={[24.5, 0.43, -32.27]} color={COPING} metalness={0.6} roughness={0.35} />
      {/* Painted name on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 2]} position={[38, 0.03, -30.6]}>
        <planeGeometry args={[6, 1.2]} />
        <meshStandardMaterial map={signTexture({ text: 'BRIDGETOWNE SKATE', bg: 'rgba(0,0,0,0)', fg: '#e63946' }, 6, 1.2)} transparent />
      </mesh>
    </>
  )
}

// Andrew: stands at the skatepark with his board. Talk to him (E, or tap him) to borrow it.
export function Andrew() {
  const body = useRef()
  const model = useRef()
  const limbs = useRef({ legs: [], arms: [] })
  const near = useRef(false)
  const { mode } = useGame()

  useFrame((state, delta) => {
    if (!body.current) return
    const [hx, , hz] = ANDREW_HOME
    // The player looks at whoever they're talking to (npcPos); here that's Andrew
    npcPos.set(hx, 0.1, hz)
    const dx = playerPos.x - hx
    const dz = playerPos.z - hz
    const dist = Math.hypot(dx, dz)
    if (dist < 8) model.current.rotation.y = lerpAngle(model.current.rotation.y, Math.atan2(dx, dz), 1 - Math.exp(-8 * delta))
    animatePerson(limbs, state.clock.elapsedTime, false, 3)

    const isNear = getGame().mode === 'walk' && dist < TALK_DISTANCE
    if (isNear !== near.current) {
      near.current = isNear
      setGame({ nearNpc: isNear })
    }
  })

  return (
    <RigidBody ref={body} type="fixed" colliders={false} position={ANDREW_HOME}>
      <CapsuleCollider args={[0.5, 0.4]} position={[0, 0.9, 0]} />
      <group ref={model} position={[0, 0.9, 0]} rotation={[0, -Math.PI / 2, 0]}
        onClick={(e) => {
          if (e.delta > 10 || !getGame().nearNpc || getGame().mode !== 'walk') return
          e.stopPropagation()
          setGame({ mode: 'talk', dialogue: 'start' })
        }}>
        <Person limbs={limbs} avatar={ANDREW_AVATAR} />
        {/* His board, standing on its tail next to him (he lends it to you when you skate) */}
        {mode !== 'skate' && (
          <group position={[0.42, -0.86, 0.15]} rotation={[-1.25, 0, 0]}>
            <Skateboard deck="#2a9d8f" />
          </group>
        )}
      </group>
      <sprite position={[0, 2.2, 0]} scale={[0.9, 0.28, 1]}>
        <spriteMaterial map={signTexture({ text: ANDREW_NAME, bg: 'rgba(0,0,0,0.55)', fg: '#ffffff' }, 0.9, 0.28)} transparent />
      </sprite>
    </RigidBody>
  )
}
