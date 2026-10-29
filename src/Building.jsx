import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { BUILDING_LINE } from './world.js'
import { tinTexture, shutterTexture, gateTexture, storeTexture, stripesTexture, signTexture } from './textures.js'

const FLOOR = 3 // height of one floor in meters

// One building beside the road. See houses.js for what each setting does.
export default function Building(props) {
  const { side, z, width, depth = 8, floors = 1, stairs } = props
  const height = props.height ?? floors * FLOOR
  const x = side === 'left' ? -(BUILDING_LINE + depth / 2) : BUILDING_LINE + depth / 2
  const out = side === 'left' ? 1 : -1 // which way is toward the road
  return (
    <>
      {/* Invisible solid box so the player can't walk through the building */}
      <RigidBody type="fixed" colliders={false} position={[x, height / 2, z]}>
        <CuboidCollider args={[depth / 2, height / 2, width / 2]} />
      </RigidBody>
      {stairs && (
        <RigidBody type="fixed" colliders={false} position={[out * -BUILDING_LINE + out * 0.75, stairs / 2, z]}>
          <CuboidCollider args={[0.75, stairs / 2, width / 2]} />
        </RigidBody>
      )}
      {/* Roofs over the sidewalk are solid too, so the camera stays under them */}
      {(props.roof === 'tin' || props.eave) && (
        <RigidBody type="fixed" colliders={false} position={[out * -BUILDING_LINE + out * 1.0, height + 0.1, z]}>
          <CuboidCollider args={[1.0, 0.15, width / 2]} />
        </RigidBody>
      )}
      {/* Turn the building so its front faces the road */}
      <group position={[x, 0, z]} rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <BuildingBody {...props} height={height} />
      </group>
    </>
  )
}

// Everything below is built as if the front of the building faces +z
function BuildingBody({
  width, depth = 8, floors = 1, height,
  wallColor = '#eeeeee', groundColor, trimColor = '#ffffff', roof = 'flat', roofColor = '#b5562f', gable = false,
  front = 'shutter', awning, sign, balcony = false, pillars, stairs, railing = false, pergola, eave, billboard = false,
  annex, ac = false,
}) {
  const f = depth / 2 // the front wall
  const awningStyle = typeof awning === 'object' ? awning : awning ? { color: awning } : null
  return (
    <group>
      <Box size={[width, height, depth]} position={[0, height / 2, 0]} color={wallColor} />
      {groundColor && (
        <mesh position={[0, FLOOR / 2, f + 0.005]}>
          <planeGeometry args={[width, FLOOR]} />
          <meshStandardMaterial color={groundColor} />
        </mesh>
      )}
      <Storefront type={front} width={width} z={f} lift={stairs ?? 0} />
      {pillars && [-1, 1].map((s) => (
        <Box key={s} size={[0.45, FLOOR, 0.3]} position={[s * (width / 2 - 0.22), FLOOR / 2, f + 0.12]} color={pillars} />
      ))}
      {Array.from({ length: floors - 1 }, (_, i) => (
        <UpperFloor key={i} y={(i + 1) * FLOOR} width={width} z={f} trimColor={trimColor} wallColor={wallColor}
          balcony={balcony} hasAircon={i === 0} />
      ))}
      <Roof type={roof} width={width} depth={depth} height={height} trimColor={trimColor} roofColor={roofColor}
        wallColor={wallColor} gable={gable} />
      {annex && <Annex {...annex} width={width} depth={depth} y={height} />}
      {stairs && <Stairs height={stairs} width={width} z={f} railing={railing} />}
      {pergola && <Pergola color={pergola} width={width} z={f} />}
      {eave && <Eave {...eave} width={width} z={f} y={height} />}
      {billboard && <BillboardFrame width={width} z={f} y={height} />}
      {awningStyle && <Awning {...awningStyle} width={width} z={f} />}
      {ac && (
        <group position={[width / 2 - 1.2, 2.3, f + 0.25]}>
          <Box size={[0.85, 0.6, 0.35]} color="#efefef" />
          <mesh position={[-0.12, 0, 0.18]}>
            <circleGeometry args={[0.2, 16]} />
            <meshStandardMaterial color="#9a9a9a" />
          </mesh>
        </group>
      )}
      {sign && <WallSign {...sign} z={f} buildingWidth={width} floors={floors} />}
    </group>
  )
}

function Box({ size, position, color, rotation, ...material }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} {...material} />
    </mesh>
  )
}

// Ground floor: shutter, glass, gate, open sari-sari store, painted stripes, or plain wall
function Storefront({ type, width, z, lift }) {
  if (type === 'none' || type === 'plain') return null
  const w = Math.min(width - 1, width * 0.8)
  const h = 2.5 - lift * 0.5
  const y = lift + h / 2
  if (type === 'glass') {
    return (
      <group position={[0, y, z + 0.02]}>
        <mesh>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#26323a" roughness={0.15} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.08, h]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>
    )
  }
  if (type === 'stripes') {
    return (
      <mesh position={[0, FLOOR / 2, z + 0.02]}>
        <planeGeometry args={[width, FLOOR]} />
        <meshStandardMaterial map={stripesTexture([1, FLOOR * 2])} transparent />
      </mesh>
    )
  }
  const map =
    type === 'gate' ? gateTexture([Math.round(w / 1.2), 1])
    : type === 'store' ? storeTexture([Math.max(1, Math.round(w / 2)), 1])
    : shutterTexture([1, 4])
  return (
    <mesh receiveShadow position={[0, y, z + 0.02]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={map} />
    </mesh>
  )
}

function UpperFloor({ y, width, z, trimColor, wallColor, balcony, hasAircon }) {
  const count = Math.max(1, Math.floor(width / 3))
  const spacing = width / count
  return (
    <group>
      {/* Line between floors */}
      <Box size={[width + 0.1, 0.2, 0.2]} position={[0, y, z + 0.05]} color={trimColor} />
      {Array.from({ length: count }, (_, i) => (
        <group key={i} position={[-width / 2 + spacing * (i + 0.5), y + 1.5, z]}>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[1.5, 1.5]} />
            <meshStandardMaterial color={trimColor} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial color="#34444f" roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial map={gateTexture()} transparent opacity={0.75} />
          </mesh>
          {hasAircon && i === count - 1 && (
            <Box size={[0.8, 0.5, 0.45]} position={[0.4, -1.05, 0.25]} color="#ececec" />
          )}
        </group>
      ))}
      {balcony && (
        <group position={[0, y, z]}>
          <Box size={[width - 0.4, 0.18, 1.2]} position={[0, 0.05, 0.6]} color={wallColor} />
          {balcony === 'wrap' && (
            // Rounded corner, like the white building in photo 2
            <mesh castShadow receiveShadow position={[width / 2 - 0.2, 0.05, 0.6]}>
              <cylinderGeometry args={[0.6, 0.6, 0.18, 20]} />
              <meshStandardMaterial color={wallColor} />
            </mesh>
          )}
          <Box size={[width - 0.4, 0.05, 0.05]} position={[0, 1.0, 1.15]} color="#2f2f2f" />
          {Array.from({ length: Math.ceil(width / 0.6) }, (_, i) => (
            <Box key={i} size={[0.03, 0.9, 0.03]} position={[-width / 2 + 0.3 + i * 0.6, 0.55, 1.15]} color="#2f2f2f" />
          ))}
        </group>
      )}
    </group>
  )
}

function Roof({ type, width, depth, height, trimColor, roofColor, wallColor, gable }) {
  if (type === 'hip') {
    // Pointed tile roof, like the yellow-green house
    return (
      <group>
        <Box size={[width + 1, 0.22, depth + 1]} position={[0, height + 0.11, 0]} color={trimColor} />
        <group position={[0, height + 0.22, 0]} scale={[(width + 0.9) / Math.SQRT2, 2, (depth + 0.9) / Math.SQRT2]}>
          <mesh castShadow position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1, 1, 4]} />
            <meshStandardMaterial color={roofColor} flatShading />
          </mesh>
        </group>
        {gable && <Gable width={width} depth={depth} y={height + 0.22} wallColor={wallColor} roofColor={roofColor} trimColor={trimColor} />}
      </group>
    )
  }
  if (type === 'tin') {
    // Rusty tin roof that sticks out over the sidewalk, held up by two poles
    const tilt = 0.1
    const length = depth + 2.4
    const frontEdgeY = height + 0.25 - Math.sin(tilt) * (length / 2)
    return (
      <group>
        <mesh castShadow receiveShadow position={[0, height + 0.25, 1.0]} rotation={[tilt, 0, 0]}>
          <boxGeometry args={[width + 0.3, 0.05, length]} />
          <meshStandardMaterial map={tinTexture([Math.round(width / 1.2), 1])} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} castShadow position={[s * (width / 2 - 0.2), frontEdgeY / 2, depth / 2 + 2.0]}>
            <cylinderGeometry args={[0.05, 0.05, frontEdgeY, 6]} />
            <meshStandardMaterial color="#6b5a45" />
          </mesh>
        ))}
      </group>
    )
  }
  // Flat concrete roof with a low wall around the edge
  return <Box size={[width + 0.1, 0.5, depth + 0.1]} position={[0, height + 0.25, 0]} color={trimColor} />
}

// Triangle roof part sticking out at the front, with a round vent
function Gable({ width, depth, y, wallColor, roofColor, trimColor }) {
  const w = Math.min(5, width * 0.4)
  const h = 1.9
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-w / 2, 0)
    shape.lineTo(w / 2, 0)
    shape.lineTo(0, h)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: false })
  }, [w])
  const x = -width / 2 + w / 2 + 0.6
  return (
    <group position={[x, y, depth / 2 - 1.6]}>
      <mesh castShadow geometry={geometry}>
        <meshStandardMaterial attach="material-0" color={wallColor} />
        <meshStandardMaterial attach="material-1" color={roofColor} flatShading />
      </mesh>
      <mesh position={[0, h * 0.4, 2.21]}>
        <circleGeometry args={[0.22, 16]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
    </group>
  )
}

// Extra floor on top, set back from the front
function Annex({ floors = 1, color = '#eeeeee', setback = 3, width, depth, y }) {
  const h = floors * FLOOR
  const d = depth - setback
  const windows = Math.max(1, Math.floor(width / 3))
  return (
    <group position={[0, y, -setback / 2]}>
      <Box size={[width - 0.6, h, d]} position={[0, h / 2, 0]} color={color} />
      {Array.from({ length: windows }, (_, i) => (
        <mesh key={i} position={[-width / 2 + (width / windows) * (i + 0.5), h / 2 + 0.2, d / 2 + 0.01]}>
          <planeGeometry args={[1.6, 1.0]} />
          <meshStandardMaterial map={gateTexture()} />
        </mesh>
      ))}
    </group>
  )
}

// Raised front step with stairs (and maybe a black railing)
function Stairs({ height, width, z, railing }) {
  const steps = Math.max(1, Math.round(height / 0.18))
  return (
    <group>
      <Box size={[width, height, 0.9]} position={[0, height / 2, z + 0.45]} color="#d8d2c6" />
      {Array.from({ length: steps }, (_, i) => {
        const top = (height * (steps - i)) / (steps + 1)
        return (
          <Box key={i} size={[Math.min(2.5, width * 0.5), top, 0.3]} position={[width * 0.2, top / 2, z + 1.05 + i * 0.3]} color="#e5e0d6" />
        )
      })}
      {railing && (
        <group position={[-width * 0.15, height, z + 0.85]}>
          <Box size={[width * 0.65, 0.05, 0.05]} position={[0, 0.9, 0]} color="#1c1c1c" />
          {Array.from({ length: Math.ceil((width * 0.65) / 0.25) }, (_, i) => (
            <Box key={i} size={[0.03, 0.9, 0.03]} position={[-width * 0.325 + i * 0.25, 0.45, 0]} color="#1c1c1c" />
          ))}
        </group>
      )}
    </group>
  )
}

// Black steel canopy frame in front (like the café)
function Pergola({ color, width, z }) {
  return (
    <group>
      {[-1, 1].map((s) => (
        <Box key={s} size={[0.1, FLOOR, 0.1]} position={[s * (width / 2 - 0.1), FLOOR / 2, z + 1.6]} color={color} />
      ))}
      <Box size={[width, 0.14, 0.14]} position={[0, FLOOR, z + 1.6]} color={color} />
      <Box size={[width, 0.05, 1.7]} position={[0, FLOOR + 0.1, z + 0.85]} color={color} />
    </group>
  )
}

// Thick dark roof edge that sticks out over the sidewalk (like KALIDAD)
function Eave({ color = '#2b2c30', depth = 1.8, width, z, y }) {
  return (
    <group>
      <Box size={[width + 0.3, 0.45, depth + 0.3]} position={[0, y - 0.05, z + depth / 2 - 0.15]} color={color} />
      <mesh castShadow position={[0, y - 0.2, z + depth]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, width + 0.3, 10]} />
        <meshStandardMaterial color="#1e1f22" />
      </mesh>
      <mesh position={[0, y - 0.32, z + depth / 2]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff6d0" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

// Empty steel frame for a billboard on the roof
function BillboardFrame({ width, z, y }) {
  const h = 4
  const w = width * 0.7
  const bars = []
  for (let i = 0; i <= 4; i++) bars.push(<Box key={`h${i}`} size={[w, 0.06, 0.06]} position={[0, (i * h) / 4, 0]} color="#2a2a2a" />)
  for (let i = 0; i <= 6; i++) bars.push(<Box key={`v${i}`} size={[0.06, h, 0.06]} position={[-w / 2 + (i * w) / 6, h / 2, 0]} color="#2a2a2a" />)
  for (let i = 0; i < 6; i++) {
    const len = Math.hypot(w / 6, h / 4)
    for (let j = 0; j < 4; j++) {
      bars.push(
        <Box key={`d${i}-${j}`} size={[0.03, len, 0.03]}
          position={[-w / 2 + (i + 0.5) * (w / 6), (j + 0.5) * (h / 4), 0]}
          rotation={[0, 0, ((i + j) % 2 ? 1 : -1) * Math.atan2(w / 6, h / 4)]} color="#2a2a2a" />
      )
    }
  }
  return <group position={[0, y + 0.4, z - 1.2]}>{bars}</group>
}

// Small roof over the door: flat, or rounded ("barrel") like the yellow-green house
function Awning({ color, style = 'flat', width, z }) {
  if (style === 'barrel') {
    return (
      <mesh castShadow position={[0, 2.75, z + 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.75, 0.75, width * 0.9, 18, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    )
  }
  return <Box size={[width * 0.9, 0.06, 1.5]} position={[0, 2.85, z + 0.7]} rotation={[0.3, 0, 0]} color={color} />
}

function WallSign({ text, bg, fg, width, height = 0.6, y, z, buildingWidth, floors }) {
  const w = width ?? Math.min(buildingWidth * 0.7, 4)
  const signY = y ?? (floors === 1 ? 2.75 : 3.45)
  return (
    <mesh position={[0, signY, z + 0.08]}>
      <planeGeometry args={[w, height]} />
      <meshStandardMaterial map={signTexture({ text, bg, fg }, w, height)} />
    </mesh>
  )
}
