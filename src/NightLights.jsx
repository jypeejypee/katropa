import { useEffect } from 'react'
import { streetLamps } from './houses.js'
import { lamps as btLamps, LAMP_ARM, LAMP_HEIGHT } from './bridgetowne.js'
import { victorMaterial, nightGlass } from './BridgetowneLandmarks.jsx'

const WARM = '#ffd9a0'

// Glowing LED under a lamp head (only shows at night)
function Led({ x, y, z, on }) {
  return (
    <mesh position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]} visible={on}>
      <planeGeometry args={[0.6, 0.25]} />
      <meshBasicMaterial color="#fff3c4" toneMapped={false} />
    </mesh>
  )
}

// Lights that turn on at night. brightness 0 = off (daytime).
// They always exist (just at 0 brightness) so switching time of day doesn't stutter.
// low (Smooth graphics): skip the real lights, they are slow on phones. The lamp heads still glow.
export default function NightLights({ brightness, low, map }) {
  return map === 'bridgetowne'
    ? <BridgetowneLights brightness={brightness} low={low} />
    : <TaytayLights brightness={brightness} low={low} />
}

// Every street light, the stone uplights at TNLF, and the bulb under the KALIDAD roof
function TaytayLights({ brightness, low }) {
  const on = brightness > 0
  return (
    <>
      {streetLamps.map(({ x, z }, i) => {
        const headX = x + (x > 0 ? -1 : 1) * 2.1
        return (
          <group key={i}>
            {!low && <pointLight position={[headX, 7.3, z]} color={WARM} intensity={brightness} distance={30} decay={2} />}
            <Led x={headX} y={7.66} z={z} on={on} />
          </group>
        )
      })}
      {/* Uplights on the dark stones of Taytay New Life Fellowship */}
      {!low && [-17.6, -26.6].map((z) => (
        <pointLight key={z} position={[-6.2, 0.4, z]} color={WARM} intensity={brightness * 0.12} distance={5} decay={2} />
      ))}
      {/* Bulb under the KALIDAD roof */}
      {!low && <pointLight position={[5.6, 3.1, 86]} color={WARM} intensity={brightness * 0.15} distance={8} decay={2} />}
    </>
  )
}

// The double street lights on the median (one light per pole, it's enough for both sides),
// The Victor lit up in violet, and lit windows in the glass towers
function BridgetowneLights({ brightness, low }) {
  const on = brightness > 0
  useEffect(() => {
    victorMaterial.emissive.set(on ? '#5a3fb0' : '#000000')
    victorMaterial.emissiveIntensity = on ? 0.55 : 0
    nightGlass.emissiveIntensity = on ? 0.35 : 0
  }, [on])
  return btLamps.map((z) => (
    <group key={z}>
      {!low && <pointLight position={[0, LAMP_HEIGHT - 0.5, z]} color={WARM} intensity={brightness * 1.3} distance={34} decay={2} />}
      {[-1, 1].map((s) => <Led key={s} x={s * LAMP_ARM} y={LAMP_HEIGHT - 0.01} z={z} on={on} />)}
    </group>
  ))
}
