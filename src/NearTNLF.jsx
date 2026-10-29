import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { BUILDING_LINE } from './world.js'
import { ParkedVehicle } from './Vehicles.jsx'
import {
  patchworkTexture, graffitiTexture, louverTexture, egbSignTexture, courtWallTexture,
  storeTexture, shutterTexture, tinTexture, signTexture,
} from './textures.js'

// The LEFT side of the street, going up from Taytay New Life Fellowship (built from Street View):
//   z -14 to 6   row of shops under one dark roof: EGB, CMG, Himpilan, the purple AE shop,
//                with the big rusty warehouse wall behind
//   z 6 to 16    grey badminton court building with Margie 2 Sari-Sari Store in front
//   z 16 to 30   open concrete lot in front of the black COURT wall (Home of Team ABR)
//   z 30 to 40   white modern house with wood louvers and a navy blue fence
// Everything here is in world coordinates. Building fronts are at x = -6.5 and face +x (the road).

const X = -BUILDING_LINE

// A box from (x0, y0, z0) to (x1, y1, z1)
function Block({ x, y, z, color = '#ffffff', map, ...material }) {
  return (
    <mesh castShadow receiveShadow position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]}>
      <boxGeometry args={[Math.abs(x[1] - x[0]), Math.abs(y[1] - y[0]), Math.abs(z[1] - z[0])]} />
      <meshStandardMaterial color={color} map={map} {...material} />
    </mesh>
  )
}

// A flat picture facing the road (+x), from z0 to z1 and y0 to y1
function Front({ x = X, z, y, out = 0.01, color = '#ffffff', map, ...material }) {
  return (
    <mesh receiveShadow position={[x + out, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[Math.abs(z[1] - z[0]), Math.abs(y[1] - y[0])]} />
      <meshStandardMaterial color={color} map={map} side={THREE.DoubleSide} {...material} />
    </mesh>
  )
}

// Solid parts (so you can't walk through): [x0, x1, y0, y1, z0, z1]
const SOLID = [
  [-6.7, -10.5, 0, 3.3, -14.5, -13.8], // white wall end next to TNLF
  [X, -10.5, 0, 3.2, -13.8, 6], // shop row
  [-10.5, -21, 0, 8.5, -13.8, 6], // rusty warehouse
  [X, -20, 0, 6, 6, 16], // badminton court building
  [X, -5.3, 0, 2.3, 9, 13.5], // Margie 2 kiosk
  [-13.5, -24, 0, 7, 16, 30], // black COURT wall and the building behind it
  [X, -14.5, 0, 6.4, 30, 40], // white house
  [-5.2, X, 3.2, 3.45, -13.8, 6], // roof over the shop sidewalk (keeps the camera under it)
]

export default function NearTNLF() {
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {SOLID.map(([x0, x1, y0, y1, z0, z1], i) => (
          <CuboidCollider key={i} args={[Math.abs(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2]}
            position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]} />
        ))}
      </RigidBody>
      <ShopRow />
      <CourtBuilding />
      <CourtLot />
      <WhiteHouse />
    </>
  )
}

// ---------- Row of shops with the rusty warehouse behind ----------
function ShopRow() {
  return (
    <>
      <Block x={[-6.7, -10.5]} y={[0, 3.3]} z={[-14.5, -13.8]} color="#f0efeb" />
      <Block x={[X, -10.5]} y={[0, 3.2]} z={[-13.8, 6]} color="#2a2729" />
      {/* Big warehouse made of old rusty sheets */}
      <Block x={[-10.5, -21]} y={[0, 8.5]} z={[-13.8, 6]} color="#8d8478" />
      <Front x={-10.5} z={[-13.8, 6]} y={[3.2, 8.5]} map={patchworkTexture([3, 1])} />
      <Block x={[-10.3, -21.2]} y={[8.5, 8.75]} z={[-14, 6.2]} color="#6e5444" />
      {/* Long dark roof over the sidewalk, with a gutter */}
      <Block x={[-5.2, -10.5]} y={[3.2, 3.4]} z={[-13.8, 6]} color="#3e2a20" />
      <Block x={[-5.15, -5.3]} y={[2.95, 3.45]} z={[-13.8, 6]} color="#4a3226" />
      <mesh position={[-5.1, 3.0, -3.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 19.8, 8]} />
        <meshStandardMaterial color="#3a2a22" />
      </mesh>
      {/* Steel truss with an old sign board on the roof, between two concrete posts */}
      {[-1.4, 4.0].map((z) => (
        <Block key={z} x={[-7.6, -8.0]} y={[3.2, 6]} z={[z - 0.2, z + 0.2]} color="#8a8780" />
      ))}
      <Block x={[-7.7, -7.9]} y={[5.5, 5.6]} z={[-1.2, 3.8]} color="#2d2d2d" />
      <Front x={-7.8} z={[-0.6, 3.2]} y={[4.0, 5.3]} out={0.1}
        map={signTexture({ text: 'MOTOR PARTS\n& ACCESSORIES', bg: '#e6e1d4', fg: '#7a7a72' }, 3.8, 1.3)} />

      {/* EGB Safety Engine Lube: glass shop full of red oil cartons */}
      <Front z={[-13.6, -8.0]} y={[2.45, 3.05]} out={0.06} map={egbSignTexture()} />
      <Front z={[-13.5, -8.2]} y={[0, 2.35]} color="#1d2226" />
      {[-12.9, -12.3, -11.7, -11.1].map((z, i) =>
        [0.2, 0.6, 1.0].slice(0, 3 - (i % 2)).map((y) => (
          <Block key={`${z}-${y}`} x={[-6.1, -6.5]} y={[y - 0.2, y + 0.18]} z={[z - 0.27, z + 0.27]}
            color={(i + y * 10) % 2 ? '#b03a2e' : '#c94a3a'} />
        ))
      )}
      <Front x={-5.98} z={[-13.5, -8.2]} y={[0, 2.35]} color="#a9c2cf" transparent opacity={0.18} />
      {[-13.5, -11.0, -8.2].map((z) => (
        <Block key={z} x={[-5.95, -6.05]} y={[0, 2.35]} z={[z - 0.04, z + 0.04]} color="#111" />
      ))}
      <mesh castShadow position={[-5.75, 2.9, -7.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.14, 24]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <Vine position={[-6.1, 0, -13.9]} />

      {/* CMG: wooden door, glass panel with posters, aircons */}
      <Front z={[-7.4, -6.2]} y={[0, 2.3]} map={louverTexture([2, 2])} />
      <Front z={[-6.1, -5.0]} y={[0, 2.3]} color="#3a4a55" />
      <Front z={[-7.5, -6.4]} y={[2.45, 2.9]} out={0.03}
        map={signTexture({ text: 'CMG', bg: '#1b1b1b', fg: '#ffffff' }, 1.1, 0.45)} />
      <Front z={[-6.3, -4.5]} y={[2.45, 2.9]} out={0.03}
        map={signTexture({ text: 'PARTS & SERVICE', bg: '#f2f2f2', fg: '#1b1b1b' }, 1.8, 0.45)} />
      <Block x={[-6.15, -6.5]} y={[2.0, 2.45]} z={[-5.6, -5.0]} color="#ececec" />
      <Block x={[-6.15, -6.5]} y={[1.6, 2.2]} z={[-4.9, -4.1]} color="#f2f2f2" />
      <Front x={-6.15} z={[-4.75, -4.25]} y={[1.65, 2.15]} out={0.005} color="#8a8a8a" />
      <Flag position={[-5.4, 0.1, -3.2]} />
      <ParkedVehicle type="motorbike" position={[-5.3, 0.1, -1.6]} rotation={0.25} color="#222222" />

      {/* Himpilan: red and white sign, wire-mesh front, bicycle */}
      <Front z={[-3.8, 1.8]} y={[2.45, 2.95]} out={0.04}
        map={signTexture({ text: 'VUMERZ  HIMPILAN NG PERSONAL', bg: '#f3eee6', fg: '#c62828' }, 5.6, 0.5)} />
      <Front z={[-3.6, 1.6]} y={[0, 2.4]} map={storeTexture([2, 1])} />
      <Bicycle position={[-5.9, 0.1, -0.6]} />

      {/* Purple shop with white graffiti and the round AE sign */}
      <Front z={[2.0, 6.0]} y={[0, 3.0]} map={graffitiTexture('#2d2838', 2)} />
      <Front z={[4.3, 5.9]} y={[0, 2.3]} out={0.02} map={shutterTexture([1, 3])} color="#6a6670" />
      <mesh position={[X + 0.03, 1.6, 3.1]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.62, 28]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[X + 0.04, 1.6, 3.1]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.55, 28]} />
        <meshStandardMaterial map={signTexture({ text: 'AE', bg: '#ffffff', fg: '#222222' }, 1.1, 1.1)} />
      </mesh>
      <Block x={[-6.1, -6.5]} y={[2.3, 2.75]} z={[4.6, 5.2]} color="#ececec" />
      <mesh position={[-6.42, 1.6, 2.05]}>
        <cylinderGeometry args={[0.05, 0.05, 3.2, 8]} />
        <meshStandardMaterial color="#9a9a9a" />
      </mesh>
      <ABoard position={[-5.0, 0.1, 5.2]} />
    </>
  )
}

// ---------- Grey badminton court building with Margie 2 Sari-Sari Store ----------
function CourtBuilding() {
  const gable = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-5, 0)
    shape.lineTo(5, 0)
    shape.lineTo(0, 2.2)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 13.5, bevelEnabled: false })
  }, [])
  const edge = Math.hypot(5, 2.2)
  const slope = Math.atan2(2.2, 5)
  return (
    <>
      <Block x={[X, -20]} y={[0, 6]} z={[6, 16]} color="#a9a79f" />
      {/* Triangle roof front with green trim */}
      <mesh castShadow geometry={gable} position={[-20, 6, 11]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial attach="material-0" color="#a9a79f" />
        <meshStandardMaterial attach="material-1" color="#6f8a74" />
      </mesh>
      <Block x={[-6.4, -6.6]} y={[5.92, 6.08]} z={[6, 16]} color="#3f8f5a" />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-6.45, 7.1, 11 - s * 2.5]} rotation={[s * slope, 0, 0]}>
          <boxGeometry args={[0.15, 0.15, edge]} />
          <meshStandardMaterial color="#3f8f5a" />
        </mesh>
      ))}
      {/* Red ball roof vent */}
      <mesh castShadow position={[-12, 8.4, 11]}>
        <sphereGeometry args={[0.35, 14, 10]} />
        <meshStandardMaterial color="#b23a2a" />
      </mesh>
      {/* Badminton court board in a green frame */}
      <Block x={[-6.45, -6.55]} y={[3.95, 5.45]} z={[13.2, 15.4]} color="#3f8f5a" />
      <Front x={-6.45} z={[13.3, 15.3]} y={[4.05, 5.35]}
        map={signTexture({ text: 'BADMINTON COURT\n#52 E. RODRIGUEZ AVE.\nCOURT HOURS: 6:00 AM', bg: '#d8cfae', fg: '#3a3a2a' }, 2.0, 1.3)} />

      {/* Margie 2 Sari-Sari Store: small green kiosk with a white awning */}
      <Block x={[X, -5.3]} y={[0, 2.3]} z={[9, 13.5]} color="#3c8d5a" />
      <Front x={-5.3} z={[9.3, 13.2]} y={[0.95, 2.2]} map={storeTexture([2, 1])} />
      <Front x={-5.3} z={[10.4, 12.6]} y={[0.1, 0.9]}
        map={signTexture({ text: 'CASH IN\nGCash', bg: '#1e6fd9', fg: '#ffffff' }, 2.2, 0.8)} />
      <Block x={[X, -5.2]} y={[2.3, 2.42]} z={[8.9, 13.6]} color="#4a9a6a" />
      <mesh castShadow position={[-4.85, 2.25, 11.25]} rotation={[0, 0, -0.25]}>
        <boxGeometry args={[1.0, 0.05, 4.9]} />
        <meshStandardMaterial color="#efefe8" />
      </mesh>
      <Block x={[-5.65, -5.7]} y={[2.4, 2.8]} z={[10.85, 10.95]} color="#555" />
      <Front x={-5.68} z={[9.9, 11.9]} y={[2.75, 3.65]}
        map={signTexture({ text: 'Margie 2\nSari-Sari Store', bg: '#ffffff', fg: '#1565c0' }, 2.0, 0.9)} />
    </>
  )
}

// ---------- Open lot in front of the black COURT wall ----------
function CourtLot() {
  return (
    <>
      <mesh receiveShadow position={[-10, 0.1, 23]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 14]} />
        <meshStandardMaterial color="#b3ada2" />
      </mesh>
      <Block x={[-13.5, -14.1]} y={[0, 3.4]} z={[16, 30]} color="#151515" />
      <Front x={-13.5} z={[16.2, 29.8]} y={[0, 3.3]} map={courtWallTexture()} />
      <Front x={-13.5} z={[28.6, 29.6]} y={[0, 2.1]} out={0.02} color="#c2185b" />
      {/* Rusty red tin awning on top of the wall */}
      <mesh castShadow position={[-12.9, 3.45, 23]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[1.3, 0.05, 14]} />
        <meshStandardMaterial map={tinTexture([1, 10])} color="#d27a5a" />
      </mesh>
      {/* The building behind, where the courts are */}
      <Block x={[-14.1, -24]} y={[0, 7]} z={[16, 30]} color="#b4b1a8" />
    </>
  )
}

// ---------- White modern house with wood louvers and a navy fence ----------
function WhiteHouse() {
  return (
    <>
      <Block x={[X, -14.5]} y={[0, 6.4]} z={[30, 40]} color="#f2f2ef" />
      <Front z={[30, 40]} y={[0, 2.6]} map={louverTexture([12, 3])} color="#3a4a7a" />
      <Block x={[-6.25, -6.5]} y={[2.9, 3.3]} z={[30, 40]} color="#c9a77c" />
      <Block x={[-6.1, -6.5]} y={[3.4, 6.2]} z={[34, 39.6]} color="#4a3a2e" />
      <Front x={-6.1} z={[34, 39.6]} y={[3.4, 6.2]} map={louverTexture([7, 3])} />
      <Front z={[31, 32.6]} y={[4.0, 5.2]} color="#2c3640" />
      <Block x={[-6.4, -14.6]} y={[6.4, 6.8]} z={[29.9, 40.1]} color="#e2e2de" />
    </>
  )
}

// ---------- Small things on the sidewalk ----------
function Vine({ position }) {
  const leaves = [[0, 0.6, 0.2], [0.2, 1.2, -0.1], [-0.1, 1.8, 0.3], [0.1, 2.4, 0], [0.3, 0.9, 0.6], [0, 2.9, 0.4]]
  return (
    <group position={position}>
      {leaves.map((p, i) => (
        <mesh key={i} castShadow position={p}>
          <icosahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color={i % 2 ? '#5d9a3c' : '#6fae45'} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// Yellow-green feather banner flag
function Flag({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2.8, 6]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
      <mesh castShadow position={[0.05, 1.6, 0.3]} rotation={[0, Math.PI / 2, 0.06]}>
        <planeGeometry args={[0.6, 2.1]} />
        <meshStandardMaterial color="#b5c43a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Bicycle({ position }) {
  return (
    <group position={position}>
      {[-0.5, 0.5].map((z) => (
        <mesh key={z} castShadow position={[0, 0.33, z]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.32, 0.025, 6, 20]} />
          <meshStandardMaterial color="#1b1b1b" />
        </mesh>
      ))}
      <Block x={[-0.02, 0.02]} y={[0.55, 0.6]} z={[-0.5, 0.45]} color="#6fa8dc" />
      <Block x={[-0.02, 0.02]} y={[0.33, 0.85]} z={[-0.12, -0.08]} color="#6fa8dc" />
      <Block x={[-0.25, 0.25]} y={[0.92, 0.95]} z={[0.4, 0.44]} color="#333" />
    </group>
  )
}

// Folding A-frame sign board on the sidewalk
function ABoard({ position }) {
  return (
    <group position={position}>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * 0.12, 0.45, 0]} rotation={[0, 0, s * 0.25]}>
          <boxGeometry args={[0.03, 0.9, 0.55]} />
          <meshStandardMaterial color="#f2efe6" />
        </mesh>
      ))}
    </group>
  )
}
