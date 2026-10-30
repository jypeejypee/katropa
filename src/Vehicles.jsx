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

// Cars, SUVs, vans, jeeps and trucks, all built the same smooth way:
// side outlines (curves, no corners) pushed out sideways with well-rounded edges, so there are
// almost no hard edges: rounded nose and tail, curved hood and roof, real wheel arches.
// The cabin is a separate rounded piece of tinted glass; some have a painted roof over it, the truck a cargo box.
// (Numbers are before rounding: the rounded edge adds 0.08 all around the outline.)
const CAR_SPECS = {
  sedan: {
    width: 1.8, bottom: 0.36, wheelY: 0.31, wheels: [1.4, -1.4], arch: 0.48, wheelX: 0.76,
    body: [[2.15, 0.36], [2.21, 0.55], [2.12, 0.74], [1.6, 0.84], [0.9, 0.88], [-1.4, 0.9], [-2.0, 0.86], [-2.18, 0.7], [-2.15, 0.36]],
    cabin: [[0.85, 0.85], [0.45, 1.15], [0.1, 1.33], [-0.4, 1.37], [-0.85, 1.3], [-1.2, 1.08], [-1.48, 0.85]],
    cabinWidth: 1.5,
    head: [0.68, 2.24], tail: [0.76, -2.23], belt: 0.92, mirrorZ: 0.75, front: 2.33, back: -2.31,
  },
  suv: {
    width: 1.84, bottom: 0.42, wheelY: 0.36, wheels: [1.4, -1.4], arch: 0.52, wheelX: 0.76,
    body: [[2.15, 0.42], [2.21, 0.7], [2.12, 0.98], [1.5, 1.1], [0.95, 1.14], [-2.0, 1.15], [-2.19, 1.04], [-2.15, 0.42]],
    cabin: [[1.0, 1.1], [0.6, 1.42], [0.25, 1.66], [-0.5, 1.71], [-1.7, 1.71], [-2.12, 1.6], [-2.19, 1.1]],
    cabinWidth: 1.56,
    head: [0.9, 2.25], tail: [0.86, -2.25], belt: 1.17, mirrorZ: 0.9, front: 2.33, back: -2.31,
  },
  // family van (one long rounded box with a painted roof over the windows)
  van: {
    width: 1.84, bottom: 0.4, wheelY: 0.34, wheels: [1.5, -1.5], arch: 0.5, wheelX: 0.78,
    body: [[2.25, 0.4], [2.3, 0.7], [2.2, 0.98], [1.8, 1.1], [1.5, 1.14], [-2.2, 1.18], [-2.3, 0.95], [-2.25, 0.4]],
    cabin: [[1.55, 1.1], [1.05, 1.55], [0.55, 1.8], [-1.95, 1.84], [-2.24, 1.7], [-2.29, 1.14]],
    cabinWidth: 1.66,
    roof: [[0.75, 1.74], [0.45, 1.86], [-1.0, 1.9], [-2.0, 1.88], [-2.24, 1.74]], roofWidth: 1.72,
    head: [0.88, 2.35], tail: [0.95, -2.36], belt: 1.16, mirrorZ: 1.45, front: 2.42, back: -2.42,
  },
  // owner-type jeep: short and tall, chrome grille, painted top
  jeep: {
    width: 1.66, bottom: 0.42, wheelY: 0.35, wheels: [1.12, -1.12], arch: 0.5, wheelX: 0.69, chrome: true,
    body: [[1.72, 0.42], [1.8, 0.75], [1.7, 1.05], [1.0, 1.16], [0.55, 1.18], [-1.7, 1.2], [-1.8, 1.0], [-1.76, 0.42]],
    cabin: [[0.6, 1.15], [0.3, 1.66], [-1.5, 1.7], [-1.72, 1.16]],
    cabinWidth: 1.5,
    roof: [[0.38, 1.62], [0.3, 1.74], [-1.55, 1.78], [-1.72, 1.64]], roofWidth: 1.56,
    head: [0.9, 1.84], tail: [0.95, -1.85], belt: 1.17, mirrorZ: 0.5, front: 1.9, back: -1.9,
  },
  // delivery truck: rounded cab in front, tall rounded cargo box behind
  truck: {
    width: 2.0, bottom: 0.5, wheelY: 0.42, wheels: [1.8, -1.6], arch: 0.58, wheelX: 0.9, wheelW: 0.3,
    body: [[2.68, 0.5], [2.74, 0.9], [2.64, 1.3], [2.3, 1.42], [1.15, 1.44], [1.0, 1.15], [0.8, 1.0], [-2.62, 1.0], [-2.7, 0.8], [-2.68, 0.5]],
    cabin: [[2.5, 1.38], [2.3, 2.05], [2.0, 2.24], [1.15, 2.27], [1.1, 1.38]],
    cabinWidth: 1.9,
    roof: [[2.2, 2.18], [2.0, 2.34], [1.15, 2.38], [1.12, 2.2]], roofWidth: 1.96,
    cargo: [[0.95, 1.0], [0.95, 3.0], [-2.75, 3.0], [-2.75, 1.0]], cargoWidth: 2.2,
    head: [0.95, 2.78], tail: [1.15, -2.84], belt: 1.42, mirrorZ: 2.3, front: 2.84, back: -2.85,
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

// A closed smooth outline through [z, y] points
function smoothOutline(points, straight = false) {
  const v = (p) => new THREE.Vector2(...p)
  const shape = new THREE.Shape()
  shape.moveTo(...points[0])
  if (straight) points.slice(1).forEach((p) => shape.lineTo(...p))
  else shape.splineThru(points.slice(1).map(v))
  shape.closePath()
  return shape
}

const carParts = {}
function carShapes(kind) {
  if (carParts[kind]) return carParts[kind]
  const s = CAR_SPECS[kind]
  const v = (p) => new THREE.Vector2(...p)
  // Body: flat bottom with an arch over each wheel (nose to tail), then a smooth curve over the top
  const body = new THREE.Shape()
  const [start, ...rest] = s.body
  body.moveTo(...start)
  const lift = Math.asin((s.bottom - s.wheelY) / s.arch)
  for (const wz of s.wheels) {
    body.lineTo(wz + Math.cos(lift) * s.arch, s.bottom)
    body.absarc(wz, s.wheelY, s.arch, lift, Math.PI - lift, false)
  }
  body.lineTo(...s.body[s.body.length - 1])
  body.splineThru([...rest].reverse().map(v).slice(1).concat([v(start)]))
  carParts[kind] = {
    body: roundedSlab(body, s.width, 0.08, 0.2),
    cabin: roundedSlab(smoothOutline(s.cabin), s.cabinWidth, 0.04, 0.16),
    roof: s.roof && roundedSlab(smoothOutline(s.roof), s.roofWidth, 0.03, 0.12),
    cargo: s.cargo && roundedSlab(smoothOutline(s.cargo, true), s.cargoWidth, 0.1, 0.18),
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

export function Car({ kind = 'sedan', color = '#e8e8e8', plate = 'NFT 4821' }) {
  const s = CAR_SPECS[kind]
  const { body, cabin, roof, cargo } = carShapes(kind)
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.3 }), [color])
  const lampX = s.width * 0.31
  return (
    <group>
      <mesh castShadow receiveShadow geometry={body} material={paint} />
      <mesh castShadow geometry={cabin} material={glassMaterial} />
      {roof && <mesh castShadow geometry={roof} material={paint} />}
      {cargo && <mesh castShadow receiveShadow geometry={cargo} material={paint} />}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          {/* headlights, tail lights, side mirrors */}
          <Lamp position={[sd * lampX, s.head[0], s.head[1]]} scale={[0.22, 0.065, 0.06]} color="#f6f6f2" glow="#fff3cf" />
          <Lamp position={[sd * lampX, s.tail[0], s.tail[1]]} scale={[0.24, 0.055, 0.06]} color="#b3121a" glow="#ff1c1c" />
          <mesh geometry={lampGeometry} material={paint} position={[sd * (s.width / 2), s.belt + 0.06, s.mirrorZ]} scale={[0.1, 0.06, 0.08]} />
        </group>
      ))}
      {/* grille under the hood (chrome on the jeep), plates */}
      <mesh geometry={lampGeometry} position={[0, s.head[0] - 0.16, s.head[1] + 0.02]} scale={[s.chrome ? 0.5 : 0.42, s.chrome ? 0.1 : 0.06, 0.05]}>
        <meshStandardMaterial color={s.chrome ? '#d9dde0' : '#121212'} metalness={s.chrome ? 0.9 : 0} roughness={s.chrome ? 0.2 : 0.5} />
      </mesh>
      <Plate text={plate} position={[0, s.bottom + 0.12, s.back]} />
      <Plate text={plate} position={[0, s.bottom + 0.06, s.front]} rotation={[0, 0, 0]} />
      {s.wheels.map((z) => [-1, 1].map((x) => (
        <Wheel key={`${z}${x}`} position={[x * s.wheelX, s.wheelY, z]} r={s.wheelY} w={s.wheelW ?? 0.24} />
      )))}
    </group>
  )
}

const Suv = (props) => <Car kind="suv" {...props} />
export const Van = ({ color = '#c9cdd2', plate = 'NAY 502' }) => <Car kind="van" color={color} plate={plate} />
export const Jeep = ({ color = '#4f6b3a', plate = 'JEP 117' }) => <Car kind="jeep" color={color} plate={plate} />
export const Truck = ({ color = '#2e9e48', plate = 'TRK 908' }) => <Car kind="truck" color={color} plate={plate} />


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
