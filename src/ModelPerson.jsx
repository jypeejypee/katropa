import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { SIT_DROP } from './Person.jsx'

// Ready-made 3D characters (built with tools/build-character.mjs into public/models)
export const MODEL_FILES = {
  pinoy: '/models/pinoy.glb',
  pinay: '/models/pinay.glb',
}

const HEIGHT = 1.75 // meters, from feet to the top of the head
const FADE = 0.2 // seconds to blend from one animation to the next

// A 3D character from a GLB file with Mixamo animations (idle, walk, run, sit, jump, dive, and skate/push on a skateboard).
// It reads what the body is doing from limbs.current.motion (set by animatePerson in Person.jsx).
export default function ModelPerson({ model, limbs, paddleRef }) {
  const { scene, animations } = useGLTF(MODEL_FILES[model])
  const group = useRef()
  // Every player needs their own copy of the model and its skeleton
  const character = useMemo(() => {
    const copy = clone(scene)
    copy.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.frustumCulled = false
      }
    })
    // Scale to a normal height and put the feet on the ground (y = -0.9 in our body coordinates).
    // Measured with the skeleton (head and toe bones), which is what the model follows when drawn.
    copy.updateMatrixWorld(true)
    const bone = (name) => copy.getObjectByName(`mixamorig${name}`) ?? copy.getObjectByName(`mixamorig:${name}`)
    const head = bone('Head').getWorldPosition(new THREE.Vector3()).y
    const toe = bone('LeftToeBase').getWorldPosition(new THREE.Vector3()).y
    // The head bone sits at about 84% of the body height above the toes
    const scale = (HEIGHT * 0.84) / (head - toe)
    copy.scale.setScalar(scale)
    // Mixamo animations stand the feet at the model's origin, so the origin goes on the ground
    copy.position.y = -0.9
    return copy
  }, [scene])
  const { actions } = useAnimations(animations, group)
  const current = useRef(null)

  // The dive roll plays once, sped up to fit the dive (about 1.3 seconds)
  useEffect(() => {
    const dive = actions.dive
    if (!dive) return
    dive.setLoop(THREE.LoopOnce, 1)
    dive.clampWhenFinished = true
    dive.timeScale = dive.getClip().duration / 1.3
  }, [actions])

  // Paddle in the right hand (only visible during pickleball)
  useEffect(() => {
    const hand = character.getObjectByName('mixamorigRightHand') ?? character.getObjectByName('mixamorig:RightHand')
    if (!hand) return
    const paddle = new THREE.Group()
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.13, 8), new THREE.MeshStandardMaterial({ color: '#222' }))
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.022, 20), new THREE.MeshStandardMaterial({ color: '#1e88e5' }))
    handle.position.y = 0.08
    face.position.y = 0.26
    face.rotation.x = Math.PI / 2
    face.scale.set(1, 1, 1.25)
    paddle.add(handle, face)
    // Undo the bone's own scale so the paddle has its real size
    character.updateMatrixWorld(true)
    const s = new THREE.Vector3()
    hand.getWorldScale(s)
    paddle.scale.setScalar(1 / s.x)
    paddle.visible = false
    hand.add(paddle)
    if (paddleRef) paddleRef.current = paddle
    return () => hand.remove(paddle)
  }, [character, paddleRef])

  useFrame(() => {
    const m = limbs.current.motion ?? {}
    let next = 'idle'
    // On the skateboard: kick the ground while pushing, otherwise ride crouched (also in the air)
    if (m.skate && actions.skate) next = m.moving && actions.push ? 'push' : 'skate'
    else if (m.dive && actions.dive) next = 'dive'
    else if (m.sit > 0.5) next = 'sit'
    else if (m.air) next = 'jump'
    else if (m.moving) next = m.speed > 5 ? 'run' : 'walk'
    if (next !== current.current && actions[next]) {
      if (current.current) {
        actions[current.current]?.fadeOut(FADE)
        actions[next].reset().fadeIn(FADE).play()
      } else {
        actions[next].reset().play() // the very first animation starts right away
      }
      current.current = next
    }
    // The sitting animation lowers the body by itself; undo the drop used by the built characters
    if (group.current) group.current.position.y = SIT_DROP * (m.sit ?? 0)
  })

  return (
    <group ref={group}>
      <primitive object={character} />
    </group>
  )
}

Object.values(MODEL_FILES).forEach((file) => useGLTF.preload(file))
