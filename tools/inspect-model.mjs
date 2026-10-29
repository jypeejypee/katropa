// Prints what's inside a GLB file (meshes, triangles, textures, skeleton, animations)
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
await MeshoptDecoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder })
for (const file of process.argv.slice(2)) {
  const doc = await io.read(file)
  const root = doc.getRoot()
  let tris = 0
  const prims = []
  for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) {
    const n = p.getIndices() ? p.getIndices().getCount() / 3 : p.getAttribute('POSITION').getCount() / 3
    tris += n
    prims.push(`${mesh.getName()}: ${Math.round(n)} tris, attrs=${p.listSemantics().join(',')}, material=${p.getMaterial()?.getName()}`)
  }
  console.log(`\n== ${file}`)
  console.log(`triangles: ${Math.round(tris)}`)
  prims.forEach((p) => console.log('  ' + p))
  console.log(`materials: ${root.listMaterials().map((m) => `${m.getName()}(baseTex=${!!m.getBaseColorTexture()})`).join(', ')}`)
  console.log(`textures: ${root.listTextures().map((t) => `${t.getMimeType()} ${t.getSize()?.join('x')}`).join(', ')}`)
  console.log(`skins: ${root.listSkins().length}, joints: ${root.listSkins()[0]?.listJoints().length ?? 0}`)
  console.log(`animations: ${root.listAnimations().map((a) => `${a.getName()}(${a.listChannels().length} ch)`).join(', ')}`)
  const joints = root.listSkins()[0]?.listJoints().map((j) => j.getName()) ?? []
  if (joints.length) console.log(`first joints: ${joints.slice(0, 6).join(', ')}`)
}
