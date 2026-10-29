import { streetLamps } from './houses.js'

const WARM = '#ffd9a0'

// Lights that turn on at night: every street light, the stone uplights at TNLF,
// and the bulb under the KALIDAD roof. brightness 0 = off (daytime).
// They always exist (just at 0 brightness) so switching time of day doesn't stutter.
// low (Smooth graphics): skip the real lights, they are slow on phones. The lamp heads still glow.
export default function NightLights({ brightness, low }) {
  const on = brightness > 0
  return (
    <>
      {streetLamps.map(({ x, z }, i) => {
        const headX = x + (x > 0 ? -1 : 1) * 2.1
        return (
          <group key={i}>
            {!low && <pointLight position={[headX, 7.3, z]} color={WARM} intensity={brightness} distance={30} decay={2} />}
            {/* Glowing LED under the lamp head */}
            <mesh position={[headX, 7.66, z]} rotation={[Math.PI / 2, 0, 0]} visible={on}>
              <planeGeometry args={[0.6, 0.25]} />
              <meshBasicMaterial color="#fff3c4" toneMapped={false} />
            </mesh>
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
