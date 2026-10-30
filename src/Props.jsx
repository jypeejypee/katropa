import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import { rng, BUILDING_LINE } from './world.js'
import { signTexture, skyTexture, cloudTexture, moonTexture } from './textures.js'

const LEAF_COLORS = ['#5f8a3b', '#4e7a2e', '#6e9443', '#7d9a45', '#41662a', '#58843a']
const yAxis = new THREE.Vector3(0, 1, 0)

// A cylinder stretched between two points (used for tree trunks and branches)
function Limb({ from, to, radius, color }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = b.clone().sub(a)
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(yAxis, dir.clone().normalize()),
      length: dir.length(),
    }
  }, [from, to])
  return (
    <mesh castShadow position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius * 0.65, radius, length, 7]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// Big shady street tree whose leaves spread over the road.
// lean: 1 = spreads toward +x (use on the left side), -1 = toward -x (right side)
export function Tree({ position, scale = 1, lean = 0, seed = 1 }) {
  const { branches, leaves, top } = useMemo(() => {
    const random = rng(seed * 97 + 13)
    const top = [lean * 0.5, 3.6, 0]
    const branches = Array.from({ length: 5 }, (_, i) => [
      lean * (0.5 + random() * 4.5) + (i === 0 ? -lean * 1.5 : 0),
      6.3 + random() * 2.2,
      (random() - 0.5) * 7,
    ])
    const leaves = []
    branches.forEach((end) => {
      for (let i = 0; i < 6; i++) {
        leaves.push({
          pos: [end[0] + (random() - 0.5) * 4.5, end[1] + (random() - 0.3) * 2, end[2] + (random() - 0.5) * 4.5],
          r: 1.0 + random() * 1.0,
          color: random() < 0.08 ? '#a99a45' : LEAF_COLORS[Math.floor(random() * LEAF_COLORS.length)],
        })
      }
    })
    return { branches, leaves, top }
  }, [seed, lean])

  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[position[0], 2.1 * scale, position[2]]}>
        <CylinderCollider args={[2.1 * scale, 0.4 * scale]} />
      </RigidBody>
      <group position={position} scale={scale}>
        <Limb from={[0, 0, 0]} to={top} radius={0.38} color="#5b4a3a" />
        {branches.map((end, i) => (
          <Limb key={i} from={top} to={end} radius={0.2} color="#5b4a3a" />
        ))}
        {leaves.map((leaf, i) => (
          <mesh key={i} castShadow position={leaf.pos} scale={[1, 0.65, 1]}>
            <icosahedronGeometry args={[leaf.r, 0]} />
            <meshStandardMaterial color={leaf.color} flatShading />
          </mesh>
        ))}
      </group>
    </>
  )
}

// A cable hanging between two points, sagging in the middle
function sagCurve(from, to, sag) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const points = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    const p = a.clone().lerp(b, t)
    p.y -= sag * 4 * t * (1 - t)
    points.push(p)
  }
  return new THREE.CatmullRomCurve3(points)
}

// Electric posts with the famous tangle of wires.
// lines: [{ poles: [{x, z, transformer}], bundle: number of internet cables, bundleY: their height }]
// The last post of one line is wired to the first post of the next (so wires cross the street).
export function PowerLines({ lines }) {
  const wireGeometry = useMemo(() => {
    const random = rng(7)
    const pieces = []
    const add = (from, to, sag, radius) =>
      pieces.push(new THREE.TubeGeometry(sagCurve(from, to, sag), 16, radius, 4, false))
    const span = (a, b, bundle, bundleY) => {
      // Electric lines on the cross-arm at the top
      for (const dx of [-0.7, 0, 0.7]) add([a.x + dx, 9.35, a.z], [b.x + dx, 9.35, b.z], 0.4, 0.015)
      // Internet and phone cables, all bunched together
      for (let k = 0; k < bundle; k++) {
        const y = bundleY + (k % 5) * 0.1
        add([a.x + 0.2, y, a.z], [b.x + 0.2, y, b.z], 0.6 + random() * 0.9, 0.02)
      }
    }

    lines.forEach((line, n) => {
      const { poles, bundle = 7, bundleY = 6.5 } = line
      for (let i = 0; i < poles.length - 1; i++) span(poles[i], poles[i + 1], bundle, bundleY)
      const next = lines[n + 1]
      if (next) span(poles[poles.length - 1], next.poles[0], Math.min(bundle, next.bundle ?? 7), bundleY)
      // Cables from each post to the houses on both sides
      for (const p of poles) {
        const near = Math.sign(p.x) * BUILDING_LINE
        add([p.x, bundleY + 0.3, p.z], [-near, 5.3, p.z + 3], 0.7, 0.018)
        add([p.x, bundleY + 0.4, p.z], [-near, 5.6, p.z - 5], 0.9, 0.018)
        add([p.x, bundleY + 0.2, p.z], [near, 4.6, p.z - 4], 0.3, 0.018)
      }
    })
    return mergeGeometries(pieces)
  }, [lines])

  return (
    <>
      <mesh geometry={wireGeometry}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      {lines.flatMap((line) => line.poles).map((p, i) => (
        <group key={i}>
          <RigidBody type="fixed" colliders={false} position={[p.x, 5, p.z]}>
            <CylinderCollider args={[5, 0.2]} />
          </RigidBody>
          <group position={[p.x, 0, p.z]}>
            <mesh castShadow position={[0, 5, 0]}>
              <cylinderGeometry args={[0.13, 0.2, 10, 10]} />
              <meshStandardMaterial color="#aaa69d" />
            </mesh>
            <mesh castShadow position={[0, 9.2, 0]}>
              <boxGeometry args={[1.8, 0.12, 0.12]} />
              <meshStandardMaterial color="#555" />
            </mesh>
            {[-0.7, 0, 0.7].map((dx) => (
              <mesh key={dx} position={[dx, 9.32, 0]}>
                <cylinderGeometry args={[0.05, 0.06, 0.15, 6]} />
                <meshStandardMaterial color="#e8e8e8" />
              </mesh>
            ))}
            {p.transformer && (
              <mesh castShadow position={[0.45, 7.8, 0]}>
                <cylinderGeometry args={[0.32, 0.32, 1.1, 12]} />
                <meshStandardMaterial color="#8a9093" metalness={0.4} roughness={0.5} />
              </mesh>
            )}
          </group>
        </group>
      ))}
    </>
  )
}

// LED street light on a concrete post (solar: a small solar panel on top)
export function StreetLamp({ x, z, solar = true }) {
  const dir = x > 0 ? -1 : 1 // the arm points toward the middle of the road
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[x, 3.75, z]}>
        <CylinderCollider args={[3.75, 0.12]} />
      </RigidBody>
      <mesh castShadow position={[x, 3.75, z]}>
        <cylinderGeometry args={[0.08, 0.13, 7.5, 8]} />
        <meshStandardMaterial color="#cfcfcb" />
      </mesh>
      <Limb from={[x, 7.3, z]} to={[x + dir * 1.8, 7.75, z]} radius={0.05} color="#d8d8d8" />
      <mesh castShadow position={[x + dir * 2.1, 7.72, z]}>
        <boxGeometry args={[0.7, 0.1, 0.3]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      {solar && (
        <mesh castShadow position={[x, 7.95, z]} rotation={[0, 0, dir * -0.4]}>
          <boxGeometry args={[1.0, 0.04, 0.7]} />
          <meshStandardMaterial color="#1b2a4a" metalness={0.5} roughness={0.3} />
        </mesh>
      )}
    </>
  )
}

// Sign board. Can stand on posts on the sidewalk, or hang flat on a wall.
export function Sign({ position, rotation = 0, size, text, bg, fg, vertical = false, posts = false }) {
  const [w, h] = size
  const map = signTexture({ text, bg, fg, vertical }, w, h)
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.05]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} />
      </mesh>
      {posts && (
        <>
          <mesh position={[0, 0, -0.03]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial map={map} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} castShadow position={[s * (w / 2 + 0.03), (h / 2 - position[1]) / 2, 0]}>
              <boxGeometry args={[0.05, position[1] + h / 2, 0.05]} />
              <meshStandardMaterial color="#555" />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}

function Shrub({ position, size = 1, seed = 1 }) {
  const random = rng(seed)
  return (
    <group position={position} scale={size}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} castShadow position={[(random() - 0.5) * 0.6, 0.35 + i * 0.22, (random() - 0.5) * 0.6]} scale={[1, 1.2, 1]}>
          <icosahedronGeometry args={[0.38 - i * 0.06, 0]} />
          <meshStandardMaterial color={LEAF_COLORS[(i + seed) % LEAF_COLORS.length]} flatShading />
        </mesh>
      ))}
    </group>
  )
}

export function PottedPlant({ position, size = 1, seed = 1 }) {
  return (
    <group position={position} scale={size}>
      <mesh castShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.28, 0.2, 0.5, 10]} />
        <meshStandardMaterial color="#8d5a3b" />
      </mesh>
      <Shrub position={[0, 0.3, 0]} size={0.8} seed={seed} />
    </group>
  )
}

// A clump of bamboo
export function Bamboo({ position, seed = 1 }) {
  const stalks = useMemo(() => {
    const random = rng(seed * 31)
    return Array.from({ length: 14 }, () => ({
      x: (random() - 0.5) * 0.7,
      z: (random() - 0.5) * 1.2,
      h: 3.5 + random() * 2.5,
      tiltX: (random() - 0.5) * 0.35,
      tiltZ: (random() - 0.5) * 0.35,
    }))
  }, [seed])
  return (
    <group position={position}>
      {stalks.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation={[s.tiltX, 0, s.tiltZ]}>
          <mesh castShadow position={[0, s.h / 2, 0]}>
            <cylinderGeometry args={[0.03, 0.04, s.h, 5]} />
            <meshStandardMaterial color="#b3b552" />
          </mesh>
          <mesh castShadow position={[0, s.h - 0.8, 0]} scale={[0.7, 1.6, 0.7]}>
            <icosahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial color={i % 2 ? '#8fae4c' : '#9bb85a'} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Concrete plant box along the sidewalk. plants: 'shrubs', 'bamboo' or 'none'
export function Planter({ position, length, height = 0.9, railing = true, railColor = '#222', plants = 'shrubs', color = '#a88a68', soil = '#4a3b2c' }) {
  const count = Math.max(1, Math.floor(length / 1.6))
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[position[0], height / 2 + 0.3, position[2]]}>
        <CuboidCollider args={[0.45, height / 2 + 0.3, length / 2]} />
      </RigidBody>
      <group position={position}>
        <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
          <boxGeometry args={[0.9, height, length]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, height + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.75, length - 0.15]} />
          <meshStandardMaterial color={soil} />
        </mesh>
        {railing && (
          <>
            <mesh castShadow position={[0.3, height + 0.55, 0]}>
              <boxGeometry args={[0.05, 0.05, length]} />
              <meshStandardMaterial color={railColor} />
            </mesh>
            {Array.from({ length: Math.floor(length / 1.5) + 1 }, (_, i) => (
              <mesh key={i} position={[0.3, height + 0.28, -length / 2 + i * 1.5]}>
                <boxGeometry args={[0.05, 0.55, 0.05]} />
                <meshStandardMaterial color={railColor} />
              </mesh>
            ))}
          </>
        )}
        {Array.from({ length: count }, (_, i) => {
          const z = -length / 2 + (length / count) * (i + 0.5)
          if (plants === 'bamboo') return <Bamboo key={i} position={[0, height, z]} seed={i + 3} />
          if (plants === 'shrubs') return <Shrub key={i} position={[0, height - 0.1, z]} size={1.3} seed={i + 1} />
          return null
        })}
      </group>
    </>
  )
}

// Metal pipe frame in front of a shop (like the yellow one in photo 1)
export function PipeFrame({ position, width, height = 2.6, color = '#e0b21f' }) {
  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[0, height / 2, s * width / 2]}>
          <cylinderGeometry args={[0.04, 0.04, height, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      <mesh castShadow position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, width, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, height - 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, width, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

// Blue bucket with a broom leaning in it
export function Bucket({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.17, 0.13, 0.34, 12]} />
        <meshStandardMaterial color="#1f78c8" />
      </mesh>
      <mesh castShadow position={[0.05, 0.75, 0]} rotation={[0, 0, -0.12]}>
        <cylinderGeometry args={[0.015, 0.015, 1.3, 6]} />
        <meshStandardMaterial color="#2a62b8" />
      </mesh>
    </group>
  )
}

// The moon shining on the river: a path of little glints on the water, from you toward the moon
const MOON_PATH = { start: 10, length: 170, width: 12 }
export function MoonPath({ moon, water, on }) {
  const group = useRef()
  const dir = useMemo(() => new THREE.Vector2(moon[0], moon[2]).normalize(), [moon])
  useFrame(({ camera }) => {
    const g = group.current
    g.visible = on
    if (!on) return
    const ahead = MOON_PATH.start + MOON_PATH.length / 2
    const [z0, z1] = water.z
    // follow you, but always stay on the water
    g.position.set(
      camera.position.x + dir.x * ahead,
      water.y + 0.02,
      THREE.MathUtils.clamp(camera.position.z + dir.y * ahead, z0 + MOON_PATH.width / 2, z1 - MOON_PATH.width / 2),
    )
  })
  return (
    <group ref={group} rotation={[0, Math.atan2(dir.x, dir.y), 0]} visible={false}>
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[MOON_PATH.width, MOON_PATH.length]} />
        <meshBasicMaterial map={moonPathTexture()} transparent blending={THREE.AdditiveBlending}
          depthWrite={false} side={THREE.DoubleSide} fog={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Glints on the water: short bright lines, most in the middle, fading near you and far away
let pathTexture = null
function moonPathTexture() {
  if (pathTexture) return pathTexture
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  const random = rng(17)
  for (let i = 0; i < 2600; i++) {
    const y = random() * canvas.height
    const far = 1 - y / canvas.height // 0 = near you, 1 = far away (the top of the picture is the far end)
    const fade = Math.min(1, far / 0.12) * Math.min(1, (1 - far) / 0.35)
    // most glints near the middle line, fewer toward the sides
    const spread = (random() + random() + random() - 1.5) / 1.5
    const x = 64 + spread * 60
    const alpha = fade * (1 - Math.abs(spread)) * (0.25 + random() * 0.6)
    ctx.fillStyle = `rgba(220, 228, 255, ${alpha})`
    ctx.fillRect(x - 3 - random() * 10, y, 6 + random() * 20, 1 + random() * 2)
  }
  pathTexture = new THREE.CanvasTexture(canvas)
  pathTexture.colorSpace = THREE.SRGBColorSpace
  return pathTexture
}

// Sky dome, clouds, and (at night) stars and the moon. time: settings from timeOfDay.js, moon: where it is (maps.js)
export function SkyAndClouds({ time, low, moon }) {
  const stars = useMemo(() => {
    const random = rng(33)
    const points = []
    for (let i = 0; i < 700; i++) {
      const angle = random() * Math.PI * 2
      const height = 0.08 + random() * 0.92 // only above the horizon
      const r = Math.sqrt(1 - height * height)
      points.push(Math.cos(angle) * r * 300, height * 300, Math.sin(angle) * r * 300)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    return geometry
  }, [])
  const clouds = useMemo(() => {
    const random = rng(21)
    return Array.from({ length: 26 }, (_, i) => {
      const angle = random() * Math.PI * 2
      const dist = 120 + random() * 160
      return {
        seed: i % 6,
        position: [Math.cos(angle) * dist, 55 + random() * 60, Math.sin(angle) * dist],
        scale: [50 + random() * 60, 22 + random() * 18, 1],
      }
    })
  }, [])
  // The sky, stars and moon move with the camera, so you never reach the edge of the sky
  const dome = useRef()
  useFrame(({ camera }) => dome.current.position.copy(camera.position))
  return (
    <>
      <group ref={dome}>
        <mesh>
          <sphereGeometry args={[350, 32, 16]} />
          <meshBasicMaterial map={skyTexture(time.sky)} side={THREE.BackSide} fog={false} depthWrite={false} />
        </mesh>
        <points geometry={stars} visible={time.stars}>
          <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} fog={false} depthWrite={false} />
        </points>
        <sprite position={moon} scale={[85, 85, 1]} visible={time.stars} renderOrder={1}>
          <spriteMaterial map={moonTexture()} transparent fog={false} depthWrite={false} />
        </sprite>
      </group>
      {(low ? clouds.slice(0, 10) : clouds).map((c, i) => (
        <sprite key={i} position={c.position} scale={c.scale}>
          <spriteMaterial map={cloudTexture(c.seed)} color={time.cloudColor} opacity={time.cloudOpacity}
            transparent fog={false} depthWrite={false} />
        </sprite>
      ))}
    </>
  )
}
