import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Speed trick: the street is made of thousands of small pieces that never move.
// Drawing each one separately is slow, so after they load we glue together all
// pieces that look the same (same color/texture) into one big piece.
// Only put things that never move inside this!
export default function StaticBatch({ children }) {
  const group = useRef()
  const scene = useThree((s) => s.scene)

  // No dependency list: runs again after hot reload so edits to houses.js still show up
  useEffect(() => {
    const root = group.current
    root.updateMatrixWorld(true)

    const buckets = new Map()
    root.traverse((obj) => {
      if (!obj.isMesh || Array.isArray(obj.material) || !obj.visible) return
      const m = obj.material
      const key = [
        m.type, m.color?.getHexString(), m.map?.uuid, m.transparent, m.opacity, m.side, m.flatShading,
        m.metalness, m.roughness, m.emissive?.getHexString(), m.emissiveIntensity, m.alphaTest,
        obj.castShadow, obj.receiveShadow,
      ].join('|')
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(obj)
    })

    const added = []
    const hidden = []
    for (const meshes of buckets.values()) {
      if (meshes.length < 2) continue
      const geometries = meshes.map((mesh) => {
        const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
        for (const name of Object.keys(g.attributes)) {
          if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name)
        }
        g.clearGroups()
        g.applyMatrix4(mesh.matrixWorld)
        return g
      })
      const merged = mergeGeometries(geometries)
      geometries.forEach((g) => g.dispose())
      if (!merged) continue
      const batch = new THREE.Mesh(merged, meshes[0].material)
      batch.castShadow = meshes[0].castShadow
      batch.receiveShadow = meshes[0].receiveShadow
      scene.add(batch)
      added.push(batch)
      meshes.forEach((mesh) => {
        mesh.visible = false
        hidden.push(mesh)
      })
    }

    return () => {
      added.forEach((batch) => {
        scene.remove(batch)
        batch.geometry.dispose()
      })
      hidden.forEach((mesh) => (mesh.visible = true))
    }
  })

  return <group ref={group}>{children}</group>
}
