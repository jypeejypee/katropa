import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { rng } from './world.js'
import { DEFAULT_AVATAR } from './avatar.js'
import ModelPerson, { MODEL_FILES } from './ModelPerson.jsx'

// How far the body drops when sitting on the ground
export const SIT_DROP = 0.66

// Body measurements for each look (in meters). Lalaki: wider shoulders. Babae: narrower waist, wider hips.
function shapeOf(a) {
  const female = a.gender === 'female'
  const chubby = a.build === 'chubby'
  const slim = a.build === 'slim'
  const size = chubby ? 1.18 : slim ? 0.92 : 1
  const chest = (female ? 0.148 : 0.165) * (chubby ? 1.1 : slim ? 0.94 : 1)
  const waist = (female ? 0.112 : 0.138) * size
  return {
    female,
    chubby,
    chest,
    waist,
    belly: Math.max(waist, chest * 0.94) * (chubby ? 1.2 : 1),
    hip: (female ? 0.165 : 0.145) * (chubby ? 1.14 : slim ? 0.94 : 1),
    depth: chubby ? 0.84 : 0.7, // how thick the body is front to back
    shoulderX: chest + (female ? 0.02 : 0.04),
    legX: (female ? 0.072 : 0.08) * (chubby ? 1.15 : 1),
    legR: (female ? 0.058 : 0.064) * (chubby ? 1.25 : slim ? 0.88 : 1),
    armR: (female ? 0.037 : 0.044) * (chubby ? 1.22 : slim ? 0.9 : 1),
    headR: 0.135,
  }
}

// The shirt / body shape: a smooth outline spun around (like a vase)
function lathe(points, depth, segments = 24) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments).scale(1, 1, depth)
}

function Mat({ color, ...rest }) {
  return <meshStandardMaterial color={color} roughness={0.75} {...rest} />
}

// A person built from an avatar (see avatar.js for all the choices).
// The middle of the body is at y = 0, the feet at y = -0.9.
// limbs is a ref ({ legs: [], arms: [] }) so animatePerson can bend hips, knees, shoulders and elbows.
// arms[0] is the right arm, the one holding the paddle.
export function Person({ limbs, avatar, paddleRef }) {
  // A ready-made 3D character (like the 3D Pinoy) instead of the built one
  if (MODEL_FILES[avatar?.model]) {
    return (
      <Suspense fallback={null}>
        <ModelPerson model={avatar.model} limbs={limbs} paddleRef={paddleRef} />
      </Suspense>
    )
  }
  return <BuiltPerson limbs={limbs} avatar={avatar} paddleRef={paddleRef} />
}

function BuiltPerson({ limbs, avatar, paddleRef }) {
  const a = { ...DEFAULT_AVATAR, ...avatar }
  const s = shapeOf(a)
  const L = limbs.current
  L.knees ??= []
  L.elbows ??= []

  const torso = useMemo(() => lathe([
    [0.001, -0.06], [s.waist, -0.05], [s.belly, 0.08], [s.chest, 0.22], [s.chest * 0.97, 0.32],
    [s.chest * 0.78, 0.41], [0.075, 0.46], [0.001, 0.47],
  ], s.depth), [s.waist, s.belly, s.chest, s.depth])
  const pelvis = useMemo(() => lathe([
    [0.001, -0.19], [s.hip * 0.62, -0.18], [s.hip * 0.94, -0.13], [s.hip, -0.08], [s.waist * 1.02, -0.04], [0.001, -0.03],
  ], s.depth * 1.05), [s.hip, s.waist, s.depth])
  const skirt = useMemo(() => lathe([
    [s.waist * 1.06, -0.03], [s.hip * 1.06, -0.12], [s.hip * 1.42, -0.46],
  ], s.depth * 1.1, 28), [s.waist, s.hip, s.depth])
  const hair = useMemo(() => hairGeometry(a.hairStyle, s.headR, a.extra === 'cap'), [a.hairStyle, s.headR, a.extra])

  const longSleeves = a.top === 'longsleeve' || a.top === 'hoodie'
  const shortSleeves = a.top === 'tshirt' || a.top === 'polo' || a.top === 'blouse'
  const tucked = (a.top === 'longsleeve' || a.top === 'polo' || a.top === 'blouse') && a.bottom !== 'skirt'
  const legColor = a.bottom === 'pants' ? a.bottomColor : a.skin
  const front = (r) => r * s.depth + 0.003 // front surface of the body at a given width

  return (
    <group>
      {/* ---------- Legs: hip -> knee -> ankle -> shoe ---------- */}
      {[-s.legX, s.legX].map((x, i) => (
        <group key={i} position={[x, -0.1, 0]}
          ref={(el) => { if (el) { el.rotation.order = 'YXZ'; L.legs[i] = el } }}>
          <mesh castShadow position={[0, -0.2, 0]}>
            <capsuleGeometry args={[s.legR, 0.4 - 2 * s.legR, 6, 14]} />
            <Mat color={legColor} />
          </mesh>
          {a.bottom === 'shorts' && (
            <mesh castShadow position={[0, -0.12, 0]}>
              <capsuleGeometry args={[s.legR * 1.15, 0.2, 6, 14]} />
              <Mat color={a.bottomColor} />
            </mesh>
          )}
          <group position={[0, -0.4, 0]} ref={(el) => (L.knees[i] = el)}>
            <mesh castShadow position={[0, -0.18, 0]}>
              <capsuleGeometry args={[s.legR * 0.86, 0.36 - 2 * s.legR * 0.86, 6, 14]} />
              <Mat color={legColor} />
            </mesh>
            <group position={[0, -0.36, 0]}>
              <Shoe type={a.shoes} color={a.shoeColor} skin={a.skin} />
            </group>
          </group>
        </group>
      ))}

      {/* ---------- Hips (pants or skirt) and belt ---------- */}
      <mesh castShadow geometry={pelvis}>
        <Mat color={a.bottomColor} />
      </mesh>
      {a.bottom === 'skirt' && (
        <mesh castShadow geometry={skirt}>
          <Mat color={a.bottomColor} side={THREE.DoubleSide} />
        </mesh>
      )}
      {tucked && (
        <group position={[0, -0.04, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, s.depth * 1.03, 1]}>
            <torusGeometry args={[s.waist * 1.04, 0.017, 8, 32]} />
            <Mat color="#4a2f1c" />
          </mesh>
          <mesh position={[0, 0, front(s.waist * 1.04) + 0.012]}>
            <boxGeometry args={[0.045, 0.032, 0.01]} />
            <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      )}

      {/* ---------- Upper body (the top) ---------- */}
      <mesh castShadow geometry={torso}>
        <Mat color={a.topColor} />
      </mesh>
      <TopDetails a={a} s={s} front={front} />
      {/* Neck */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.045, 0.052, 0.12, 14]} />
        <Mat color={a.skin} />
      </mesh>

      {/* ---------- Arms: shoulder -> elbow -> hand ---------- */}
      {[-s.shoulderX, s.shoulderX].map((x, i) => (
        <group key={i} position={[x, 0.37, 0]} ref={(el) => (L.arms[i] = el)}>
          {/* tilted a little away from the body */}
          <group rotation={[0, 0, x < 0 ? -0.07 : 0.07]}>
            <mesh castShadow>
              <sphereGeometry args={[s.armR * 1.55, 14, 10]} />
              <Mat color={a.top === 'tank' ? a.skin : a.topColor} />
            </mesh>
            <mesh castShadow position={[0, -0.14, 0]}>
              <capsuleGeometry args={[s.armR, 0.29 - 2 * s.armR, 6, 12]} />
              <Mat color={longSleeves ? a.topColor : a.skin} />
            </mesh>
            {shortSleeves && (
              <mesh castShadow position={[0, -0.06, 0]}>
                <capsuleGeometry args={[s.armR * 1.38, 0.09, 6, 12]} />
                <Mat color={a.topColor} />
              </mesh>
            )}
            <group position={[0, -0.27, 0]} ref={(el) => (L.elbows[i] = el)}>
              <mesh castShadow position={[0, -0.115, 0]}>
                <capsuleGeometry args={[s.armR * 0.92, 0.26 - 2 * s.armR * 0.92, 6, 12]} />
                <Mat color={longSleeves ? a.topColor : a.skin} />
              </mesh>
              {longSleeves && (
                <mesh position={[0, -0.215, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[s.armR * 0.95, 0.011, 6, 16]} />
                  <Mat color={a.topColor} />
                </mesh>
              )}
              {a.extra === 'watch' && i === 1 && (
                <mesh position={[0, -0.205, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[s.armR * 0.95, 0.014, 6, 16]} />
                  <meshStandardMaterial color="#c0c4c8" metalness={0.8} roughness={0.3} />
                </mesh>
              )}
              <Hand skin={a.skin} r={s.armR} side={x < 0 ? -1 : 1} />
              {i === 0 && (
                // Pickleball paddle in the right hand
                <group ref={paddleRef} position={[0, -0.3, 0.04]}>
                  <mesh castShadow position={[0, 0, 0.05]}>
                    <cylinderGeometry args={[0.016, 0.016, 0.13, 8]} />
                    <meshStandardMaterial color="#222" />
                  </mesh>
                  <mesh castShadow position={[0, 0, 0.25]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1.25]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.022, 20]} />
                    <meshStandardMaterial color="#1e88e5" />
                  </mesh>
                </group>
              )}
            </group>
          </group>
        </group>
      ))}

      {/* ---------- Head ---------- */}
      <group position={[0, 0.645, 0]}>
        <Head a={a} s={s} />
        {hair && (
          <mesh castShadow geometry={hair}>
            <meshStandardMaterial color={a.hairColor} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        )}
        {a.extra === 'cap' && <Cap r={s.headR} color={a.topColor === '#f4f4f4' ? '#222222' : a.topColor} />}
        {a.extra === 'glasses' && a.eyes !== 'cool' && <Glasses r={s.headR} />}
      </group>
    </group>
  )
}

// Collars, buttons, hood, drawstrings
function TopDetails({ a, s, front }) {
  const neckZ = 0.062
  if (a.top === 'longsleeve' || a.top === 'polo') {
    const buttons = a.top === 'longsleeve' ? [0.34, 0.25, 0.16, 0.07] : [0.37, 0.32]
    return (
      <>
        {[-1, 1].map((sx) => (
          <mesh key={sx} castShadow position={[sx * 0.036, 0.445, neckZ]} rotation={[-0.35, 0, sx * 0.55]}>
            <boxGeometry args={[0.07, 0.04, 0.012]} />
            <Mat color={a.topColor} />
          </mesh>
        ))}
        {buttons.map((y) => (
          <mesh key={y} position={[0, y, front(y > 0.15 ? s.chest : s.belly) + 0.002]}>
            <sphereGeometry args={[0.008, 8, 6]} />
            <Mat color="#f4f4f4" />
          </mesh>
        ))}
      </>
    )
  }
  if (a.top === 'blouse') {
    // Round white "Peter Pan" collar
    return (
      <>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.034, 0.44, neckZ - 0.004]} rotation={[-0.45, sx * 0.25, 0]} scale={[1, 0.8, 1]}>
            <cylinderGeometry args={[0.036, 0.036, 0.008, 18, 1, false, 0, Math.PI]} />
            <Mat color="#ffffff" />
          </mesh>
        ))}
      </>
    )
  }
  if (a.top === 'hoodie') {
    return (
      <>
        <mesh castShadow position={[0, 0.44, -0.055]} rotation={[Math.PI / 2 + 0.6, 0, 0]}>
          <torusGeometry args={[0.1, 0.042, 8, 22]} />
          <Mat color={a.topColor} />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.03, 0.35, front(s.chest) + 0.004]}>
            <cylinderGeometry args={[0.004, 0.004, 0.12, 6]} />
            <Mat color="#f4f4f4" />
          </mesh>
        ))}
        <mesh position={[0, 0.03, front(s.belly) + 0.004]}>
          <boxGeometry args={[0.19, 0.085, 0.01]} />
          <Mat color={a.topColor} />
        </mesh>
      </>
    )
  }
  if (a.top === 'tshirt') {
    return (
      <mesh position={[0, 0.455, 0.012]} rotation={[Math.PI / 2 - 0.25, 0, 0]} scale={[1, 0.85, 1]}>
        <torusGeometry args={[0.058, 0.011, 6, 20]} />
        <Mat color={a.topColor} />
      </mesh>
    )
  }
  return null
}

function Hand({ skin, r, side }) {
  return (
    <group position={[0, -0.26, 0]}>
      <mesh castShadow position={[0, -0.035, 0]} scale={[0.75, 1.25, 0.55]}>
        <sphereGeometry args={[r * 1.25, 12, 10]} />
        <Mat color={skin} />
      </mesh>
      {/* thumb */}
      <mesh castShadow position={[-side * r * 0.55, -0.02, r * 0.55]} rotation={[0.4, 0, side * 0.5]}>
        <capsuleGeometry args={[r * 0.32, 0.025, 4, 8]} />
        <Mat color={skin} />
      </mesh>
    </group>
  )
}

// Shoes point forward (+z). The ankle is at y = 0, the ground at y = -0.06.
function Shoe({ type, color, skin }) {
  const sole = (w, len, y, c) => (
    <mesh castShadow position={[0, y, 0.035]}>
      <boxGeometry args={[w, 0.016, len]} />
      <Mat color={c} />
    </mesh>
  )
  const body = (r, len, sy, c, y = -0.03) => (
    <mesh castShadow position={[0, y, 0.035]} rotation={[Math.PI / 2, 0, 0]} scale={[1.12, 1, sy]}>
      <capsuleGeometry args={[r, len, 6, 14]} />
      <Mat color={c} />
    </mesh>
  )
  if (type === 'tsinelas') {
    return (
      <>
        {body(0.034, 0.1, 0.62, skin, -0.035)}
        {sole(0.1, 0.22, -0.055, color)}
        <mesh position={[0, -0.03, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.036, 0.008, 6, 12, Math.PI]} />
          <Mat color={color} />
        </mesh>
      </>
    )
  }
  if (type === 'flats') {
    return (
      <>
        {body(0.036, 0.1, 0.6, skin, -0.028)}
        {body(0.039, 0.1, 0.48, color, -0.04)}
        {sole(0.085, 0.19, -0.056, '#3a2a20')}
      </>
    )
  }
  if (type === 'sneakers') {
    return (
      <>
        {body(0.047, 0.1, 0.8, color, -0.027)}
        {sole(0.105, 0.21, -0.052, color === '#f4f4f4' ? '#cfcfcf' : '#f4f4f4')}
        <mesh position={[0, -0.0, 0.07]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.04, 0.004, 0.06]} />
          <Mat color={color === '#f4f4f4' ? '#9e9e9e' : '#f4f4f4'} />
        </mesh>
      </>
    )
  }
  if (type === 'boots') {
    return (
      <>
        {body(0.046, 0.1, 0.8, color, -0.027)}
        {sole(0.1, 0.2, -0.053, '#2a1e16')}
        <mesh castShadow position={[0, 0.05, -0.005]}>
          <cylinderGeometry args={[0.052, 0.05, 0.14, 14]} />
          <Mat color={color} />
        </mesh>
      </>
    )
  }
  // Leather shoes
  return (
    <>
      {body(0.042, 0.11, 0.72, color, -0.03)}
      {sole(0.092, 0.2, -0.054, '#2a1e16')}
    </>
  )
}

function Head({ a, s }) {
  const r = s.headR
  const f = s.female
  const brows = a.hairStyle === 'bald' ? '#3b2416' : a.hairColor
  return (
    <group>
      {/* Skull and face */}
      <mesh castShadow scale={[0.94, 1.08, 1]}>
        <sphereGeometry args={[r, 28, 20]} />
        <Mat color={a.skin} />
      </mesh>
      {/* Cheeks and jaw (rounder when chubby, softer for women) */}
      <mesh castShadow position={[0, -0.058, 0.026]} scale={[s.chubby ? 1.18 : f ? 1.0 : 1.06, 0.82, 1]}>
        <sphereGeometry args={[r * 0.75, 22, 16]} />
        <Mat color={a.skin} />
      </mesh>
      {/* Ears */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * r * 0.93, -0.005, -0.005]} scale={[0.45, 1, 0.75]}>
          <sphereGeometry args={[0.032, 10, 8]} />
          <Mat color={a.skin} />
        </mesh>
      ))}
      <Eyes a={a} r={r} brows={brows} />
      {/* Nose */}
      <mesh position={[0, -0.022, r * 0.99]} scale={[0.85, 1.25, 1]}>
        <sphereGeometry args={[0.019, 12, 10]} />
        <Mat color={a.skin} />
      </mesh>
      {/* Mouth: a friendly smile (women get some lip color) */}
      <mesh position={[0, -0.066, r * 0.92]} rotation={[0.25, 0, Math.PI]}>
        <torusGeometry args={[0.028, f ? 0.0075 : 0.0055, 6, 16, Math.PI]} />
        <Mat color={f ? '#c4566a' : '#7a3a30'} />
      </mesh>
      {f && [-1, 1].map((sx) => (
        // a little blush
        <mesh key={sx} position={[sx * 0.068, -0.035, r * 0.82]} scale={[1, 0.6, 0.3]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <Mat color="#e8998f" />
        </mesh>
      ))}
    </group>
  )
}

function Eyes({ a, r, brows }) {
  const f = a.gender === 'female'
  if (a.eyes === 'cool') {
    return (
      <group position={[0, 0.02, r * 0.93]}>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.05, 0, 0.004]} scale={[1.25, 0.85, 0.35]}>
            <sphereGeometry args={[0.034, 14, 10]} />
            <meshStandardMaterial color="#111" metalness={0.5} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[0, 0.008, 0.012]}>
          <boxGeometry args={[0.03, 0.008, 0.008]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>
    )
  }
  return [-1, 1].map((sx) => (
    <group key={sx} position={[sx * 0.05, 0.018, r * 0.86]}>
      {a.eyes === 'happy' ? (
        <mesh position={[0, -0.004, 0.012]}>
          <torusGeometry args={[0.019, 0.0055, 6, 12, Math.PI]} />
          <Mat color="#24160c" />
        </mesh>
      ) : (
        <>
          <mesh scale={[1, 1.15, 0.6]}>
            <sphereGeometry args={[0.027, 14, 12]} />
            <Mat color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.002, 0.013]}>
            <sphereGeometry args={[0.016, 12, 10]} />
            <Mat color={a.eyeColor} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.002, 0.02]}>
            <sphereGeometry args={[0.009, 10, 8]} />
            <Mat color="#0d0a08" roughness={0.2} />
          </mesh>
          <mesh position={[0.006, 0.006, 0.026]}>
            <sphereGeometry args={[0.004, 6, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {a.eyes === 'sleepy' && (
            <mesh position={[0, 0.011, 0.003]} scale={[1.18, 0.75, 0.68]}>
              <sphereGeometry args={[0.029, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <Mat color={a.skin} />
            </mesh>
          )}
        </>
      )}
      {f && (
        // eyelashes
        <mesh position={[sx * 0.012, 0.024, 0.012]} rotation={[0, 0, sx * -0.35]}>
          <boxGeometry args={[0.03, 0.005, 0.006]} />
          <Mat color="#1a1410" />
        </mesh>
      )}
      {/* Eyebrow: a gentle arch */}
      <mesh position={[0, 0.036, 0.008]} rotation={[0, 0, sx * 0.1]}>
        <torusGeometry args={[0.026, f ? 0.004 : 0.0065, 6, 12, Math.PI * 0.7]} />
        <Mat color={brows} />
      </mesh>
    </group>
  ))
}

function Glasses({ r }) {
  return (
    <group position={[0, 0.018, r * 0.95]}>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.05, 0, 0]}>
          <torusGeometry args={[0.03, 0.0045, 6, 18]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      ))}
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[0.04, 0.005, 0.005]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  )
}

function Cap({ r, color }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.05, -0.008]} rotation={[-0.2, 0, 0]} scale={[1.02, 1.1, 1.08]}>
        <sphereGeometry args={[r * 1.04, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.44]} />
        <Mat color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.085, r * 0.85]} rotation={[0.15, 0, 0]} scale={[1, 1, 1.35]}>
        <cylinderGeometry args={[r * 0.72, r * 0.76, 0.016, 20, 1, false, -Math.PI / 2, Math.PI]} />
        <Mat color={color} />
      </mesh>
    </group>
  )
}

// ---------- Hair: every style is glued into one shape (quick to draw) ----------
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
      if (ring >= skipFront && z > 0.3) continue // keep the face free
      const out = r * (1.0 + random() * 0.06)
      points.push({
        normal: new THREE.Vector3(Math.sin(around) * Math.sin(polar), Math.cos(polar), z),
        position: [Math.sin(around) * Math.sin(polar) * out, Math.cos(polar) * out * 1.08, z * out],
        size: 0.034 + random() * 0.016,
      })
    }
  }
  return points
}

function hairGeometry(style, r, underCap) {
  if (style === 'bald') return null
  const R = r * 1.06
  // Top of the head
  const cap = (amount = 0.47, tilt = -0.3) =>
    new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, 0, Math.PI * amount).rotateX(tilt).scale(1, 1.08, 1)
  // Hair all around the head down to `amount`, with an opening for the face
  const around = (amount, gap = 1.9) =>
    new THREE.SphereGeometry(R * 1.04, 30, 16, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, 0, Math.PI * amount)
      .scale(0.97, 1.1, 1)
  const bangs = (y, width = 1.0) =>
    new THREE.SphereGeometry(R * 0.82, 20, 10).scale(1.08 * width, 0.3, 0.55).translate(0, y, R * 0.6)
  const parts = []

  if (style === 'short') {
    parts.push(cap(0.46))
    parts.push(new THREE.SphereGeometry(0.06, 14, 10).scale(1.8, 0.55, 0.9).translate(0, r * 0.9, r * 0.5))
  }
  if (style === 'sidepart') {
    parts.push(cap(0.48))
    // a neat swoop of hair to one side
    parts.push(new THREE.SphereGeometry(0.07, 16, 12).scale(1.6, 0.6, 1.2).rotateZ(-0.25).translate(r * 0.22, r * 0.95, r * 0.42))
  }
  if (style === 'curly') {
    parts.push(cap(0.47))
    if (!underCap) headPoints(r, 5, 3, 42).forEach((c) => parts.push(new THREE.SphereGeometry(c.size, 8, 6).translate(...c.position)))
  }
  if (style === 'spiky') {
    parts.push(cap(0.46))
    if (!underCap) {
      const up = new THREE.Vector3(0, 1, 0)
      headPoints(r, 3, 9, 7).forEach((c) => {
        const spike = new THREE.ConeGeometry(0.032, 0.1, 6).translate(0, 0.04, 0)
        spike.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, c.normal.clone().normalize()))
        parts.push(spike.translate(...c.position))
      })
    }
  }
  if (style === 'bob') {
    // Chin-length bob with bangs
    parts.push(around(0.62))
    parts.push(bangs(r * 0.72))
  }
  if (style === 'long') {
    parts.push(around(0.66))
    parts.push(bangs(r * 0.78, 0.9))
    // hair falling down the back past the shoulders
    parts.push(new THREE.CapsuleGeometry(R * 0.85, 0.2, 6, 16).scale(1.08, 1, 0.42).translate(0, -0.2, -0.07))
  }
  if (style === 'ponytail') {
    parts.push(cap(0.5, -0.2))
    parts.push(new THREE.SphereGeometry(0.035, 10, 8).translate(0, r * 0.35, -r * 1.02))
    parts.push(new THREE.CapsuleGeometry(0.042, 0.2, 4, 10).rotateX(0.3).translate(0, r * 0.35 - 0.14, -r * 1.1))
  }
  if (style === 'bun') {
    parts.push(cap(0.5, -0.2))
    if (!underCap) parts.push(new THREE.SphereGeometry(0.065, 16, 12).translate(0, r * 1.02, -r * 0.35))
  }
  return mergeGeometries(parts)
}

const lerp = THREE.MathUtils.lerp

// Move arms and legs. moving = walking, swing = -1 or 0..1 (paddle swing),
// sit = 0..1 (how far sat down), female = sit mahinhin (legs together, folded to the side)
export function animatePerson(limbs, time, moving, speed, swing = -1, sit = 0, female = false) {
  // 3D model characters read this to pick their animation (see ModelPerson.jsx)
  const last = limbs.current.motion
  limbs.current.motion = { moving, speed, swing, sit, air: last?.air ?? false, dive: last?.dive ?? false, skate: last?.skate ?? false }
  const { legs, arms, knees = [], elbows = [] } = limbs.current
  if (!legs?.[1] || !arms?.[1]) return
  const k = 0.3
  const step = moving ? Math.sin(time * speed * 3) * 0.55 : 0

  for (let i = 0; i < 2; i++) {
    const walk = i ? step : -step
    // Sitting on the ground: men with knees up, women mahinhin (legs folded to one side)
    const sitHip = female ? -1.5 : -2.0
    const sitYaw = female ? 0.55 : 0
    const sitSpread = female ? 0 : (i ? 1 : -1) * 0.16
    const sitKnee = female ? 2.5 : 1.75
    legs[i].rotation.x = lerp(legs[i].rotation.x, lerp(walk, sitHip, sit), k)
    legs[i].rotation.y = lerp(legs[i].rotation.y, sitYaw * sit, k)
    legs[i].rotation.z = lerp(legs[i].rotation.z, sitSpread * sit, k)
    // The knee bends when the leg swings back (and a lot when sitting)
    if (knees[i]) knees[i].rotation.x = lerp(knees[i].rotation.x, lerp(Math.max(0, walk) * 1.1 + 0.04, sitKnee, sit), k)
  }

  // Arms: swing while walking; when sitting, men rest them on their knees, women on their lap
  const sitShoulder = female ? -0.4 : -0.55
  const sitElbow = female ? -1.2 : -0.55
  const sitInward = female ? 0.28 : 0
  arms[1].rotation.x = lerp(arms[1].rotation.x, lerp(-step, sitShoulder, sit), k)
  arms[1].rotation.z = lerp(arms[1].rotation.z, -sitInward * sit, k)
  if (elbows[1]) elbows[1].rotation.x = lerp(elbows[1].rotation.x, lerp(-0.15, sitElbow, sit), k)
  if (swing >= 0) {
    // Big forward swing with the paddle arm
    arms[0].rotation.x = -Math.sin(swing * Math.PI) * 1.9
    arms[0].rotation.z = (swing - 0.5) * 1.2
    if (elbows[0]) elbows[0].rotation.x = -0.35
  } else {
    arms[0].rotation.x = lerp(arms[0].rotation.x, lerp(step, sitShoulder, sit), k)
    arms[0].rotation.z = lerp(arms[0].rotation.z, sitInward * sit, k)
    if (elbows[0]) elbows[0].rotation.x = lerp(elbows[0].rotation.x, lerp(-0.15, sitElbow, sit), k)
  }
}
