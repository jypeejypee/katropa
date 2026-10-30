import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from './game.js'
import { remotePlayers, pbNet } from './network.js'
import { Person, animatePerson, SIT_DROP } from './Person.jsx'
import { lerpAngle, playerPos } from './world.js'
import { setPeerVolume } from './voice.js'
import { signTexture } from './textures.js'
import SpeechBubble from './SpeechBubble.jsx'
import { Skateboard } from './Skatepark.jsx'

const target = new THREE.Vector3()

// Proximity voice: full volume up close, silent when far away (in meters)
const VOICE_FULL = 4
const VOICE_RANGE = 30
const SWING_TIME = 0.35

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
  const paddle = useRef()
  const board = useRef()

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
    // 3D model characters play their own dive roll instead of tipping over
    const own = avatar?.model && avatar.model !== 'custom'
    tilt.current.rotation.x = own ? 0 : t.dive * 1.45
    tilt.current.position.y = (own ? 0 : -t.dive * 0.62) - SIT_DROP * t.sit
    // On a skateboard: standing sideways on the board
    board.current.visible = !!t.skate
    tilt.current.rotation.y = t.skate ? Math.PI / 2 : 0
    if (t.skate) tilt.current.position.y = 0.12
    // Holding a paddle and swinging it while playing pickleball
    const playing = !!pbNet.state?.players.some((pl) => pl.id === id)
    if (paddle.current) paddle.current.visible = playing
    const since = (performance.now() - (pbNet.swings.get(id) ?? -1e9)) / 1000
    const swing = playing && since < SWING_TIME ? since / SWING_TIME : -1
    animatePerson(limbs, state.clock.elapsedTime, t.moving, playing ? 5 : 3, swing, t.sit, avatar?.gender === 'female')
    limbs.current.motion.dive = t.dive > 0.05
  })

  return (
    <group ref={group}>
      <group ref={model}>
        <group ref={tilt}>
          <Person limbs={limbs} avatar={avatar} paddleRef={paddle} />
        </group>
        <group ref={board} position={[0, -0.9, 0]} visible={false}>
          <Skateboard deck="#2a9d8f" />
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
