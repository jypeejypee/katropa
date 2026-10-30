import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { LANE_X, STREET_START, STREET_END, COURT, playerPos } from './world.js'
import { getGame } from './game.js'
import { signTexture } from './textures.js'

// All vehicles are built facing +z (forward)

// A tire with a silver rim
function Wheel({ position, r = 0.3, w = 0.15 }) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, w, 16]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.9} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[r * 0.58, r * 0.58, w + 0.02, 12]} />
        <meshStandardMaterial color="#b9bdc2" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
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

// A side outline (z, y points) pushed out sideways into a solid piece, centered on x = 0.
// The rounded edge makes it `bevel` bigger all around the outline.
function sideShape(points, width, bevel = 0.05) {
  const shape = new THREE.Shape()
  points.forEach(([z, y], i) => (i ? shape.lineTo(z, y) : shape.moveTo(z, y)))
  const depth = width - bevel * 2
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 6 })
  g.rotateY(-Math.PI / 2) // outline x becomes z, the push goes along x
  g.translate(depth / 2, 0, 0)
  g.computeVertexNormals()
  return g
}

// A rounded stick from one point to another (the scooter rider's arms and legs)
const yAxis = new THREE.Vector3(0, 1, 0)
function Limb({ from, to, r, color }) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = b.clone().sub(a)
  return (
    <mesh castShadow position={a.clone().add(b).multiplyScalar(0.5)}
      quaternion={new THREE.Quaternion().setFromUnitVectors(yAxis, dir.clone().normalize())}>
      <capsuleGeometry args={[r, dir.length(), 3, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// Scooter (like the ones everyone rides here): legshield in front, flat floor, seat over the engine
let scooterBody
export function Motorbike({ color = '#1e3a8a', driver = false }) {
  scooterBody ??= sideShape([
    [0.56, 0.44], [0.44, 1.0], [0.3, 1.02], [0.2, 0.42], [-0.16, 0.42], [-0.22, 0.62],
    [-0.94, 0.74], [-0.99, 0.6], [-0.62, 0.36], [-0.25, 0.24], [0.34, 0.24],
  ], 0.34, 0.03)
  const dark = '#151515'
  return (
    <group>
      <mesh castShadow geometry={scooterBody}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.35} />
      </mesh>
      {/* Seat, front fork and fender, handlebar with the headlight */}
      <Box size={[0.3, 0.09, 0.72]} position={[0, 0.74, -0.58]} rotation={[0.14, 0, 0]} color={dark} roughness={0.8} />
      <Box size={[0.12, 0.72, 0.06]} position={[0, 0.6, 0.55]} rotation={[-0.24, 0, 0]} color="#8d9196" metalness={0.6} />
      <Box size={[0.17, 0.05, 0.4]} position={[0, 0.58, 0.64]} color={color} metalness={0.4} roughness={0.35} />
      <Box size={[0.46, 0.15, 0.22]} position={[0, 1.06, 0.4]} color={color} metalness={0.4} roughness={0.35} />
      <Box size={[0.22, 0.08, 0.03]} position={[0, 1.04, 0.52]} color="#fffbe8" emissive="#fff3c4" emissiveIntensity={0.5} />
      <Box size={[0.72, 0.035, 0.035]} position={[0, 1.1, 0.34]} color="#2a2a2a" />
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <Box size={[0.08, 0.05, 0.05]} position={[sd * 0.36, 1.1, 0.34]} color={dark} />
          <Box size={[0.02, 0.22, 0.02]} position={[sd * 0.22, 1.22, 0.4]} rotation={[0, 0, sd * -0.35]} color="#2a2a2a" />
          <Box size={[0.11, 0.07, 0.02]} position={[sd * 0.27, 1.33, 0.41]} color="#2a2a2a" />
        </group>
      ))}
      {/* Tail light and exhaust */}
      <Box size={[0.2, 0.06, 0.03]} position={[0, 0.68, -0.99]} color="#c0262c" emissive="#ff2a2a" emissiveIntensity={0.25} />
      <mesh castShadow position={[0.19, 0.3, -0.45]} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#a7abb0" metalness={0.8} roughness={0.25} />
      </mesh>
      <Wheel position={[0, 0.27, 0.64]} r={0.27} w={0.1} />
      <Wheel position={[0, 0.27, -0.64]} r={0.27} w={0.1} />
      {driver && <Rider />}
    </group>
  )
}

// Someone riding the scooter, with a helmet
function Rider() {
  const shirt = '#e9e6df'
  const pants = '#2b3445'
  const skin = '#a8754f'
  return (
    <group>
      <Box size={[0.36, 0.5, 0.22]} position={[0, 1.08, -0.3]} rotation={[0.2, 0, 0]} color={shirt} />
      <mesh castShadow position={[0, 1.47, -0.2]}>
        <sphereGeometry args={[0.15, 14, 10]} />
        <meshStandardMaterial color="#202326" metalness={0.3} roughness={0.3} />
      </mesh>
      <Box size={[0.2, 0.08, 0.04]} position={[0, 1.45, -0.06]} color="#4b5a66" roughness={0.1} />
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <Limb from={[sd * 0.2, 1.27, -0.24]} to={[sd * 0.3, 1.08, 0.33]} r={0.05} color={shirt} />
          <Limb from={[sd * 0.11, 0.84, -0.36]} to={[sd * 0.15, 0.86, 0.06]} r={0.075} color={pants} />
          <Limb from={[sd * 0.15, 0.86, 0.06]} to={[sd * 0.13, 0.48, 0.14]} r={0.06} color={pants} />
          <Box size={[0.1, 0.07, 0.22]} position={[sd * 0.13, 0.46, 0.2]} color="#222" />
          <mesh position={[sd * 0.31, 1.07, 0.35]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Car (sedan), or an SUV when suv is set.
// Smooth side outlines (curves, no corners) pushed out sideways with well-rounded edges, so the
// body has almost no hard edges: rounded nose and tail, curved hood and roof, real wheel arches.
// The cabin is a separate rounded piece of tinted glass sitting on the body.
// (Numbers are before rounding: the rounded edge adds `edge` all around the outline.)
const CAR_SPECS = {
  sedan: {
    width: 1.8, bottom: 0.36, wheelY: 0.31, wheelZ: 1.4, arch: 0.48,
    body: [[2.15, 0.36], [2.21, 0.55], [2.12, 0.74], [1.6, 0.84], [0.9, 0.88], [-1.4, 0.9], [-2.0, 0.86], [-2.18, 0.7], [-2.15, 0.36]],
    cabin: [[0.85, 0.85], [0.45, 1.15], [0.1, 1.33], [-0.4, 1.37], [-0.85, 1.3], [-1.2, 1.08], [-1.48, 0.85]],
    cabinWidth: 1.5,
    head: [0.68, 2.24], tail: [0.76, -2.23], belt: 0.92, mirrorZ: 0.75,
  },
  suv: {
    width: 1.84, bottom: 0.42, wheelY: 0.36, wheelZ: 1.4, arch: 0.52,
    body: [[2.15, 0.42], [2.21, 0.7], [2.12, 0.98], [1.5, 1.1], [0.95, 1.14], [-2.0, 1.15], [-2.19, 1.04], [-2.15, 0.42]],
    cabin: [[1.0, 1.1], [0.6, 1.42], [0.25, 1.66], [-0.5, 1.71], [-1.7, 1.71], [-2.12, 1.6], [-2.19, 1.1]],
    cabinWidth: 1.56,
    head: [0.9, 2.25], tail: [0.86, -2.25], belt: 1.17, mirrorZ: 0.9,
  },
}

// Push a flat outline out sideways (centered on x = 0) with rounded edges and smooth shading
function roundedSlab(shape, width, edge, side) {
  const depth = width - side * 2
  let g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelSize: edge, bevelThickness: side, bevelSegments: 6, curveSegments: 40,
  })
  g.deleteAttribute('uv')
  g.deleteAttribute('normal')
  g = mergeVertices(g, 1e-4)
  g.rotateY(-Math.PI / 2) // outline x becomes z, the push goes along x
  g.translate(depth / 2, 0, 0)
  g.computeVertexNormals()
  return g
}

const carParts = {}
function carShapes(kind) {
  if (carParts[kind]) return carParts[kind]
  const s = CAR_SPECS[kind]
  const v = (p) => new THREE.Vector2(...p)
  // Body: flat bottom with an arch over each wheel, smooth curve over the top
  const body = new THREE.Shape()
  const [start, ...rest] = s.body
  body.moveTo(...start)
  const lift = Math.asin((s.bottom - s.wheelY) / s.arch)
  for (const wz of [-s.wheelZ, s.wheelZ].reverse()) {
    body.lineTo(wz + Math.cos(lift) * s.arch, s.bottom)
    body.absarc(wz, s.wheelY, s.arch, lift, Math.PI - lift, false)
  }
  body.lineTo(...s.body[s.body.length - 1])
  // the arches above were drawn from the nose back to the tail; now the top, from the tail to the nose
  body.splineThru([...rest].reverse().map(v).slice(1).concat([v(start)]))
  const cabin = new THREE.Shape()
  cabin.moveTo(...s.cabin[0])
  cabin.splineThru(s.cabin.slice(1).map(v))
  cabin.closePath()
  carParts[kind] = {
    body: roundedSlab(body, s.width, 0.08, 0.2),
    cabin: roundedSlab(cabin, s.cabinWidth, 0.04, 0.16),
  }
  return carParts[kind]
}

const lampGeometry = new THREE.SphereGeometry(1, 16, 10)
const glassMaterial = new THREE.MeshStandardMaterial({ color: '#26323c', metalness: 0.5, roughness: 0.08 })

function Lamp({ position, scale, color, glow }) {
  return (
    <mesh geometry={lampGeometry} position={position} scale={scale}>
      <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={0.45} roughness={0.2} />
    </mesh>
  )
}

export function Car({ color = '#e8e8e8', suv = false }) {
  const s = CAR_SPECS[suv ? 'suv' : 'sedan']
  const { body, cabin } = carShapes(suv ? 'suv' : 'sedan')
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.3 }), [color])
  return (
    <group>
      <mesh castShadow receiveShadow geometry={body} material={paint} />
      <mesh castShadow geometry={cabin} material={glassMaterial} />
      {[-1, 1].map((sd) => (
        <group key={sd}>
          {/* headlights, tail lights, side mirrors */}
          <Lamp position={[sd * 0.56, s.head[0], s.head[1]]} scale={[0.22, 0.065, 0.06]} color="#f6f6f2" glow="#fff3cf" />
          <Lamp position={[sd * 0.58, s.tail[0], s.tail[1]]} scale={[0.24, 0.055, 0.06]} color="#b3121a" glow="#ff1c1c" />
          <mesh geometry={lampGeometry} material={paint} position={[sd * 0.9, s.belt + 0.06, s.mirrorZ]} scale={[0.1, 0.06, 0.08]} />
        </group>
      ))}
      {/* dark grille under the hood, plates */}
      <mesh geometry={lampGeometry} position={[0, s.head[0] - 0.16, s.head[1] + 0.02]} scale={[0.42, 0.06, 0.05]}>
        <meshStandardMaterial color="#121212" roughness={0.5} />
      </mesh>
      <Plate text="NFT 4821" position={[0, s.bottom + 0.12, -2.31]} />
      <Plate text="NFT 4821" position={[0, s.bottom + 0.06, 2.33]} rotation={[0, 0, 0]} />
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z], i) => (
        <Wheel key={i} position={[x * 0.76, s.wheelY, z * s.wheelZ]} r={s.wheelY} w={0.24} />
      ))}
    </group>
  )
}

const Suv = (props) => <Car suv {...props} />

// Size of each vehicle's invisible solid box: half sizes + where its center is
const VEHICLES = {
  tricycle: { Model: Tricycle, half: [0.8, 0.9, 1.15], center: [0.15, 0.9, 0] },
  truck: { Model: Truck, half: [1.1, 1.55, 2.75], center: [0, 1.55, 0] },
  van: { Model: Van, half: [0.93, 1.0, 2.35], center: [0, 1.0, 0] },
  jeep: { Model: Jeep, half: [0.83, 1.0, 1.85], center: [0, 1.0, 0] },
  motorbike: { Model: Motorbike, half: [0.3, 0.55, 0.9], center: [0, 0.55, 0] },
  car: { Model: Car, half: [0.92, 0.75, 2.2], center: [0, 0.75, 0] },
  suv: { Model: Suv, half: [0.92, 0.9, 2.2], center: [0, 0.9, 0] },
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
// start / end: where the street begins and ends. court: wait for the pickleball court (Taytay only).
export function Traffic({ cars, start = STREET_START, end = STREET_END, court = true }) {
  const states = useRef(cars.map((c) => ({ z: c.z, speed: c.speed })))
  return cars.map((car, i) => (
    <MovingVehicle key={i} index={i} cars={cars} states={states} start={start} end={end} court={court} />
  ))
}

// Where a car drives: car.x if it has one (for roads with more lanes), otherwise its lane
const laneX = (car) => car.x ?? (car.lane === 'right' ? LANE_X : -LANE_X)

function MovingVehicle({ index, cars, states, start, end, court }) {
  const body = useRef()
  const car = cars[index]
  const { Model, half, center } = VEHICLES[car.type]
  const x = laneX(car)
  const dir = x > 0 ? -1 : 1 // the right side drives toward -z

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
    if (court && (mode === 'pickleball' || mode === 'pickleball2' || (pb && pb.phase !== 'waiting'))) {
      // Already on the court when the game starts: move just past it, so it doesn't park on the court
      const clear = COURT.halfLength + 1.5 + half[2]
      if (Math.abs(me.z - COURT.z) < clear) {
        me.z = COURT.z + dir * (clear + 0.5)
        body.current.setTranslation({ x, y: 0, z: me.z }, true)
        return
      }
      const courtEdge = COURT.z - dir * (COURT.halfLength + 1.5)
      const toCourt = (courtEdge - me.z) * dir
      if (toCourt > 0 && toCourt < half[2] + 2) target = 0
    }

    // Don't bump into the vehicle in front
    states.current.forEach((other, j) => {
      if (j === index || laneX(cars[j]) !== x) return
      const gap = (other.z - me.z) * dir
      if (gap > 0 && gap < 8) target = Math.min(target, gap < 5.5 ? 0 : other.speed)
    })

    me.speed = THREE.MathUtils.damp(me.speed, target, 3, dt)
    me.z += dir * me.speed * dt
    // At the end of the street, come back from the other end
    if (me.z < start) me.z += end - start
    if (me.z > end) me.z -= end - start
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
