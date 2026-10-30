import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { playerPos } from './world.js'
import { useGame, getGame, setGame } from './game.js'
import Villager from './Villager.jsx'

// People you can recruit for the Plaza, where they live before they join (see recruits.js)

export const NENA_AVATAR = {
  model: 'custom', gender: 'female', build: 'chubby', skin: '#b98258',
  eyes: 'happy', eyeColor: '#2a190e', hairStyle: 'bun', hairColor: '#7d7a76',
  top: 'blouse', topColor: '#d9577a', bottom: 'skirt', bottomColor: '#3d4a6b',
  shoes: 'tsinelas', shoeColor: '#2f6fb0', extra: 'glasses',
}
export const JUN_AVATAR = {
  model: 'custom', gender: 'male', build: 'average', skin: '#a8714a',
  eyes: 'round', eyeColor: '#24160c', hairStyle: 'short', hairColor: '#141010',
  top: 'tank', topColor: '#f0f0ea', bottom: 'shorts', bottomColor: '#41546e',
  shoes: 'tsinelas', shoeColor: '#c33', extra: 'cap',
}

// ---------- Taytay: Aling Nena by the sari-sari store, and her lost bayong ----------
const NENA_HOME = [-4.7, 0.1, 15.6]
const BAYONG_AT = [5.4, 0.1, 104] // fell off down the street, on the other sidewalk near KALIDAD

export function TaytayRecruits() {
  const { recruited, nenaQuest } = useGame()
  return (
    <>
      {!recruited.includes('nena') && <Villager id="nena" name="Aling Nena" avatar={NENA_AVATAR} position={NENA_HOME} facing={Math.PI / 2} />}
      {nenaQuest === 'looking' && <Bayong />}
    </>
  )
}

// A woven bag on the sidewalk with a glowing ring around it; walk up to it to pick it up
function Bayong() {
  const ring = useRef()
  useFrame((state) => {
    ring.current.rotation.z = state.clock.elapsedTime
    ring.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.08)
    const [x, , z] = BAYONG_AT
    if (Math.hypot(playerPos.x - x, playerPos.z - z) < 1.4 && getGame().nenaQuest === 'looking') {
      setGame({ nenaQuest: 'found', toast: { text: 'Nakuha mo ang bayong ni Aling Nena! Ibalik mo sa kanya sa may sari-sari store.', at: Date.now() } })
    }
  })
  return (
    <group position={BAYONG_AT}>
      <mesh castShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.2, 0.16, 0.42, 10]} />
        <meshStandardMaterial color="#c8a15c" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.12, 0.018, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#8a6a36" />
      </mesh>
      <mesh ref={ring} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.65, 24]} />
        <meshBasicMaterial color="#ffd23f" transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

// ---------- Bridgetowne: Kuya Jun's kwek-kwek cart by the river, only at night ----------
const JUN_HOME = [-22, 0, 31.6] // on the riverbank before the bridge, left of the road

export function BridgetowneRecruits() {
  const { recruited, time } = useGame()
  if (time !== 'night' || recruited.includes('jun')) return null
  return (
    <>
      <Villager id="jun" name="Kuya Jun" avatar={JUN_AVATAR} position={JUN_HOME} facing={0} />
      <group position={[JUN_HOME[0] + 1.2, 0, JUN_HOME[2] + 0.2]}>
        <KwekCart />
      </group>
    </>
  )
}

// A little street-food cart: wooden body, wheels, a wok of orange kwek-kwek, a lamp and an umbrella
export function KwekCart() {
  return (
    <group>
      <mesh castShadow position={[0, 0.65, 0]}>
        <boxGeometry args={[0.7, 0.5, 1.2]} />
        <meshStandardMaterial color="#9c5a2c" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.92, 0]}>
        <boxGeometry args={[0.76, 0.04, 1.26]} />
        <meshStandardMaterial color="#c9c4bb" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.98, -0.2]}>
        <cylinderGeometry args={[0.25, 0.18, 0.1, 16]} />
        <meshStandardMaterial color="#2d2d2d" metalness={0.5} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 2.4) * 0.13 * (i % 3 ? 1 : 0.4), 1.04, -0.2 + Math.sin(i * 2.4) * 0.13 * (i % 3 ? 1 : 0.4)]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshStandardMaterial color="#ff8a1e" roughness={0.5} />
        </mesh>
      ))}
      {[-0.45, 0.45].map((z) => (
        <mesh key={z} castShadow position={[0.38, 0.28, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.06, 14]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
      {/* Umbrella on a pole, and a warm lamp under it */}
      <mesh position={[-0.3, 1.5, 0.45]}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh castShadow position={[-0.3, 2.12, 0.45]}>
        <coneGeometry args={[0.9, 0.35, 8, 1, true]} />
        <meshStandardMaterial color="#e63946" side={2} />
      </mesh>
      <mesh position={[-0.3, 1.75, 0.45]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#fff2c4" emissive="#ffcf6a" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[-0.3, 1.7, 0.45]} color="#ffcf8a" intensity={4} distance={7} decay={2} />
    </group>
  )
}
