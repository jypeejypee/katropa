// Sends the built game (the dist folder from `npm run build`) to the browser.
// Used when the game is online: one server for both the game page and multiplayer.
// Files are gzip-compressed once at startup, so phones download them much faster.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, relative, sep } from 'node:path'
import { gzipSync } from 'node:zlib'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.webmanifest': 'application/manifest+json',
}
const COMPRESS = new Set(['.html', '.js', '.css', '.json', '.svg', '.wasm', '.webmanifest'])

// Load every file in the folder into memory: url path -> { body, gzipped, type }
function loadFiles(folder) {
  const files = new Map()
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else {
        const ext = extname(name)
        const body = readFileSync(full)
        files.set('/' + relative(folder, full).split(sep).join('/'), {
          body,
          gzipped: COMPRESS.has(ext) ? gzipSync(body) : null,
          type: TYPES[ext] ?? 'application/octet-stream',
          // Files in assets/ have a unique name per build, so phones can keep them
          cache: full.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
        })
      }
    }
  }
  walk(folder)
  return files
}

export function createStaticHandler(folder) {
  if (!existsSync(join(folder, 'index.html'))) {
    console.log('No built game found (run `npm run build` first). Only multiplayer is running.')
    return (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('Katropa server is running')
    }
  }
  const files = loadFiles(folder)
  console.log(`Serving the game (${files.size} files)`)
  return (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const file = files.get(path) ?? files.get('/index.html')
    const useGzip = file.gzipped && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')
    res.writeHead(200, {
      'Content-Type': file.type,
      'Cache-Control': file.cache,
      ...(useGzip ? { 'Content-Encoding': 'gzip' } : {}),
      Vary: 'Accept-Encoding',
    })
    res.end(useGzip ? file.gzipped : file.body)
  }
}
