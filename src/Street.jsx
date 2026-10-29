import { memo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import StaticBatch from './StaticBatch.jsx'
import NewLifeFellowship from './NewLifeFellowship.jsx'
import NearTNLF from './NearTNLF.jsx'
import AcrossTNLF from './AcrossTNLF.jsx'
import Building from './Building.jsx'
import { Tree, PowerLines, StreetLamp, Sign, PottedPlant, Planter, PipeFrame, Bucket } from './Props.jsx'
import { ParkedVehicle, Traffic } from './Vehicles.jsx'
import { ROAD_HALF_WIDTH, BUILDING_LINE, STREET_START, STREET_END } from './world.js'
import { asphaltTexture, concreteTexture, dashTexture } from './textures.js'
import {
  buildings, trees, powerLines, streetLamps, signs, pottedPlants, planters, pipeFrames, buckets, parkedVehicles, traffic, newLifeFellowship,
} from './houses.js'

const LENGTH = STREET_END - STREET_START + 10
const MID = (STREET_START + STREET_END) / 2 // the middle of the street
const SIDEWALK_WIDTH = BUILDING_LINE - ROAD_HALF_WIDTH

function Road() {
  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, MID]}>
        <planeGeometry args={[ROAD_HALF_WIDTH * 2, LENGTH]} />
        <meshStandardMaterial map={asphaltTexture([2, Math.round(LENGTH / 4)])} roughness={0.9} />
      </mesh>
      {/* White lines on both edges */}
      {[-1, 1].map((s) => (
        <mesh key={s} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[s * (ROAD_HALF_WIDTH - 0.3), 0.04, MID]}>
          <planeGeometry args={[0.13, LENGTH]} />
          <meshStandardMaterial color="#eeeeee" />
        </mesh>
      ))}
      {/* Dashed line in the middle */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, MID]}>
        <planeGeometry args={[0.13, LENGTH]} />
        <meshStandardMaterial map={dashTexture([1, Math.round(LENGTH / 4)])} transparent alphaTest={0.5} />
      </mesh>
    </>
  )
}

function Sidewalks() {
  return [-1, 1].map((s) => (
    <group key={s}>
      {/* Sidewalks are slightly raised; the player can step up onto them */}
      <RigidBody type="fixed" colliders={false} position={[s * (ROAD_HALF_WIDTH + SIDEWALK_WIDTH / 2), 0.05, MID]}>
        <CuboidCollider args={[SIDEWALK_WIDTH / 2, 0.05, LENGTH / 2]} />
      </RigidBody>
      <mesh receiveShadow position={[s * (ROAD_HALF_WIDTH + SIDEWALK_WIDTH / 2), 0.05, MID]}>
        <boxGeometry args={[SIDEWALK_WIDTH, 0.1, LENGTH]} />
        <meshStandardMaterial map={concreteTexture([1, Math.round(LENGTH / SIDEWALK_WIDTH)])} />
      </mesh>
      {/* Curb */}
      <mesh receiveShadow position={[s * (ROAD_HALF_WIDTH + 0.08), 0.07, MID]}>
        <boxGeometry args={[0.16, 0.14, LENGTH]} />
        <meshStandardMaterial color="#d3cec5" />
      </mesh>
    </group>
  ))
}

// Invisible walls so the player can't leave the street
function Boundaries() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[0.5, 5, LENGTH / 2]} position={[-20, 5, MID]} />
      <CuboidCollider args={[0.5, 5, LENGTH / 2]} position={[20, 5, MID]} />
      <CuboidCollider args={[20, 5, 0.5]} position={[0, 5, STREET_START - 1]} />
      <CuboidCollider args={[20, 5, 0.5]} position={[0, 5, STREET_END + 1]} />
    </RigidBody>
  )
}

// memo: only redraw the street when houses.js changes, not on every game event
export default memo(function Street() {
  return (
    <>
      <StaticBatch>
        {/* Ground */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh receiveShadow position={[0, -0.5, 0]}>
            <boxGeometry args={[80, 1, LENGTH + 40]} />
            <meshStandardMaterial color="#8f8a7e" />
          </mesh>
        </RigidBody>

        <Road />
        <Sidewalks />
        <Boundaries />

        {buildings.map((b, i) => <Building key={i} {...b} />)}
        <NewLifeFellowship {...newLifeFellowship} />
        <NearTNLF />
        <AcrossTNLF />
        {trees.map((t, i) => <Tree key={i} seed={i + 1} {...t} />)}
        <PowerLines lines={powerLines} />
        {streetLamps.map((l, i) => <StreetLamp key={i} {...l} />)}
        {signs.map((s, i) => <Sign key={i} {...s} />)}
        {pottedPlants.map((p, i) => <PottedPlant key={i} seed={i + 1} {...p} />)}
        {planters.map((p, i) => <Planter key={i} {...p} />)}
        {pipeFrames.map((p, i) => <PipeFrame key={i} {...p} />)}
        {buckets.map((b, i) => <Bucket key={i} {...b} />)}
        {parkedVehicles.map((v, i) => <ParkedVehicle key={i} {...v} />)}
      </StaticBatch>
      {/* Moving things stay outside the StaticBatch */}
      <Traffic cars={traffic} />
    </>
  )
})
