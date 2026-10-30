import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { playerPos, npcPos, npcState, now, lerpAngle, ROAD_HALF_WIDTH } from './world.js'
import { getGame, setGame } from './game.js'
import { Person, animatePerson } from './Person.jsx'
import { NPC_NAME, NPC_HOME } from './dialogue.js'
import { EDSON_AVATAR } from './avatar.js'
import { signTexture } from './textures.js'

const TALK_DISTANCE = 2.8
const WALK_SPEED = 2.2
const SWING_TIME = 0.35
const toHome = new THREE.Vector3()

// Edson: a neighbor you can talk to (press E, or tap him) and play pickleball with
export default function Npc() {
  const body = useRef()
  const model = useRef()
  const limbs = useRef({ legs: [], arms: [] })
  const near = useRef(false)

  useFrame((state, delta) => {
    if (!body.current) return
    const { mode } = getGame()
    let moving = npcState.moving

    // When not playing, walk back home to the front of KALIDAD
    if (mode === 'walk') {
      toHome.set(NPC_HOME[0] - npcPos.x, 0, NPC_HOME[2] - npcPos.z)
      const dist = toHome.length()
      moving = dist > 0.1
      if (moving) {
        npcPos.addScaledVector(toHome.normalize(), Math.min(dist, WALK_SPEED * delta))
        npcState.facing = Math.atan2(toHome.x, toHome.z)
      }
    }

    // Look at the player when standing nearby
    const dx = playerPos.x - npcPos.x
    const dz = playerPos.z - npcPos.z
    const dist = Math.hypot(dx, dz)
    if (!moving && mode !== 'pickleball' && dist < 7) npcState.facing = Math.atan2(dx, dz)
    model.current.rotation.y = lerpAngle(model.current.rotation.y, npcState.facing, 1 - Math.exp(-8 * delta))

    // Stand on the sidewalk (a little higher) or on the road
    npcPos.y = Math.abs(npcPos.x) > ROAD_HALF_WIDTH ? 0.1 : 0
    body.current.setNextKinematicTranslation({ x: npcPos.x, y: npcPos.y, z: npcPos.z })

    const t = now()
    const swing = t < npcState.swingUntil ? 1 - (npcState.swingUntil - t) / SWING_TIME : -1
    animatePerson(limbs, state.clock.elapsedTime, moving, mode === 'pickleball' ? 5 : 3, swing)

    // Tell the screen when the player is close enough to talk
    const isNear = mode === 'walk' && dist < TALK_DISTANCE
    if (isNear !== near.current) {
      near.current = isNear
      setGame({ nearNpc: isNear })
    }
  })

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={NPC_HOME}>
      <CapsuleCollider args={[0.5, 0.4]} position={[0, 0.9, 0]} />
      {/* Tap or click Edson when close to talk (a drag to look around doesn't count) */}
      <group ref={model} position={[0, 0.9, 0]} rotation={[0, Math.PI, 0]}
        onClick={(e) => {
          if (e.delta > 10 || !getGame().nearNpc || getGame().mode !== 'walk') return
          e.stopPropagation()
          setGame({ mode: 'talk', dialogue: 'start' })
        }}>
        <Person limbs={limbs} avatar={EDSON_AVATAR} />
      </group>
      {/* Name above the head */}
      <sprite position={[0, 2.2, 0]} scale={[0.8, 0.28, 1]}>
        <spriteMaterial
          map={signTexture({ text: NPC_NAME, bg: 'rgba(0,0,0,0.55)', fg: '#ffffff' }, 0.8, 0.28)}
          transparent
        />
      </sprite>
    </RigidBody>
  )
}
