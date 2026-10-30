import * as THREE from 'three'

// Street measurements (in meters). The road runs along the Z axis.
export const ROAD_HALF_WIDTH = 4.2 // road is 8.4 m wide
export const LANE_X = 1.4 // middle of each driving lane (right lane = +x)
export const PARK_X = 3.3 // where parked cars sit, next to the curb
export const BUILDING_LINE = 6.5 // building fronts start this far from the middle of the road
export const STREET_START = -85 // the street goes from z = -85 (past TNLF, where the buildings end)...
export const STREET_END = 135 // ...to z = 135 (past KALIDAD)

// Where the player is right now. Player.jsx updates it every frame,
// so the sun and the traffic can react to the player.
export const playerPos = new THREE.Vector3(0, 0, 0)

// Random numbers that come out the same every time (so trees don't change shape on reload)
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Seconds since the page loaded (used for timing swings)
export const now = () => performance.now() / 1000

// Turn smoothly from angle a to b the short way around
export function lerpAngle(a, b, t) {
  const diff = ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI
  return a + diff * t
}

// ---------- People ----------
// Things the player and Edson share with the pickleball game
export const playerState = { swingUntil: 0, teleport: null, jumpRequest: false, diveRequest: false, sitRequest: false, diving: false,
  // sent to the other players in multiplayer (skate: 1 while on a skateboard):
  facing: Math.PI, moving: false, sit: 0, dive: 0, skate: 0,
  hitRequest: false, viewRequest: false }

// The on-screen joystick for phones: x = left/right, y = forward/back (-1 to 1)
export const touchInput = { x: 0, y: 0, active: false }
export const npcPos = new THREE.Vector3(5.2, 0, -22) // same as NPC_HOME in dialogue.js
export const npcState = { swingUntil: 0, facing: Math.PI, moving: false }
// Whoever you're close to or talking to (Edson, Andrew, Aling Nena...): the player turns to face them
export const talkTarget = new THREE.Vector3()

// ---------- Pickleball court (painted on the road during a game) ----------
export { COURT } from './court.js'
