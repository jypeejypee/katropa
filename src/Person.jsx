import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { rng } from './world.js'
import { DEFAULT_AVATAR } from './avatar.js'

// Body shapes: belly width, shoulder width, thickness of legs and arms, head size
const BUILDS = {
  slim: { wide: 0.86, shoulderX: 0.28, legX: 0.1, legR: 0.085, armR: 0.068, headR: 0.185 },
  average: { wide: 1.0, shoulderX: 0.31, legX: 0.12, legR: 0.1, armR: 0.078, headR: 0.19 },
  chubby: { wide: 1.18, shoulderX: 0.37, legX: 0.15, legR: 0.12, armR: 0.09, headR: 0.2 },
}

// A rounded person built from an avatar (see avatar.js for all the choices).
// The middle of the body is at y = 0, the feet at y = -0.9.
// limbs is a ref ({ legs: [], arms: [] }) so animatePerson can move them.
// arms[0] is the right arm, the one holding the paddle.
export function Person({ limbs, avatar, paddleRef }) {
  const a = { ...DEFAULT_AVATAR, ...avatar }
  const b = BUILDS[a.build] ?? BUILDS.average
  const hairGeo = useMemo(() => hairGeometry(a.hairStyle, b.headR, a.extra === 'cap'), [a.hairStyle, b.headR, a.extra])
  const sleeveColor = a.top === 'tank' ? a.skin : a.topColor
  const armColor = a.top === 'hoodie' ? a.topColor : a.skin
  return (
    <group>
      {/* Legs and shoes */}
      {[-b.legX, b.legX].map((x, i) => (
        <group key={i} ref={(el) => (limbs.current.legs[i] = el)} position={[x, -0.25, 0]}>
          {a.bottom === 'pants' ? (
            <mesh castShadow position={[0, -0.3, 0]}>
              <capsuleGeometry args={[b.legR, 0.42, 6, 12]} />
              <meshStandardMaterial color={a.bottomColor} />
            </mesh>
          ) : (
            <>
              <mesh castShadow position={[0, -0.13, 0]}>
                <capsuleGeometry args={[b.legR + 0.012, 0.14, 6, 12]} />
                <meshStandardMaterial color={a.bottomColor} />
              </mesh>
              <mesh castShadow position={[0, -0.4, 0]}>
                <capsuleGeometry args={[b.legR * 0.88, 0.26, 6, 12]} />
                <meshStandardMaterial color={a.skin} />
              </mesh>
            </>
          )}
          <Shoe type={a.shoes} color={a.shoeColor} skin={a.skin} legR={b.legR} />
        </group>
      ))}

      {/* Hips */}
      <mesh castShadow position={[0, -0.16, 0]} scale={[b.wide, 0.7, 0.85 * b.wide]}>
        <sphereGeometry args={[0.27, 18, 12]} />
        <meshStandardMaterial color={a.bottomColor} />
      </mesh>
      {/* Body (the top: t-shirt, polo, sando or hoodie) */}
      <mesh castShadow position={[0, 0.12, 0.02]} scale={[b.wide, 1, 0.88 * b.wide]}>
        <capsuleGeometry args={[0.29, 0.22, 8, 18]} />
        <meshStandardMaterial color={a.topColor} />
      </mesh>
      <TopDetails top={a.top} color={a.topColor} wide={b.wide} />
      {/* Neck */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.1, 12]} />
        <meshStandardMaterial color={a.skin} />
      </mesh>

      {/* Arms, hands, watch, paddle */}
      {[-b.shoulderX, b.shoulderX].map((x, i) => (
        <group key={i} ref={(el) => (limbs.current.arms[i] = el)} position={[x, 0.33, 0]}>
          <mesh castShadow position={[0, -0.05, 0]}>
            <sphereGeometry args={[b.armR + (a.top === 'tank' ? 0.005 : 0.04), 14, 10]} />
            <meshStandardMaterial color={sleeveColor} />
          </mesh>
          <mesh castShadow position={[0, -0.27, 0]}>
            <capsuleGeometry args={[b.armR, 0.32, 6, 12]} />
            <meshStandardMaterial color={armColor} />
          </mesh>
          <mesh castShadow position={[0, -0.52, 0]}>
            <sphereGeometry args={[b.armR + 0.01, 12, 10]} />
            <meshStandardMaterial color={a.skin} />
          </mesh>
          {a.extra === 'watch' && i === 1 && (
            <mesh position={[0, -0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[b.armR + 0.005, 0.018, 6, 16]} />
              <meshStandardMaterial color="#c0c4c8" metalness={0.8} roughness={0.3} />
            </mesh>
          )}
          {i === 0 && (
            // Pickleball paddle in the right hand
            <group ref={paddleRef} position={[0, -0.6, 0.08]}>
              <mesh castShadow position={[0, 0, 0.05]}>
                <cylinderGeometry args={[0.02, 0.02, 0.14, 8]} />
                <meshStandardMaterial color="#222" />
              </mesh>
              <mesh castShadow position={[0, 0, 0.27]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1.25]}>
                <cylinderGeometry args={[0.11, 0.11, 0.025, 20]} />
                <meshStandardMaterial color="#1e88e5" />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* Head */}
      <group position={[0, 0.64, 0]}>
        <mesh castShadow scale={[a.build === 'chubby' ? 1.06 : 1.0, 1.06, 0.98]}>
          <sphereGeometry args={[b.headR, 24, 18]} />
          <meshStandardMaterial color={a.skin} />
        </mesh>
        {/* Jaw and chin */}
        <mesh castShadow position={[0, -0.1, 0.04]} scale={[1.12, 0.7, 1]}>
          <sphereGeometry args={[b.headR * 0.72, 18, 12]} />
          <meshStandardMaterial color={a.skin} />
        </mesh>
        {/* Ears */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * b.headR, -0.01, 0]} scale={[0.5, 1, 0.8]}>
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial color={a.skin} />
          </mesh>
        ))}
        <Eyes style={a.eyes} color={a.eyeColor} skin={a.skin} brows={a.hairStyle === 'bald' ? '#2a1a10' : a.hairColor} r={b.headR} />
        {/* Nose */}
        <mesh position={[0, -0.03, b.headR * 0.97]} scale={[0.85, 1.2, 0.9]}>
          <sphereGeometry args={[0.026, 12, 10]} />
          <meshStandardMaterial color={a.skin} />
        </mesh>
        {/* Smile */}
        <mesh position={[0, -0.085, b.headR * 0.93]} rotation={[0.3, 0, Math.PI]}>
          <torusGeometry args={[0.038, 0.008, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#6b2b22" />
        </mesh>
        {hairGeo && (
          <mesh castShadow geometry={hairGeo}>
            <meshStandardMaterial color={a.hairColor} roughness={0.9} />
          </mesh>
        )}
        {a.extra === 'cap' && <Cap r={b.headR} color={a.topColor === '#f4f4f4' ? '#222222' : a.topColor} />}
      </group>
    </group>
  )
}

// Collar and buttons (polo), hood and zipper (hoodie)
function TopDetails({ top, color, wide }) {
  if (top === 'polo') {
    return (
      <>
        <mesh position={[0, 0.41, 0.01]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
          <torusGeometry args={[0.1, 0.028, 8, 20]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {[0.32, 0.25].map((y) => (
          <mesh key={y} position={[0, y, 0.26 * wide]}>
            <sphereGeometry args={[0.013, 8, 6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
      </>
    )
  }
  if (top === 'hoodie') {
    return (
      <>
        <mesh castShadow position={[0, 0.42, -0.1]} rotation={[Math.PI / 2 + 0.5, 0, 0]}>
          <torusGeometry args={[0.13, 0.055, 8, 20]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.12, 0.28 * wide]}>
          <boxGeometry args={[0.015, 0.42, 0.01]} />
          <meshStandardMaterial color="#d0d0d0" metalness={0.6} roughness={0.4} />
        </mesh>
      </>
    )
  }
  if (top === 'tshirt') {
    return (
      <mesh position={[0, 0.41, 0.02]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
        <torusGeometry args={[0.09, 0.015, 6, 20]} />
        <meshStandardMaterial color={color} />
      </mesh>
    )
  }
  return null
}

function Shoe({ type, color, skin, legR }) {
  if (type === 'tsinelas') {
    return (
      <group position={[0, -0.6, 0.05]}>
        <mesh castShadow scale={[0.9, 0.45, 1.45]}>
          <sphereGeometry args={[0.09, 12, 8]} />
          <meshStandardMaterial color={skin} />
        </mesh>
        <mesh castShadow position={[0, -0.045, 0]}>
          <boxGeometry args={[0.15, 0.025, 0.3]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.0, 0.04]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.06, 0.012, 6, 12, Math.PI]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }
  return (
    <group position={[0, -0.6, 0.05]}>
      <mesh castShadow scale={[1, 0.55, 1.55]}>
        <sphereGeometry args={[0.105, 14, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.045, 0]} scale={[1.02, 0.2, 1.58]}>
        <sphereGeometry args={[0.105, 14, 6]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      {type === 'boots' && (
        <mesh castShadow position={[0, 0.09, -0.05]}>
          <cylinderGeometry args={[legR + 0.02, legR + 0.025, 0.18, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </group>
  )
}

function Eyes({ style, color, skin, brows, r }) {
  if (style === 'cool') {
    // Sunglasses
    return (
      <group position={[0, 0.025, r * 0.93]}>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.072, 0, 0]} scale={[1.3, 0.85, 0.4]}>
            <sphereGeometry args={[0.045, 14, 10]} />
            <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[0, 0.01, 0.005]}>
          <boxGeometry args={[0.06, 0.012, 0.012]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>
    )
  }
  return (
    <>
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.072, 0.025, r * 0.9]}>
          {style === 'happy' ? (
            // Closed, smiling eyes ( ^ ^ )
            <mesh position={[0, -0.005, 0.012]}>
              <torusGeometry args={[0.025, 0.007, 6, 12, Math.PI]} />
              <meshStandardMaterial color="#24160c" />
            </mesh>
          ) : (
            <>
              <mesh scale={[1.15, 0.9, 0.55]}>
                <sphereGeometry args={[0.032, 12, 10]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, -0.002, 0.016]}>
                <sphereGeometry args={[0.018, 10, 8]} />
                <meshStandardMaterial color={color} />
              </mesh>
              <mesh position={[0.006, 0.004, 0.03]}>
                <sphereGeometry args={[0.005, 6, 4]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              {style === 'sleepy' && (
                // Heavy eyelid over the top half of the eye
                <mesh position={[0, 0.012, 0.004]} scale={[1.25, 0.7, 0.65]}>
                  <sphereGeometry args={[0.034, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color={skin} />
                </mesh>
              )}
            </>
          )}
          {/* Eyebrow */}
          <mesh position={[0, 0.045, 0.006]} rotation={[0, 0, sx * 0.08]}>
            <boxGeometry args={[0.07, 0.018, 0.02]} />
            <meshStandardMaterial color={brows} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Cap({ r, color }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.075, -0.01]} rotation={[-0.2, 0, 0]} scale={[1.08, 1.0, 1.08]}>
        <sphereGeometry args={[r, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.115, r * 0.85]} rotation={[0.18, 0, 0]} scale={[1, 1, 1.4]}>
        <cylinderGeometry args={[r * 0.75, r * 0.8, 0.02, 20, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

// ---------- Hair: every style is glued into one shape (quick to draw) ----------
function capGeometry(r, scale = 1.04) {
  return new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45).rotateX(-0.3).scale(scale, scale, scale)
}

// Points on the head, in rings from the top (0) down the back and sides
function headPoints(r, rings, skipFront, seed) {
  const random = rng(seed)
  const points = []
  for (let ring = 0; ring < rings; ring++) {
    const polar = 0.15 + ring * 0.27
    const count = ring === 0 ? 5 : 8 + ring * 3
    for (let k = 0; k < count; k++) {
      const around = (k / count) * Math.PI * 2 + ring * 0.4
      const z = Math.cos(around) * Math.sin(polar)
      if (ring >= skipFront && z > 0.35) continue // keep the face free
      const out = r * (1.02 + random() * 0.06)
      points.push({
        normal: new THREE.Vector3(Math.sin(around) * Math.sin(polar), Math.cos(polar), z),
        position: [Math.sin(around) * Math.sin(polar) * out, Math.cos(polar) * out + 0.02, z * out - 0.01],
        size: 0.045 + random() * 0.02,
      })
    }
  }
  return points
}

function hairGeometry(style, r, underCap) {
  if (style === 'bald') return null
  const parts = [capGeometry(r)]
  if (style === 'curly' && !underCap) {
    headPoints(r, 5, 3, 42).forEach((c) => parts.push(new THREE.SphereGeometry(c.size, 8, 6).translate(...c.position)))
  }
  if (style === 'spiky' && !underCap) {
    const up = new THREE.Vector3(0, 1, 0)
    headPoints(r, 3, 9, 7).forEach((c) => {
      const spike = new THREE.ConeGeometry(0.04, 0.13, 6).translate(0, 0.05, 0)
      spike.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, c.normal.clone().normalize()))
      parts.push(spike.translate(...c.position))
    })
  }
  if (style === 'long') {
    // Hair falling down the back and over the shoulders
    parts.push(new THREE.CapsuleGeometry(r * 0.95, 0.22, 6, 14).scale(1.05, 1, 0.55).translate(0, -0.12, -0.07))
    for (const sx of [-1, 1]) {
      parts.push(new THREE.CapsuleGeometry(0.05, 0.2, 4, 8).translate(sx * r * 0.88, -0.12, 0.02))
    }
  }
  if (style === 'ponytail') {
    parts.push(new THREE.SphereGeometry(0.06, 12, 8).translate(0, 0.02, -r * 1.02))
    parts.push(new THREE.CapsuleGeometry(0.05, 0.22, 4, 10).rotateX(0.35).translate(0, -0.13, -r * 1.12))
  }
  if (style === 'bun' && !underCap) {
    parts.push(new THREE.SphereGeometry(0.085, 14, 10).translate(0, r * 0.95, -0.06))
  }
  return mergeGeometries(parts)
}

// Swing arms and legs while walking. swing: -1 = not swinging, 0..1 = how far into a paddle swing
export function animatePerson(limbs, time, moving, speed, swing = -1) {
  const step = moving ? Math.sin(time * speed * 3) * 0.6 : 0
  const { legs, arms } = limbs.current
  if (!legs[1] || !arms[1]) return
  legs[0].rotation.x = THREE.MathUtils.lerp(legs[0].rotation.x, -step, 0.3)
  legs[1].rotation.x = THREE.MathUtils.lerp(legs[1].rotation.x, step, 0.3)
  arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, -step, 0.3)
  if (swing >= 0) {
    // Big forward swing with the paddle arm
    arms[0].rotation.x = -Math.sin(swing * Math.PI) * 1.9
    arms[0].rotation.z = (swing - 0.5) * 1.2
  } else {
    arms[0].rotation.x = THREE.MathUtils.lerp(arms[0].rotation.x, step, 0.3)
    arms[0].rotation.z = THREE.MathUtils.lerp(arms[0].rotation.z, 0, 0.3)
  }
}
