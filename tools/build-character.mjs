// ============================================================
//  Builds one game-ready character file from:
//    models/<name>/color.glb          the colored model (from Trellis / Tripo)
//    models/work/<name>/idle.glb ...  Mixamo animations converted from FBX
//  Output: public/models/<name>.glb (small, compressed, with idle/walk/run/sit/jump)
//
//  Usage:  npm run character -- pinay   (converts the FBX files first, see README)
// ============================================================
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, resample, textureCompress, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'

const outName = process.argv[2] ?? 'pinoy'
const work = `models/work/${outName}`
const ANIMATIONS = ['walk', 'run', 'sit', 'jump'] // idle comes with the base file

await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })

// 1. Start from Mixamo's idle (it has the mesh + skeleton)
const doc = await io.read(`${work}/idle.glb`)
const root = doc.getRoot()
const buffer = root.listBuffers()[0]
root.listAnimations()[0].setName('idle')

// 2. Put the colors back from the original model (same texture layout)
const colored = await io.read(`models/${outName}/color.glb`)
const sourceTexture = colored.getRoot().listTextures()[0]
const texture = doc.createTexture('skin').setImage(sourceTexture.getImage()).setMimeType(sourceTexture.getMimeType())
for (const material of root.listMaterials()) {
  material.setBaseColorTexture(texture).setBaseColorFactor([1, 1, 1, 1]).setMetallicFactor(0).setRoughnessFactor(0.85)
}
// FBX counts the texture's height from the bottom, GLB from the top: flip it back
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const uv = prim.getAttribute('TEXCOORD_0')
    const array = uv.getArray().slice()
    for (let i = 1; i < array.length; i += 2) array[i] = 1 - array[i]
    uv.setArray(array)
  }
}

// 2b. Mixamo often finds only one finger per hand, which tears the hand when it bends.
//     Make each hand move as one solid piece: finger bones hand their weight to the hand bone.
const skin = root.listSkins()[0]
const joints = skin.listJoints()
const jointName = (i) => joints[i].getName().replace(/^mixamorig:?/, '')
const handOf = new Map()
joints.forEach((joint, i) => {
  const match = jointName(i).match(/^(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)\d$/)
  if (match) handOf.set(i, joints.findIndex((_, j) => jointName(j) === `${match[1]}Hand`))
})
// Only needed when Mixamo found fewer than 5 fingers on a hand
const fingersFound = new Set([...handOf.keys()].map((i) => jointName(i).replace(/\d$/, '')))
if (fingersFound.size >= 10) handOf.clear()
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const jointsAttr = prim.getAttribute('JOINTS_0')
    if (!jointsAttr) continue
    const array = jointsAttr.getArray().slice()
    for (let i = 0; i < array.length; i++) if (handOf.has(array[i])) array[i] = handOf.get(array[i])
    jointsAttr.setArray(array)
  }
}
const fingerBones = new Set([...handOf.keys()].map((i) => joints[i]))
// The finger bones no longer move anything, so drop their animation too
for (const animation of root.listAnimations()) {
  for (const channel of animation.listChannels()) if (fingerBones.has(channel.getTargetNode())) channel.dispose()
}
console.log(`Hands: ${handOf.size} finger bones merged into the hands`)

// 3. Copy the other animations onto the same skeleton (bones are matched by name)
const nodeByName = new Map(root.listNodes().map((n) => [n.getName(), n]))
for (const name of ANIMATIONS) {
  const source = (await io.read(`${work}/${name}.glb`)).getRoot().listAnimations()[0]
  const animation = doc.createAnimation(name)
  for (const channel of source.listChannels()) {
    const target = nodeByName.get(channel.getTargetNode().getName())
    if (!target || fingerBones.has(target)) continue
    const path = channel.getTargetPath()
    const isHips = target.getName().endsWith('Hips')
    const sampler = channel.getSampler()
    const output = sampler.getOutput().getArray().slice()
    if (isHips && path === 'translation') {
      // The game moves the character itself, so the animation must stay in place:
      // remove forward/sideways movement (and for jump, the up/down too)
      for (let i = 0; i < output.length; i += 3) {
        output[i] = output[0]
        output[i + 2] = output[2]
        if (name === 'jump') output[i + 1] = output[1]
      }
    }
    const input = doc.createAccessor().setBuffer(buffer).setType('SCALAR').setArray(sampler.getInput().getArray().slice())
    const out = doc.createAccessor().setBuffer(buffer).setType(sampler.getOutput().getType()).setArray(output)
    const newSampler = doc.createAnimationSampler().setInput(input).setOutput(out).setInterpolation(sampler.getInterpolation())
    animation.addSampler(newSampler)
    animation.addChannel(doc.createAnimationChannel().setTargetNode(target).setTargetPath(path).setSampler(newSampler))
  }
}

// 4. Make it small: remove duplicates, simplify animation keys, compress texture and geometry
await doc.transform(
  dedup(),
  resample(),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 85 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
)

const outFile = `public/models/${outName}.glb`
await io.write(outFile, doc)
console.log(`Wrote ${outFile}`)
console.log(`Animations: ${root.listAnimations().map((a) => a.getName()).join(', ')}`)
