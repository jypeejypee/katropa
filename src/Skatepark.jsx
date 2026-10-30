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

// ---------- The skateboard ----------
// Sizes in meters. The deck is flat in the middle and kicks up at the nose and tail.
const DECK = {
  length: 0.8,
  width: 0.21,
  flat: 0.25, // half the length of the flat middle part
  kick: 0.35, // how steeply the nose and tail go up
  concave: 0.006, // the edges are a little higher than the middle
  bottom: 0.092, // height of the underside of the deck above the ground
  thick: 0.011,
}
const METAL = new THREE.MeshStandardMaterial({ color: '#c3c8ce', metalness: 0.7, roughness: 0.3 })
const WHEEL = new THREE.MeshStandardMaterial({ color: '#f2efe6', roughness: 0.6 })
const BEARING = new THREE.MeshStandardMaterial({ color: '#3a3d42', metalness: 0.5, roughness: 0.4 })
const GRIP = new THREE.MeshStandardMaterial({ color: '#1b1b1d', roughness: 1 })
const MAPLE = new THREE.MeshStandardMaterial({ color: '#d9b98c', roughness: 0.7 }) // the wood layers on the edge

// Outline of the deck from above: straight sides with round ends.
// Lots of points along the sides, so the deck can bend at the nose and tail.
function deckOutline(scale) {
  const w = (DECK.width / 2) * scale
  const straight = (DECK.length / 2) * scale - w
  const shape = new THREE.Shape()
  const steps = 24
  shape.moveTo(-w, -straight)
  for (let i = 1; i <= steps; i++) shape.lineTo(-w, -straight + (2 * straight * i) / steps)
  shape.absarc(0, straight, w, Math.PI, 0, true)
  for (let i = 1; i <= steps; i++) shape.lineTo(w, straight - (2 * straight * i) / steps)
  shape.absarc(0, -straight, w, 0, Math.PI, true)
  return shape
}

// Lay a flat outline down along z and bend it: the kicktails go up, the edges curve up a little
function bend(geometry, lift) {
  const p = geometry.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = -p.getY(i)
    const along = Math.abs(z)
    let y = DECK.bottom + p.getZ(i) + lift
    if (along > DECK.flat) y += (along - DECK.flat) * DECK.kick
    y += DECK.concave * (x / (DECK.width / 2)) ** 2
    p.setXYZ(i, x, y, z)
  }
  geometry.computeVertexNormals()
  return geometry
}

// The shapes are the same for every board, so they're made only once
let boardShapes = null
function getBoardShapes() {
  if (boardShapes) return boardShapes
  const deck = bend(new THREE.ExtrudeGeometry(deckOutline(1), {
    depth: DECK.thick, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.003, bevelSegments: 1, curveSegments: 12,
  }), 0)
  // the grip tape sits just above the deck's top (which is thick + its 2 mm rounded edge)
  const grip = bend(new THREE.ShapeGeometry(deckOutline(0.985), 12), DECK.thick + 0.0045)
  boardShapes = { deck, grip }
  return boardShapes
}

// The colored bottom of the deck: a white stripe down the middle and KATROPA written along it
const deckTextures = new Map()
function deckTexture(color) {
  if (deckTextures.has(color)) return deckTextures.get(color)
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 128, 512)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillRect(52, 0, 24, 512)
  ctx.save()
  ctx.translate(64, 256)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 30px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('KATROPA', 0, 0)
  ctx.restore()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  // The deck's texture coordinates are in meters around its middle: stretch the picture over the whole deck
  texture.repeat.set(1 / DECK.width, 1 / DECK.length)
  texture.offset.set(0.5, 0.5)
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 })
  deckTextures.set(color, material)
  return material
}

// Skateboard, built along z (the nose points to +z), with the wheels standing on y = 0
export function Skateboard({ deck = '#e63946' }) {
  const { deck: deckShape, grip } = getBoardShapes()
  const bottomMaterial = deckTexture(deck)
  return (
    <group>
      {/* Deck: colored top and bottom, wood on the edge; black grip tape on top */}
      <mesh castShadow geometry={deckShape} material={[bottomMaterial, MAPLE]} />
      <mesh geometry={grip} material={GRIP} />
      {[-0.24, 0.24].map((z) => (
        <group key={z} position={[0, 0, z]}>
          {/* Truck: base plate under the deck, the hanger, and the axle */}
          <mesh position={[0, DECK.bottom - 0.006, 0]} material={METAL}>
            <boxGeometry args={[0.065, 0.012, 0.085]} />
          </mesh>
          <mesh position={[0, 0.07, 0]} material={METAL}>
            <cylinderGeometry args={[0.009, 0.009, 0.03, 8]} />
          </mesh>
          <mesh castShadow position={[0, 0.048, 0]} material={METAL}>
            <boxGeometry args={[0.15, 0.024, 0.032]} />
          </mesh>
          <mesh position={[0, 0.028, 0]} rotation={[0, 0, Math.PI / 2]} material={METAL}>
            <cylinderGeometry args={[0.005, 0.005, 0.2, 6]} />
          </mesh>
          {/* Wheels with dark bearings */}
          {[-0.095, 0.095].map((x) => (
            <group key={x} position={[x, 0.028, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow material={WHEEL}>
                <cylinderGeometry args={[0.028, 0.028, 0.032, 16]} />
              </mesh>
              <mesh material={BEARING}>
                <cylinderGeometry args={[0.012, 0.012, 0.034, 10]} />
              </mesh>
            </group>
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
  const paddle = useRef() // every character can hold a pickleball paddle; Andrew doesn't
  const near = useRef(false)
  const { mode } = useGame()

  useFrame((state, delta) => {
    if (!body.current) return
    if (paddle.current) paddle.current.visible = false
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
        <Person limbs={limbs} avatar={ANDREW_AVATAR} paddleRef={paddle} />
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
