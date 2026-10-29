import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { COURT, playerPos, playerState, now, touchInput } from './world.js'
import { useGame } from './game.js'
import { pbNet, sendPb, isTyping } from './network.js'
import { CourtLines, Net } from './Pickleball.jsx'

const SWING_TIME = 0.35
const GRAVITY = 9.8
const BALL_R = 0.07

// Pickleball against another real player. The server moves the ball (server/pickleball.js);
// this draws the court and the ball, and sends our swings.
// playing = false: just watching someone else's game from the street.
export default function Pickleball2P({ playing = true }) {
  const ball = useRef()
  const [, getKeys] = useKeyboardControls()
  const { pb, myId } = useGame()
  const side = pb ? pb.players.findIndex((p) => p.id === myId) : -1
  const placed = useRef(-1)
  const wasDiving = useRef(false)

  // Walk onto our side of the court when we get a side
  useEffect(() => {
    if (side < 0 || placed.current === side) return
    placed.current = side
    playerState.teleport = side === 0 ? [1.2, 1.2, COURT.z + 5.5, 0] : [-1.2, 1.2, COURT.z - 5.5, Math.PI]
  }, [side])

  function swing(dive = false) {
    if (!dive && now() < playerState.swingUntil) return
    if (!dive) playerState.swingUntil = now() + SWING_TIME
    const keys = getKeys()
    const aim = keys.left || touchInput.x < -0.35 ? -1 : keys.right || touchInput.x > 0.35 ? 1 : 0
    const depth = keys.forward || touchInput.y > 0.35 ? 1 : keys.backward || touchInput.y < -0.35 ? -1 : 0
    sendPb('pb-swing', { aim, depth, dive, x: playerPos.x, y: playerPos.y, z: playerPos.z })
  }

  useEffect(() => {
    if (!playing) return
    const onKey = (e) => {
      if (isTyping(e) || e.code !== 'Space') return
      e.preventDefault()
      swing()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing])

  useFrame(() => {
    if (playing && playerState.hitRequest) {
      playerState.hitRequest = false
      swing()
    }
    // Diving reaches further: tell the server as soon as the dive starts
    if (playing && playerState.diving && !wasDiving.current) swing(true)
    wasDiving.current = playerState.diving

    // Draw the ball where the server says, moving it forward a little between updates
    const s = pbNet.state
    if (!ball.current) return
    ball.current.visible = !!s && s.phase !== 'waiting'
    if (!s) return
    const t = s.phase === 'serve' ? 0 : Math.min((performance.now() - pbNet.at) / 1000, 0.15)
    ball.current.position.set(
      s.ball.x + s.vel.x * t,
      Math.max(BALL_R, s.ball.y + s.vel.y * t - 0.5 * GRAVITY * t * t),
      s.ball.z + s.vel.z * t,
    )
  })

  return (
    <>
      <CourtLines />
      <Net />
      <mesh ref={ball} castShadow>
        <sphereGeometry args={[BALL_R, 16, 12]} />
        <meshStandardMaterial color="#e8f03c" emissive="#3d4200" />
      </mesh>
    </>
  )
}
