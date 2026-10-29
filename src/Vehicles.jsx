import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { LANE_X, STREET_START, STREET_END, COURT, playerPos } from './world.js'
import { getGame } from './game.js'
import { signTexture } from './textures.js'

// All vehicles are built facing +z (forward)

function Wheel({ position, r = 0.3, w = 0.15 }) {
  return (
    <mesh castShadow position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[r, r, w, 14]} />
      <meshStandardMaterial color="#1b1b1b" roughness={0.9} />
    </mesh>
  )
}

function Box({ size, position, color, rotation, ...rest }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} {...rest} />
    </mesh>
  )
}

function Driver({ position, shirt = '#f5f5f5' }) {
  return (
    <group position={position}>
      <Box size={[0.4, 0.55, 0.25]} position={[0, 0.3, 0]} color={shirt} />
      <mesh castShadow position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.14, 10, 8]} />
        <meshStandardMaterial color="#a8754f" />
      </mesh>
    </group>
  )
}

function Plate({ text, position, rotation = [0, Math.PI, 0] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[0.4, 0.25]} />
      <meshStandardMaterial map={signTexture({ text, bg: '#e8c27a', fg: '#1a237e' }, 0.4, 0.25)} />
    </mesh>
  )
}

// Tricycle: motorcycle with a covered sidecar on its left side
export function Tricycle({ color = '#2e7d32', plate = '037', driver = false }) {
  return (
    <group>
      {/* Motorcycle */}
      <Box size={[0.3, 0.35, 1.1]} position={[-0.3, 0.7, 0.1]} color="#222" />
      <Box size={[0.28, 0.1, 0.6]} position={[-0.3, 0.92, -0.25]} color="#111" />
      <Box size={[0.7, 0.04, 0.04]} position={[-0.3, 1.1, 0.6]} color="#333" />
      <Box size={[0.06, 0.6, 0.06]} position={[-0.3, 0.75, 0.7]} color="#555" rotation={[0.3, 0, 0]} />
      <Wheel position={[-0.3, 0.3, 0.78]} />
      <Wheel position={[-0.3, 0.3, -0.55]} />
      {/* Sidecar */}
      <Box size={[0.95, 0.9, 1.7]} position={[0.45, 0.8, -0.05]} color={color} />
      <Box size={[0.85, 0.5, 0.02]} position={[0.45, 1.45, 0.75]} color="#2a3540" transparent opacity={0.7} />
      <Wheel position={[0.95, 0.3, -0.2]} />
      <Plate text={plate} position={[0.45, 0.7, -0.91]} />
      {/* Black canvas roof over everything */}
      <Box size={[1.6, 0.06, 2.2]} position={[0.15, 1.78, -0.05]} color="#1f1f1f" />
      {[[-0.55, 0.95], [0.85, 0.95], [-0.55, -1.05], [0.85, -1.05]].map(([x, z], i) => (
        <Box key={i} size={[0.04, 0.9, 0.04]} position={[x, 1.32, z]} color="#333" />
      ))}
      {driver && <Driver position={[-0.3, 0.9, -0.2]} />}
    </group>
  )
}

// Delivery truck like the green one in the photo
export function Truck({ color = '#2e9e48' }) {
  return (
    <group>
      <Box size={[1.6, 0.3, 5.4]} position={[0, 0.6, 0]} color="#222" />
      <Box size={[2.0, 1.6, 1.5]} position={[0, 1.5, 1.9]} color={color} />
      <Box size={[1.8, 0.7, 0.02]} position={[0, 1.85, 2.66]} color="#22303a" roughness={0.2} />
      <Box size={[2.0, 0.25, 0.15]} position={[0, 0.65, 2.68]} color="#999" />
      <Box size={[2.2, 2.3, 4.0]} position={[0, 1.95, -0.9]} color={color} />
      <Wheel position={[-0.95, 0.42, 1.8]} r={0.42} w={0.3} />
      <Wheel position={[0.95, 0.42, 1.8]} r={0.42} w={0.3} />
      <Wheel position={[-0.95, 0.42, -1.6]} r={0.42} w={0.3} />
      <Wheel position={[0.95, 0.42, -1.6]} r={0.42} w={0.3} />
      <Driver position={[-0.45, 0.95, 1.9]} />
    </group>
  )
}

// Silver family van
export function Van({ color = '#c9cdd2' }) {
  return (
    <group>
      <Box size={[1.85, 0.85, 4.7]} position={[0, 0.75, 0]} color={color} metalness={0.6} roughness={0.35} />
      <Box size={[1.72, 0.7, 3.3]} position={[0, 1.52, -0.35]} color="#26313a" roughness={0.15} metalness={0.3} />
      <Box size={[1.76, 0.08, 3.2]} position={[0, 1.9, -0.4]} color={color} metalness={0.6} roughness={0.35} />
      <Box size={[1.2, 0.3, 0.02]} position={[0, 0.85, 2.36]} color="#222" />
      <Plate text="NAY 502" position={[0, 0.55, 2.36]} rotation={[0, 0, 0]} />
      <Wheel position={[-0.85, 0.34, 1.5]} r={0.34} w={0.22} />
      <Wheel position={[0.85, 0.34, 1.5]} r={0.34} w={0.22} />
      <Wheel position={[-0.85, 0.34, -1.5]} r={0.34} w={0.22} />
      <Wheel position={[0.85, 0.34, -1.5]} r={0.34} w={0.22} />
    </group>
  )
}

// Old owner-type jeep
export function Jeep({ color = '#4f6b3a' }) {
  return (
    <group>
      <Box size={[1.65, 0.8, 3.6]} position={[0, 0.85, 0]} color={color} />
      <Box size={[1.5, 0.25, 1.1]} position={[0, 1.35, 1.1]} color={color} />
      <Box size={[1.55, 0.55, 0.05]} position={[0, 1.7, 0.5]} color="#2a3540" transparent opacity={0.6} />
      <Box size={[1.6, 0.06, 0.06]} position={[0, 1.95, -1.0]} color="#333" />
      <Box size={[1.3, 0.35, 0.05]} position={[0, 0.9, 1.81]} color="#ddd" metalness={0.8} roughness={0.3} />
      <Wheel position={[-0.8, 0.35, 1.1]} r={0.35} w={0.22} />
      <Wheel position={[0.8, 0.35, 1.1]} r={0.35} w={0.22} />
      <Wheel position={[-0.8, 0.35, -1.1]} r={0.35} w={0.22} />
      <Wheel position={[0.8, 0.35, -1.1]} r={0.35} w={0.22} />
    </group>
  )
}

export function Motorbike({ color = '#1e3a8a' }) {
  return (
    <group>
      <Box size={[0.25, 0.4, 1.3]} position={[0, 0.6, 0]} color={color} />
      <Box size={[0.24, 0.1, 0.6]} position={[0, 0.85, -0.2]} color="#111" />
      <Box size={[0.65, 0.04, 0.04]} position={[0, 1.0, 0.55]} color="#333" />
      <Wheel position={[0, 0.28, 0.6]} r={0.28} w={0.1} />
      <Wheel position={[0, 0.28, -0.6]} r={0.28} w={0.1} />
    </group>
  )
}

// Size of each vehicle's invisible solid box: half sizes + where its center is
const VEHICLES = {
  tricycle: { Model: Tricycle, half: [0.8, 0.9, 1.15], center: [0.15, 0.9, 0] },
  truck: { Model: Truck, half: [1.1, 1.55, 2.75], center: [0, 1.55, 0] },
  van: { Model: Van, half: [0.93, 1.0, 2.35], center: [0, 1.0, 0] },
  jeep: { Model: Jeep, half: [0.83, 1.0, 1.85], center: [0, 1.0, 0] },
  motorbike: { Model: Motorbike, half: [0.3, 0.55, 0.9], center: [0, 0.55, 0] },
}

export function ParkedVehicle({ type, position, rotation = 0, ...props }) {
  const { Model, half, center } = VEHICLES[type]
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotation, 0]}>
      <CuboidCollider args={half} position={center} />
      <Model {...props} />
    </RigidBody>
  )
}

// Moving traffic. Vehicles slow down for the player and for the vehicle in front.
export function Traffic({ cars }) {
  const states = useRef(cars.map((c) => ({ z: c.z, speed: c.speed })))
  return cars.map((car, i) => <MovingVehicle key={i} index={i} cars={cars} states={states} />)
}

function MovingVehicle({ index, cars, states }) {
  const body = useRef()
  const car = cars[index]
  const { Model, half, center } = VEHICLES[car.type]
  const dir = car.lane === 'right' ? -1 : 1 // right lane drives toward -z
  const x = car.lane === 'right' ? LANE_X : -LANE_X

  useFrame((_, delta) => {
    if (!body.current) return
    const dt = Math.min(delta, 0.1)
    const me = states.current[index]
    let target = car.speed

    // Stop if the player is standing in front
    const playerAhead = (playerPos.z - me.z) * dir
    if (Math.abs(playerPos.x - x) < 1.8 && playerAhead > 0 && playerAhead < half[2] + 5) target = 0

    // Wait outside the pickleball court while a game is going on
    // (also when other players in the room are playing on the court)
    const { mode, pb } = getGame()
    if (mode === 'pickleball' || mode === 'pickleball2' || (pb && pb.phase !== 'waiting')) {
      const courtEdge = COURT.z - dir * (COURT.halfLength + 1.5)
      const toCourt = (courtEdge - me.z) * dir
      if (toCourt > 0 && toCourt < half[2] + 2) target = 0
    }

    // Don't bump into the vehicle in front
    states.current.forEach((other, j) => {
      if (j === index || cars[j].lane !== car.lane) return
      const gap = (other.z - me.z) * dir
      if (gap > 0 && gap < 8) target = Math.min(target, gap < 5.5 ? 0 : other.speed)
    })

    me.speed = THREE.MathUtils.damp(me.speed, target, 3, dt)
    me.z += dir * me.speed * dt
    // At the end of the street, come back from the other end
    if (me.z < STREET_START) me.z += STREET_END - STREET_START
    if (me.z > STREET_END) me.z -= STREET_END - STREET_START
    body.current.setNextKinematicTranslation({ x, y: 0, z: me.z })
  })

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[x, 0, car.z]}
      rotation={[0, dir === 1 ? 0 : Math.PI, 0]}
    >
      <CuboidCollider args={half} position={center} />
      <Model color={car.color} plate={car.plate} driver />
    </RigidBody>
  )
}
