import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { playerPos, talkTarget, lerpAngle } from './world.js'
import { getGame, setGame } from './game.js'
import { Person, animatePerson } from './Person.jsx'
import { signTexture } from './textures.js'

const TALK_DISTANCE = 2.8
const hidePaddle = (paddle) => paddle && (paddle.visible = false) // only Edson carries a pickleball paddle

// Someone standing in one place that you can talk to (press E or tap them):
// Aling Nena, Kuya Jun, Lolo Ben, and the katropa at their stalls in the Plaza.
//   id: which lines they say (talkers in Hud.jsx); no id = can't talk, just stands there
//   facing: which way they look when you're far away (radians, 0 = +z)
export default function Villager({ id, name, avatar, position, facing = 0 }) {
  const model = useRef()
  const limbs = useRef({ legs: [], arms: [] })
  const near = useRef(false)
  const [x, y, z] = position

  useFrame((state, delta) => {
    if (!model.current) return
    const dx = playerPos.x - x
    const dz = playerPos.z - z
    const dist = Math.hypot(dx, dz)
    const look = dist < 8 ? Math.atan2(dx, dz) : facing
    model.current.rotation.y = lerpAngle(model.current.rotation.y, look, 1 - Math.exp(-6 * delta))
    animatePerson(limbs, state.clock.elapsedTime, false, 3, -1, 0, avatar.gender === 'female')
    if (!id) return

    // Tell the screen when the player is close enough to talk
    const isNear = getGame().mode === 'walk' && dist < TALK_DISTANCE
    if (isNear) talkTarget.set(x, y, z)
    if (isNear !== near.current) {
      near.current = isNear
      if (isNear) setGame({ nearNpc: id })
      else if (getGame().nearNpc === id) setGame({ nearNpc: false })
    }
  })

  return (
    <RigidBody type="fixed" colliders={false} position={position}>
      <CapsuleCollider args={[0.5, 0.4]} position={[0, 0.9, 0]} />
      <group ref={model} position={[0, 0.9, 0]} rotation={[0, facing, 0]}
        onClick={(e) => {
          if (!id || e.delta > 10 || getGame().nearNpc !== id || getGame().mode !== 'walk') return
          e.stopPropagation()
          setGame({ mode: 'talk', dialogue: 'start', talkingTo: id })
        }}>
        <Person limbs={limbs} avatar={avatar} paddleRef={hidePaddle} />
      </group>
      <sprite position={[0, 2.2, 0]} scale={[name.length * 0.1 + 0.3, 0.28, 1]}>
        <spriteMaterial map={signTexture({ text: name, bg: 'rgba(0,0,0,0.55)', fg: '#ffffff' }, name.length * 0.1 + 0.3, 0.28)} transparent />
      </sprite>
    </RigidBody>
  )
}
