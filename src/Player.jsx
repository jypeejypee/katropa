import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { playerPos, playerState, npcPos, now, lerpAngle, touchInput } from './world.js'
import { getGame, useGame } from './game.js'
import { isTyping } from './network.js'
import { Person, animatePerson, SIT_DROP } from './Person.jsx'
import SpeechBubble from './SpeechBubble.jsx'

const WALK_SPEED = 3
const RUN_SPEED = 7
const CAMERA_DISTANCE = 6
const EYE_HEIGHT = 0.75 // above the middle of the body (about 1.65 m from the ground)
const SWING_TIME = 0.35
const JUMP_SPEED = 5 // how hard you jump (about 1.3 m high)
const DIVE_SPEED = 8.5
const DIVE_FLY = 0.35 // seconds flying through the air
const DIVE_TOTAL = 1.3 // seconds until you're back on your feet

// Reused objects so we don't create new ones every frame
const up = new THREE.Vector3(0, 1, 0)
const direction = new THREE.Vector3()
const lookTarget = new THREE.Vector3()
const cameraGoal = new THREE.Vector3()
const offset = new THREE.Vector3()

export default function Player() {
  const body = useRef()
  const model = useRef()
  const paddle = useRef()
  const tilt = useRef()
  const limbs = useRef({ legs: [], arms: [] })
  const dive = useRef({ start: -10, dir: new THREE.Vector3() })
  const sit = useRef({ on: false, amount: 0 }) // amount: 0 = standing, 1 = sitting
  const [, getKeys] = useKeyboardControls()
  const { gl } = useThree()
  const { world, rapier } = useRapier()
  const { avatar, bubbles } = useGame()
  const groundRay = useRef(null)
  if (!groundRay.current) groundRay.current = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 })
  // yaw = which way the camera faces, pitch = how much it looks down
  const view = useRef({ yaw: 0, pitch: 0.25, firstPerson: false })

  // Drag the mouse (or a finger) to look around, press V to switch camera
  useEffect(() => {
    const el = gl.domElement
    el.style.touchAction = 'none'
    // Only one finger (or the mouse) looks around at a time; the other thumb can use the joystick
    let lookId = null
    let lastX = 0
    let lastY = 0
    const onDown = (e) => {
      if (lookId !== null) return
      lookId = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const onUp = (e) => {
      if (e.pointerId === lookId) lookId = null
    }
    const onMove = (e) => {
      if (e.pointerId !== lookId) return
      const speed = e.pointerType === 'touch' ? 1.4 : 1
      const v = view.current
      v.yaw -= (e.clientX - lastX) * 0.005 * speed
      v.pitch += (e.clientY - lastY) * 0.004 * speed
      lastX = e.clientX
      lastY = e.clientY
      v.pitch = v.firstPerson
        ? THREE.MathUtils.clamp(v.pitch, -1.2, 1.2)
        : THREE.MathUtils.clamp(v.pitch, 0.05, 1.2)
    }
    const onKey = (e) => {
      if (isTyping(e)) return
      // J = jump, K = dive. Space also jumps while walking (in pickleball Space is for hitting)
      if (e.code === 'KeyJ' || (e.code === 'Space' && getGame().mode === 'walk')) {
        e.preventDefault()
        playerState.jumpRequest = true
      }
      if (e.code === 'KeyK') playerState.diveRequest = true
      if (e.code === 'KeyC') playerState.sitRequest = true
      if (e.code !== 'KeyV') return
      const v = view.current
      v.firstPerson = !v.firstPerson
      v.pitch = v.firstPerson ? 0 : 0.25
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointermove', onMove)
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointermove', onMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [gl])

  useFrame((state, delta) => {
    if (!body.current) return
    const v = view.current
    const { mode } = getGame()

    // The pickleball game can move the player onto the court
    if (playerState.teleport) {
      const [x, y, z, yaw = 0] = playerState.teleport
      body.current.setTranslation({ x, y, z }, true)
      body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      v.yaw = yaw // which way to face: 0 = toward the far end of the street
      v.pitch = 0.3
      v.firstPerson = false
      model.current.rotation.y = Math.PI + yaw
      playerState.teleport = null
    }

    const t = now()
    const pos = body.current.translation()
    const velocity = body.current.linvel()
    let upSpeed = velocity.y // keep current up/down speed so gravity still works

    // Standing on something? (short ray straight down from the feet)
    groundRay.current.origin = { x: pos.x, y: pos.y - 0.85, z: pos.z }
    const grounded = !!world.castRay(groundRay.current, 0.2, true, undefined, undefined, undefined, body.current)

    // Phone: the view button switches first-person / third-person
    if (playerState.viewRequest) {
      playerState.viewRequest = false
      v.firstPerson = !v.firstPerson
      v.pitch = v.firstPerson ? 0 : 0.25
    }

    // 1. Work out which way to go, relative to where the camera is looking
    const { forward, backward, left, right, run: runKey } = getKeys()
    direction.set(Number(right) - Number(left), 0, Number(backward) - Number(forward))
    let run = runKey
    if (direction.lengthSq() === 0 && touchInput.active) {
      // Phone joystick: push it all the way to run
      const push = Math.hypot(touchInput.x, touchInput.y)
      if (push > 0.15) direction.set(touchInput.x, 0, -touchInput.y)
      run = push > 0.85
    }
    const frozen = mode === 'talk' || mode === 'start' || getGame().typing
    if (frozen) direction.set(0, 0, 0) // stand still while talking or typing your name
    const moving = direction.lengthSq() > 0
    const speed = run ? RUN_SPEED : WALK_SPEED
    if (moving) direction.normalize().applyAxisAngle(up, v.yaw)

    // Sit down / stand up (only while walking around). Moving, jumping or diving stands you up.
    const s = sit.current
    if (playerState.sitRequest) {
      playerState.sitRequest = false
      if (mode === 'walk' && grounded) s.on = !s.on
    }
    if (s.on && (moving || mode !== 'walk' || playerState.jumpRequest || playerState.diveRequest)) s.on = false
    s.amount = THREE.MathUtils.damp(s.amount, s.on ? 1 : 0, 8, delta)

    // Jump
    const d = dive.current
    if (playerState.jumpRequest) {
      playerState.jumpRequest = false
      if (grounded && !frozen && t - d.start > DIVE_TOTAL) upSpeed = JUMP_SPEED
    }

    // Dive: throw yourself forward (in pickleball it also reaches far for the ball)
    if (playerState.diveRequest) {
      playerState.diveRequest = false
      if (grounded && !frozen && t - d.start > DIVE_TOTAL) {
        d.start = t
        const facing = model.current.rotation.y
        if (moving) d.dir.copy(direction)
        else d.dir.set(Math.sin(facing), 0, Math.cos(facing))
        upSpeed = 2.5
        playerState.swingUntil = t + DIVE_FLY + 0.15
      }
    }
    const diveTime = t - d.start
    const diving = diveTime < DIVE_TOTAL
    playerState.diving = diveTime < DIVE_FLY + 0.15

    if (diving) {
      // Fly forward, slide a little, then lie there before getting up
      const slide = diveTime < DIVE_FLY ? 1 : Math.max(0, 1 - (diveTime - DIVE_FLY) / 0.35) * 0.35
      direction.copy(d.dir).multiplyScalar(DIVE_SPEED * slide)
      model.current.rotation.y = Math.atan2(d.dir.x, d.dir.z)
      const getUp = DIVE_TOTAL - 0.4
      const lean = diveTime < DIVE_FLY ? diveTime / DIVE_FLY : diveTime < getUp ? 1 : (DIVE_TOTAL - diveTime) / 0.4
      // 3D model characters have their own dive-roll animation, so don't tip them over too
      const own = getGame().avatar.model !== 'custom'
      tilt.current.rotation.x = own ? 0 : lean * 1.45
      tilt.current.position.y = own ? 0 : -lean * 0.62
    } else {
      tilt.current.rotation.x = 0
      tilt.current.position.y = -SIT_DROP * s.amount // lower the body to the ground when sitting
      if (moving) {
        direction.multiplyScalar(speed)
        // 2. Turn the character to face where it's walking
        const angle = Math.atan2(direction.x, direction.z)
        model.current.rotation.y = lerpAngle(model.current.rotation.y, angle, 1 - Math.exp(-12 * delta))
      } else if (mode === 'talk') {
        // Look at Edson while talking
        const angle = Math.atan2(npcPos.x - playerPos.x, npcPos.z - playerPos.z)
        model.current.rotation.y = lerpAngle(model.current.rotation.y, angle, 1 - Math.exp(-8 * delta))
      }
    }

    // 3. Move
    body.current.setLinvel({ x: direction.x, y: upSpeed, z: direction.z }, true)
    playerPos.set(pos.x, pos.y, pos.z)
    // What the other players see
    playerState.facing = model.current.rotation.y
    playerState.moving = moving && !diving && grounded
    playerState.sit = s.amount
    playerState.dive = diving ? -tilt.current.position.y / 0.62 : 0

    // 4. Arms and legs (and the paddle swing during pickleball)
    const swing = t < playerState.swingUntil ? 1 - (playerState.swingUntil - t) / SWING_TIME : -1
    if (paddle.current) paddle.current.visible = mode === 'pickleball' || mode === 'pickleball2'
    // Knees and elbows bend; sitting is mahinhin for Babae characters
    animatePerson(limbs, state.clock.elapsedTime, moving && !diving && grounded, speed, swing, s.amount,
      getGame().avatar.gender === 'female')
    limbs.current.motion.air = !grounded && !diving
    limbs.current.motion.dive = diving

    // 5. Camera
    model.current.visible = !v.firstPerson
    if (v.firstPerson) {
      state.camera.position.set(pos.x, pos.y + EYE_HEIGHT, pos.z)
      lookTarget.set(
        -Math.sin(v.yaw) * Math.cos(v.pitch),
        -Math.sin(v.pitch),
        -Math.cos(v.yaw) * Math.cos(v.pitch)
      ).add(state.camera.position)
      state.camera.lookAt(lookTarget)
      return
    }

    lookTarget.set(pos.x, pos.y + 0.8, pos.z)
    offset.set(Math.sin(v.yaw) * Math.cos(v.pitch), Math.sin(v.pitch), Math.cos(v.yaw) * Math.cos(v.pitch))
    // Pull the camera closer if a wall or tree is between it and the player
    let distance = CAMERA_DISTANCE
    const hit = world.castRay(new rapier.Ray(lookTarget, offset), distance, true, undefined, undefined, undefined, body.current)
    if (hit) distance = Math.max(0.6, (hit.timeOfImpact ?? hit.toi) - 0.3)
    cameraGoal.copy(lookTarget).addScaledVector(offset, distance)
    if (hit) state.camera.position.copy(cameraGoal)
    else state.camera.position.lerp(cameraGoal, 1 - Math.exp(-10 * delta))
    state.camera.lookAt(lookTarget)
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[-5.0, 1.5, -7]} // left sidewalk, where photo 2 was taken; TNLF and Edson are just ahead
      enabledRotations={[false, false, false]}
    >
      {/* friction 0 so the player slides along walls instead of sticking */}
      <CapsuleCollider args={[0.5, 0.4]} friction={0} />
      <SpeechBubble bubble={bubbles.me} />
      <group ref={model} rotation={[0, Math.PI, 0]}>
        {/* tilt: leans the body forward when diving */}
        <group ref={tilt}>
          <Person limbs={limbs} paddleRef={paddle} avatar={avatar} />
        </group>
      </group>
    </RigidBody>
  )
}
