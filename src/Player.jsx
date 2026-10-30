import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { playerPos, playerState, talkTarget, now, lerpAngle, touchInput } from './world.js'
import { getGame, setGame, useGame } from './game.js'
import { MAPS } from './maps.js'
import { isTyping } from './network.js'
import { Person, animatePerson, SIT_DROP } from './Person.jsx'
import SpeechBubble from './SpeechBubble.jsx'
import { Skateboard } from './Skatepark.jsx'
import { SKATE, POINTS, DECK_LIFT } from './skate.js'

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
const slope = new THREE.Vector3() // which way the ground under the skateboard faces
const nose = new THREE.Vector3(0, 0, 1) // the skateboard spins around this for a kickflip
const spin = new THREE.Quaternion()

export default function Player() {
  const body = useRef()
  const model = useRef()
  const paddle = useRef()
  const tilt = useRef()
  const limbs = useRef({ legs: [], arms: [] })
  const dive = useRef({ start: -10, dir: new THREE.Vector3() })
  const sit = useRef({ on: false, amount: 0 }) // amount: 0 = standing, 1 = sitting
  // Skateboard: which way it rolls, when you left the ground, and the trick you're doing
  const board = useRef()
  const skate = useRef({ heading: 0, air: false, airStart: 0, ollie: false, flip: false, flipStart: -10 })
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
      // J = jump, K = dive. On the skateboard Shift is the kickflip instead.
      // Space also jumps while walking or skating (in pickleball Space is for hitting)
      const skating = getGame().mode === 'skate'
      if (e.code === 'KeyJ' || (e.code === 'Space' && (getGame().mode === 'walk' || skating))) {
        e.preventDefault()
        playerState.jumpRequest = true
      }
      if (skating ? (e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat : e.code === 'KeyK') playerState.diveRequest = true
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

    // Jump (on the skateboard it's an ollie)
    const skating = mode === 'skate'
    const sk = skate.current
    const d = dive.current
    if (playerState.jumpRequest) {
      playerState.jumpRequest = false
      if (grounded && !frozen && t - d.start > DIVE_TOTAL) {
        upSpeed = skating ? SKATE.ollie : JUMP_SPEED
        if (skating) sk.ollie = true
      }
    }

    // Dive: throw yourself forward (in pickleball it also reaches far for the ball).
    // On the skateboard it's a kickflip instead (from the ground it pops an ollie first).
    if (playerState.diveRequest) {
      playerState.diveRequest = false
      if (skating) {
        if (t - sk.flipStart > SKATE.flipTime) {
          if (grounded) {
            upSpeed = SKATE.ollie
            sk.ollie = true
          }
          sk.flipStart = t
          sk.flip = true
        }
      } else if (grounded && !frozen && t - d.start > DIVE_TOTAL) {
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

    let pushing = false // kicking the ground to go faster on the skateboard
    if (skating) {
      // 2b. Riding the skateboard: it keeps rolling, and turns a little at a time.
      // Start from how fast the body really moved (ramps and walls slow you down).
      let rolling = Math.hypot(velocity.x, velocity.z)
      if (rolling > 0.3) sk.heading = Math.atan2(velocity.x, velocity.z)
      // Only the admin gets the extra-fast board (on a phone: with the joystick pushed all the way)
      const top = getGame().admin && (!touchInput.active || run) ? SKATE.fast : SKATE.push
      if (grounded) {
        if (moving) {
          const want = Math.atan2(direction.x, direction.z)
          const turn = lerpAngle(sk.heading, want, 1) - sk.heading
          if (rolling < 0.5) sk.heading = want
          else sk.heading += THREE.MathUtils.clamp(turn, -SKATE.turn * delta, SKATE.turn * delta)
          if (Math.abs(turn) > 2.3) rolling = Math.max(0, rolling - 8 * delta) // pulling back = brake
          else if (rolling < top) {
            rolling = Math.min(top, rolling + SKATE.accel * delta)
            pushing = true
          }
        } else rolling *= Math.exp(-SKATE.coast * delta)
      }

      // Put the board on whatever is under you, tilted like the ground (ramps, curbs).
      // On a slope the round bottom of the body rides higher than on flat ground, so look straight down.
      groundRay.current.origin = { x: pos.x, y: pos.y, z: pos.z }
      const below = world.castRayAndGetNormal(groundRay.current, 1.3, true, undefined, undefined, undefined, body.current)
      const ground = below ? -(below.timeOfImpact ?? below.toi) : -0.9 // where the ground is, under the body's middle
      if (below) slope.set(below.normal.x, below.normal.y, below.normal.z).applyAxisAngle(up, -model.current.rotation.y)
      else slope.copy(up)
      sk.ground = sk.air ? -0.9 : THREE.MathUtils.damp(sk.ground ?? ground, ground, 25, delta)

      // Tricks: spin the board for a kickflip, and score when you land
      const flip = (t - sk.flipStart) / SKATE.flipTime
      board.current.quaternion.setFromUnitVectors(up, sk.air ? up : slope)
        .multiply(spin.setFromAxisAngle(nose, flip < 1 ? flip * Math.PI * 2 : 0))
      board.current.position.y = sk.ground + 0.08 + (flip < 1 ? Math.sin(flip * Math.PI) * 0.25 : 0)
      if (!grounded && !sk.air) {
        sk.air = true
        sk.airStart = t
      } else if (grounded && sk.air) {
        sk.air = false
        const airTime = t - sk.airStart
        const tricks = []
        let points = 0
        if (flip < 1) {
          rolling = 0 // landed before the board finished turning
          setGame({ message: 'Sablay! 😵' })
        } else if (airTime > 0.25) {
          if (sk.flip) {
            tricks.push('Kickflip')
            points += POINTS.kickflip
          } else if (sk.ollie) {
            tricks.push('Ollie')
            points += POINTS.ollie
          }
          if (airTime > 0.9) {
            tricks.push('Big air')
            points += POINTS.air
          }
        }
        if (points) {
          const score = getGame().skateScore + points
          setGame({ skateScore: score, skateBest: Math.max(score, getGame().skateBest), message: `${tricks.join(' + ')}! +${points}` })
        }
        sk.ollie = false
        sk.flip = false
      }

      direction.set(Math.sin(sk.heading) * rolling, 0, Math.cos(sk.heading) * rolling)
      model.current.rotation.y = lerpAngle(model.current.rotation.y, sk.heading, 1 - Math.exp(-14 * delta))
      // Stand sideways on the board (the 3D characters' skate animations already stand that way)
      const { model: look } = getGame().avatar
      tilt.current.rotation.set(0, look === 'custom' ? Math.PI / 2 : 0, 0)
      // Soles on the deck (each kind of character has a different shoe thickness)
      tilt.current.position.y = sk.ground + 0.9 + (DECK_LIFT[look] ?? DECK_LIFT.custom)
    } else if (diving) {
      // Fly forward, slide a little, then lie there before getting up
      const slide = diveTime < DIVE_FLY ? 1 : Math.max(0, 1 - (diveTime - DIVE_FLY) / 0.35) * 0.35
      direction.copy(d.dir).multiplyScalar(DIVE_SPEED * slide)
      model.current.rotation.y = Math.atan2(d.dir.x, d.dir.z)
      const getUp = DIVE_TOTAL - 0.4
      const lean = diveTime < DIVE_FLY ? diveTime / DIVE_FLY : diveTime < getUp ? 1 : (DIVE_TOTAL - diveTime) / 0.4
      // 3D model characters have their own dive-roll animation, so don't tip them over too
      const own = getGame().avatar.model !== 'custom'
      tilt.current.rotation.set(own ? 0 : lean * 1.45, 0, 0)
      tilt.current.position.y = own ? 0 : -lean * 0.62
    } else {
      tilt.current.rotation.set(0, 0, 0)
      tilt.current.position.y = -SIT_DROP * s.amount // lower the body to the ground when sitting
      if (moving) {
        direction.multiplyScalar(speed)
        // 2. Turn the character to face where it's walking
        const angle = Math.atan2(direction.x, direction.z)
        model.current.rotation.y = lerpAngle(model.current.rotation.y, angle, 1 - Math.exp(-12 * delta))
      } else if (mode === 'talk') {
        // Look at whoever you're talking to
        const angle = Math.atan2(talkTarget.x - playerPos.x, talkTarget.z - playerPos.z)
        model.current.rotation.y = lerpAngle(model.current.rotation.y, angle, 1 - Math.exp(-8 * delta))
      }
    }

    // 3. Move
    body.current.setLinvel({ x: direction.x, y: upSpeed, z: direction.z }, true)
    playerPos.set(pos.x, pos.y, pos.z)
    // What the other players see
    playerState.facing = model.current.rotation.y
    playerState.moving = skating ? pushing && grounded : moving && !diving && grounded
    playerState.skate = skating ? 1 : 0
    board.current.visible = skating
    playerState.sit = s.amount
    playerState.dive = diving ? -tilt.current.position.y / 0.62 : 0

    // 4. Arms and legs (and the paddle swing during pickleball)
    const swing = t < playerState.swingUntil ? 1 - (playerState.swingUntil - t) / SWING_TIME : -1
    if (paddle.current) paddle.current.visible = mode === 'pickleball' || mode === 'pickleball2'
    // Knees and elbows bend; sitting is mahinhin for Babae characters
    animatePerson(limbs, state.clock.elapsedTime, playerState.moving, skating ? WALK_SPEED : speed, swing, s.amount,
      getGame().avatar.gender === 'female')
    limbs.current.motion.air = !grounded && !diving
    limbs.current.motion.dive = diving
    limbs.current.motion.skate = skating

    // 5. Camera
    // Follow where the body is drawn, not the raw physics position: physics moves in fixed steps
    // (60 a second) and the drawing glides between them. Following the steps made the view shake
    // when running or skating on screens that aren't exactly 60 frames a second (phones, 120/144 Hz).
    const shown = model.current.parent.position
    model.current.visible = !v.firstPerson
    if (v.firstPerson) {
      state.camera.position.set(shown.x, shown.y + EYE_HEIGHT, shown.z)
      lookTarget.set(
        -Math.sin(v.yaw) * Math.cos(v.pitch),
        -Math.sin(v.pitch),
        -Math.cos(v.yaw) * Math.cos(v.pitch)
      ).add(state.camera.position)
      state.camera.lookAt(lookTarget)
      return
    }

    lookTarget.set(shown.x, shown.y + 0.8, shown.z)
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
      position={MAPS[getGame().map].start}
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
        {/* Andrew's skateboard, under your feet while skating (it turns around its middle for a kickflip) */}
        <group ref={board} position={[0, -0.82, 0]} visible={false}>
          <group position={[0, -0.08, 0]}>
            <Skateboard deck="#2a9d8f" />
          </group>
        </group>
      </group>
    </RigidBody>
  )
}
