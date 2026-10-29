// npm run character -- <name>   (e.g. pinoy, pinay): convert the FBX files, then build public/models/<name>.glb
import { execFileSync } from 'node:child_process'
const name = process.argv[2] ?? 'pinoy'
for (const script of ['tools/convert-fbx.mjs', 'tools/build-character.mjs']) {
  execFileSync(process.execPath, [script, name], { stdio: 'inherit' })
}
