import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from './game.js'
import { remotePlayers } from './network.js'
import { Person, animatePerson, SIT_DROP } from './Person.jsx'
import { lerpAngle, playerPos } from './world.js'
import { setPeerVolume } from './voice.js'
import { signTexture } from './textures.js'
import SpeechBubble from './SpeechBubble.jsx'

const target = new THREE.Vector3()

// Proximity voice: full volume up close, silent when far away (in meters)
const VOICE_FULL = 4
const VOICE_RANGE = 30

// The other players in your room, walking around the street
export default function RemotePlayers() {
  const { others, bubbles, voiceUsers } = useGame()
  return others.map((o) => (
    <RemotePlayer key={o.id} id={o.id} name={o.name} avatar={o.avatar} bubble={bubbles[o.id]}
      inVoice={voiceUsers.includes(o.id)} />
  ))
}

function RemotePlayer({ id, name, avatar, bubble, inVoice }) {
  const group = useRef()
  const model = useRef()
  const tilt = useRef()
  const limbs = useRef({ legs: [], arms: [] })

  useFrame((state, delta) => {
    const p = remotePlayers.get(id)
    if (!p || !group.current) return
    const t = p.target
    // Glide smoothly to the latest position (positions only arrive 10 times a second)
    target.set(t.x, t.y, t.z)
    if (p.pos.distanceTo(target) > 6) p.pos.copy(target)
    else p.pos.lerp(target, 1 - Math.exp(-10 * delta))
    group.current.position.copy(p.pos)
    model.current.rotation.y = lerpAngle(model.current.rotation.y, t.rotY, 1 - Math.exp(-12 * delta))
    const distance = p.pos.distanceTo(playerPos)
    setPeerVolume(id, 1 - (distance - VOICE_FULL) / (VOICE_RANGE - VOICE_FULL))

    // Same poses as your own character: diving and sitting
    tilt.current.rotation.x = t.dive * 1.45
    tilt.current.position.y = -t.dive * 0.62 - SIT_DROP * t.sit
    animatePerson(limbs, state.clock.elapsedTime, t.moving, 3, -1, t.sit, avatar?.gender === 'female')
  })

  return (
    <group ref={group}>
      <group ref={model}>
        <group ref={tilt}>
          <Person limbs={limbs} avatar={avatar} />
        </group>
      </group>
      <SpeechBubble bubble={bubble} />
      {/* Name above the head */}
      <sprite position={[0, 1.3, 0]} scale={[Math.max(0.8, (name.length + (inVoice ? 2 : 0)) * 0.13), 0.28, 1]}>
        <spriteMaterial
          map={signTexture({ text: inVoice ? `🎙 ${name}` : name, bg: 'rgba(0,0,0,0.55)', fg: '#ffffff' }, Math.max(0.8, name.length * 0.13), 0.28)}
          transparent
        />
      </sprite>
    </group>
  )
}
