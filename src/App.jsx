import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import Street from './Street.jsx'
import Bridgetowne from './Bridgetowne.jsx'
import { Andrew } from './Skatepark.jsx'
import Player from './Player.jsx'
import Npc from './Npc.jsx'
import Pickleball from './Pickleball.jsx'
import Pickleball2P from './Pickleball2P.jsx'
import Hud from './Hud.jsx'
import RemotePlayers from './RemotePlayers.jsx'
import NightLights from './NightLights.jsx'
import { SkyAndClouds } from './Props.jsx'
import { TIMES } from './timeOfDay.js'
import { MAPS } from './maps.js'
import { playerPos } from './world.js'
import { useGame } from './game.js'

// Which keys move the player
const keyMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

// The sun (or the moon at night) follows the player, so there are always shadows nearby
function Sun({ time, low }) {
  const light = useRef()
  useFrame(() => {
    const l = light.current
    const [x, y, z] = time.sun
    l.position.set(playerPos.x + x, y, playerPos.z + z)
    l.target.position.copy(playerPos)
    l.target.updateMatrixWorld()
  })
  return (
    <directionalLight
      ref={light}
      color={time.sunColor}
      intensity={time.sunIntensity}
      castShadow={!low}
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.04}
      shadow-camera-left={-35}
      shadow-camera-right={35}
      shadow-camera-top={35}
      shadow-camera-bottom={-35}
      shadow-camera-far={120}
    />
  )
}

export default function App() {
  const { mode, time: timeName, touch, quality, pb, map } = useGame()
  const low = quality === 'low'
  useEffect(() => {
    document.body.classList.toggle('touch', touch)
  }, [touch])
  const time = TIMES[timeName]
  const taytay = map === 'tnlf' // Edson and pickleball are only in Taytay; Andrew and the skatepark are in Bridgetowne
  return (
    <>
      <KeyboardControls map={keyMap}>
        {/* The 3D street is only built after the start screen (so it uses the chosen graphics) */}
        {mode !== 'start' && (
        <Canvas
          shadows={!low}
          dpr={low ? 1 : [1, 2]}
          gl={{ antialias: !low, powerPreference: 'high-performance' }}
          camera={{ fov: 60, near: 0.1, far: 400 }}
        >
          <fog attach="fog" args={[time.fog, time.fogNear * MAPS[map].fog, time.fogFar * MAPS[map].fog]} />
          <SkyAndClouds time={time} low={low} />
          {/* Smooth mode has no lamp lights, so nights get a bit more soft light instead */}
          <hemisphereLight color={time.hemiSky} groundColor={time.hemiGround}
            intensity={time.hemi * (low && time.lamps ? 1.8 : 1)} />
          <Sun time={time} low={low} />
          <NightLights brightness={time.lamps} low={low} map={map} />
          {/* updatePriority -1: physics moves everything first, then the camera follows (see Player.jsx) */}
          <Physics gravity={[0, -9.81, 0]} updatePriority={-1}>
            {taytay ? <Street /> : <Bridgetowne />}
            <Player />
            {taytay ? <Npc /> : <Andrew />}
            {taytay && mode === 'pickleball' && <Pickleball />}
            {taytay && mode === 'pickleball2' && <Pickleball2P />}
            {/* Watching other players' game */}
            {taytay && mode !== 'pickleball2' && mode !== 'pickleball' && pb && pb.phase !== 'waiting' && <Pickleball2P playing={false} />}
          </Physics>
          <RemotePlayers />
        </Canvas>
        )}
      </KeyboardControls>
      <Hud />
    </>
  )
}
