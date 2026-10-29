// Converts the Mixamo FBX files in models/source into GLB files in models/work
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { platform } from 'node:os'

const exe = `node_modules/fbx2gltf/bin/${platform() === 'win32' ? 'Windows_NT/FBX2glTF.exe' : platform() === 'darwin' ? 'Darwin/FBX2glTF' : 'Linux/FBX2glTF'}`
mkdirSync('models/work', { recursive: true })
for (const name of ['idle', 'walk', 'run', 'sit', 'jump']) {
  execFileSync(exe, ['--binary', '--input', `models/source/${name}.fbx`, '--output', `models/work/${name}`], { stdio: 'inherit' })
}
