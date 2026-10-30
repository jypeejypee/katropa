// Converts a character's Mixamo FBX files (models/<name>/*.fbx) into GLB files in models/work/<name>
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { platform } from 'node:os'

const name = process.argv[2] ?? 'pinoy'
const exe = `node_modules/fbx2gltf/bin/${platform() === 'win32' ? 'Windows_NT/FBX2glTF.exe' : platform() === 'darwin' ? 'Darwin/FBX2glTF' : 'Linux/FBX2glTF'}`
mkdirSync(`models/work/${name}`, { recursive: true })
for (const anim of ['idle', 'walk', 'run', 'sit', 'jump', 'dive', 'skate', 'push']) {
  if (!existsSync(`models/${name}/${anim}.fbx`)) continue // optional animations (like dive)
  execFileSync(exe, ['--binary', '--input', `models/${name}/${anim}.fbx`, '--output', `models/work/${name}/${anim}`], { stdio: 'inherit' })
}
