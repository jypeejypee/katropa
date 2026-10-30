// ============================================================
//  Builds The Victor statue for Bridgetowne from:
//    models/victor/victor.obj   the body (made from photos; its head was only a round ball)
//  The ball is cut off and a sculpted human head is put on instead: skull, brow, eye sockets,
//  nose, cheekbones, lips, jaw, chin, ears and a neck, tilted up toward the raised fist.
//  Output: public/models/victor.glb (one mesh, standing on y = 0, facing -z, about 56 m tall)
//
//  Usage:  npm run victor      (add --obj to also write models/work/victor.obj to look at)
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import * as THREE from 'three'
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js'
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { Document, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'

const HEIGHT = 56 // meters, feet to fist

// ---------- 1. The body from the OBJ, without the ball head ----------
const lines = readFileSync('models/victor/victor.obj', 'utf8').split('\n')
const verts = []
const faces = []
for (const l of lines) {
  const p = l.trim().split(/\s+/)
  if (p[0] === 'v') verts.push(p.slice(1, 4).map(Number))
  if (p[0] === 'f') faces.push(p.slice(1).map((s) => parseInt(s) - 1))
}
// The ball: everything above the neck and left of the raised arm
const inHead = ([x, y]) => y > 0.156 && x < -0.012
const kept = faces.filter((f) => !f.every((i) => inHead(verts[i])))
const body = new THREE.BufferGeometry()
body.setAttribute('position', new THREE.Float32BufferAttribute(verts.flat(), 3))
body.setIndex(kept.flatMap((f) => [f[0], f[1], f[2]]))
body.computeVertexNormals()

// ---------- 2. The new head, as a shape made of smooth blobs ----------
// Head units: 1 = chin to top of the skull. Face looks toward -z, up is +y.
const len = (x, y, z) => Math.sqrt(x * x + y * y + z * z)
function ellipsoid(p, c, r) {
  const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2]
  const k0 = len(x, y, z)
  const k1 = len(x / r[0], y / r[1], z / r[2])
  return k1 === 0 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1
}
function capsule(p, a, b, r) {
  const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]]
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const h = Math.max(0, Math.min(1, (pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2)))
  return len(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - r
}
// smooth union and smooth cut
function join(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - (h * h * k) / 4
}
const cut = (a, b, k) => -join(-a, b, k)
const both = (f) => (p) => f([Math.abs(p[0]), p[1], p[2]]) // mirrored left/right

const ear = both((p) => ellipsoid(p, [0.335, -0.04, 0.07], [0.04, 0.115, 0.07]))
const jawCorner = both((p) => ellipsoid(p, [0.215, -0.25, 0.02], [0.08, 0.11, 0.12]))
const cheek = both((p) => ellipsoid(p, [0.215, -0.03, -0.22], [0.1, 0.075, 0.1]))
const socket = both((p) => ellipsoid(p, [0.13, 0.02, -0.4], [0.09, 0.055, 0.06]))
const eye = both((p) => ellipsoid(p, [0.13, 0.012, -0.35], [0.062, 0.038, 0.04]))

function head(p) {
  let d = ellipsoid(p, [0, 0.12, 0.05], [0.34, 0.4, 0.44]) // skull
  d = join(d, ellipsoid(p, [0, -0.12, -0.1], [0.25, 0.34, 0.27]), 0.12) // face
  d = join(d, jawCorner(p), 0.1)
  d = join(d, ellipsoid(p, [0, -0.39, -0.24], [0.13, 0.1, 0.11]), 0.1) // chin
  d = join(d, cheek(p), 0.08)
  d = join(d, capsule(p, [-0.2, 0.09, -0.355], [0.2, 0.09, -0.355], 0.055), 0.07) // brow
  d = cut(d, socket(p), 0.07)
  d = join(d, eye(p), 0.05)
  d = join(d, capsule(p, [0, 0.03, -0.39], [0, -0.13, -0.465], 0.035), 0.05) // bridge of the nose
  d = join(d, ellipsoid(p, [0, -0.155, -0.445], [0.065, 0.04, 0.05]), 0.05) // tip and wings of the nose
  d = join(d, ellipsoid(p, [0, -0.245, -0.37], [0.095, 0.024, 0.026]), 0.05) // upper lip
  d = join(d, ellipsoid(p, [0, -0.29, -0.355], [0.08, 0.022, 0.024]), 0.04) // lower lip
  d = join(d, ear(p), 0.05)
  d = join(d, capsule(p, [0, -0.1, 0.25], [0, -0.55, 0.2], 0.17), 0.15) // back of the neck
  return d
}

// Where the head sits on the body (OBJ units), how big, and how it's turned
const HEAD_SIZE = 0.082
const HEAD_AT = new THREE.Vector3(-0.05, 0.204, 0.006)
const turn = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.38, -0.25, -0.08, 'YXZ')) // looks up, toward the fist
const unturn = turn.clone().invert()
const NECK_BASE = [-0.052, 0.128, 0.014] // inside the shoulders
const neckTop = new THREE.Vector3(0, -0.3, 0.1).multiplyScalar(HEAD_SIZE).applyQuaternion(turn).add(HEAD_AT)

const v = new THREE.Vector3()
function shape(x, y, z) {
  v.set(x, y, z).sub(HEAD_AT).applyQuaternion(unturn).divideScalar(HEAD_SIZE)
  const h = head([v.x, v.y, v.z]) * HEAD_SIZE
  const neck = capsule([x, y, z], NECK_BASE, neckTop.toArray(), 0.0205)
  return join(h, neck, 0.014)
}

// Turn the shape into triangles (marching cubes over a box around the head and neck)
const RES = 96
const BOX_MID = new THREE.Vector3(-0.05, 0.2, 0.01)
const BOX_HALF = 0.085
const mc = new MarchingCubes(RES, new THREE.MeshBasicMaterial(), false, false, 200000)
mc.isolation = 0
for (let k = 0; k < RES; k++) {
  for (let j = 0; j < RES; j++) {
    for (let i = 0; i < RES; i++) {
      const f = (n) => (n - RES / 2) / (RES / 2) * BOX_HALF
      mc.field[i + j * RES + k * RES * RES] = -shape(BOX_MID.x + f(i), BOX_MID.y + f(j), BOX_MID.z + f(k))
    }
  }
}
mc.update()
let headGeo = new THREE.BufferGeometry()
headGeo.setAttribute('position', new THREE.Float32BufferAttribute(mc.positionArray.slice(0, mc.count * 3), 3))
headGeo.scale(BOX_HALF, BOX_HALF, BOX_HALF).translate(BOX_MID.x, BOX_MID.y, BOX_MID.z)
headGeo = mergeVertices(headGeo, 1e-6)
smooth(headGeo, 6) // marching cubes leaves little steps; smooth them out

// Taubin smoothing: each point moves toward the middle of its neighbors, then a bit back (so it doesn't shrink)
function smooth(g, rounds) {
  const P = g.attributes.position.array
  const I = g.index.array
  const near = Array.from({ length: P.length / 3 }, () => new Set())
  for (let i = 0; i < I.length; i += 3) {
    for (const [a, b] of [[I[i], I[i + 1]], [I[i + 1], I[i + 2]], [I[i + 2], I[i]]]) { near[a].add(b); near[b].add(a) }
  }
  for (let r = 0; r < rounds * 2; r++) {
    const step = r % 2 ? -0.53 : 0.5
    const next = P.slice()
    near.forEach((ns, i) => {
      if (!ns.size) return
      for (let c = 0; c < 3; c++) {
        let m = 0
        for (const n of ns) m += P[n * 3 + c]
        next[i * 3 + c] = P[i * 3 + c] + step * (m / ns.size - P[i * 3 + c])
      }
    })
    P.set(next)
  }
}
// Marching cubes may wind the triangles inside out: check at the top of the head
headGeo.computeVertexNormals()
const pos = headGeo.attributes.position
let top = 0
for (let i = 1; i < pos.count; i++) if (pos.getY(i) > pos.getY(top)) top = i
if (headGeo.attributes.normal.getY(top) < 0) {
  const idx = headGeo.index.array
  for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]
  headGeo.computeVertexNormals()
}

// ---------- 3. One mesh, feet on the ground, the right size ----------
const geo = mergeGeometries([body, headGeo])
geo.computeBoundingBox()
const b = geo.boundingBox
const s = HEIGHT / (b.max.y - b.min.y)
// stand him over the middle of his feet
const feet = new THREE.Box3()
for (const p of verts) if (p[1] < b.min.y + 0.05) feet.expandByPoint(new THREE.Vector3(...p))
const mid = feet.getCenter(new THREE.Vector3())
geo.translate(-mid.x, -b.min.y, -mid.z).scale(s, s, s)
console.log(`body ${kept.length} triangles (ball head: ${faces.length - kept.length} removed), new head ${headGeo.index.count / 3} triangles`)

if (process.argv.includes('--obj')) {
  mkdirSync('models/work', { recursive: true })
  const P = geo.attributes.position
  const out = []
  for (let i = 0; i < P.count; i++) out.push(`v ${P.getX(i).toFixed(4)} ${P.getY(i).toFixed(4)} ${P.getZ(i).toFixed(4)}`)
  const I = geo.index.array
  for (let i = 0; i < I.length; i += 3) out.push(`f ${I[i] + 1} ${I[i + 1] + 1} ${I[i + 2] + 1}`)
  writeFileSync('models/work/victor.obj', out.join('\n'))
}

// ---------- 4. Save as a small GLB ----------
const doc = new Document()
const buffer = doc.createBuffer()
const prim = doc.createPrimitive()
  .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geo.attributes.position.array)).setBuffer(buffer))
  .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geo.attributes.normal.array)).setBuffer(buffer))
  .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(geo.index.array)).setBuffer(buffer))
const mesh = doc.createMesh('victor').addPrimitive(prim)
doc.createScene().addChild(doc.createNode('victor').setMesh(mesh))
await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
await doc.transform(meshopt({ encoder: MeshoptEncoder }))
await io.write('public/models/victor.glb', doc)
console.log('saved public/models/victor.glb')
