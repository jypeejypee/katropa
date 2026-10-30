import * as THREE from 'three'
import { rng } from './world.js'

// Textures are drawn on a <canvas> in code, so we don't need any image files.
// Each one is cached so it's only drawn once.
const cache = new Map()

function makeTexture(key, width, height, draw, repeat) {
  const fullKey = repeat ? `${key}|${repeat.join(',')}` : key
  if (cache.has(fullKey)) return cache.get(fullKey)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeat[0], repeat[1])
  }
  cache.set(fullKey, texture)
  return texture
}

// Fill with a base color and sprinkle little dots of other colors
function speckle(ctx, w, h, base, colors, count, seed) {
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  const random = rng(seed)
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.2 + random() * 0.4
    ctx.fillStyle = colors[Math.floor(random() * colors.length)]
    const size = 1 + random() * 2.5
    ctx.fillRect(random() * w, random() * h, size, size)
  }
  ctx.globalAlpha = 1
}

export const asphaltTexture = (repeat) =>
  makeTexture('asphalt', 256, 256, (ctx, w, h) => {
    speckle(ctx, w, h, '#57585a', ['#3c3d3f', '#6c6d70', '#2f3032', '#7a766e'], 6000, 1)
  }, repeat)

export const concreteTexture = (repeat) =>
  makeTexture('concrete', 256, 256, (ctx, w, h) => {
    speckle(ctx, w, h, '#bdb6aa', ['#a39c90', '#d2cbbf', '#8f897e'], 3000, 2)
    ctx.strokeStyle = 'rgba(90, 84, 76, 0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, w, h)
  }, repeat)

// Dashed center line: white on top half, see-through on the bottom half
export const dashTexture = (repeat) =>
  makeTexture('dash', 8, 64, (ctx, w) => {
    ctx.fillStyle = '#f2f2f2'
    ctx.fillRect(0, 0, w, 32)
  }, repeat)

// Rusty corrugated tin roof (the "yero" roofs)
export const tinTexture = (repeat) =>
  makeTexture('tin', 128, 128, (ctx, w, h) => {
    for (let x = 0; x < w; x++) {
      const v = Math.round(150 + 45 * Math.sin((x / w) * Math.PI * 2 * 8))
      ctx.fillStyle = `rgb(${v}, ${v - 4}, ${v - 12})`
      ctx.fillRect(x, 0, 1, h)
    }
    const random = rng(3)
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = `rgba(${140 + random() * 40 | 0}, ${70 + random() * 30 | 0}, 30, ${0.25 + random() * 0.3})`
      ctx.beginPath()
      ctx.ellipse(random() * w, random() * h, 4 + random() * 16, 3 + random() * 12, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }, repeat)

// Roll-up metal shutter of a closed store
export const shutterTexture = (repeat) =>
  makeTexture('shutter', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#a7abad'
    ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 8) {
      ctx.fillStyle = '#7d8285'
      ctx.fillRect(0, y, w, 2)
      ctx.fillStyle = '#c6cacc'
      ctx.fillRect(0, y + 2, w, 1)
    }
  }, repeat)

// Black iron gate / window grille
export const gateTexture = (repeat) =>
  makeTexture('gate', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#4d4a45'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#161616'
    for (let x = 2; x < w; x += 10) ctx.fillRect(x, 0, 4, h)
    ctx.fillRect(0, 6, w, 4)
    ctx.fillRect(0, h - 10, w, 4)
  }, repeat)

// Open sari-sari store: shelves full of colorful snacks
export const storeTexture = (repeat) =>
  makeTexture('store', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#5a4a3a'
    ctx.fillRect(0, 0, w, h)
    const random = rng(4)
    const colors = ['#e53935', '#fdd835', '#43a047', '#1e88e5', '#fb8c00', '#f5f5f5', '#8e24aa']
    // Long strips of hanging sachets (shampoo, coffee, snacks)
    for (let x = 6; x < w - 10; x += 18) {
      const color = colors[Math.floor(random() * colors.length)]
      const length = 40 + random() * 30
      for (let y = 4; y < length; y += 9) {
        ctx.fillStyle = color
        ctx.fillRect(x, y, 12, 8)
        ctx.fillStyle = 'rgba(255,255,255,0.35)'
        ctx.fillRect(x + 2, y + 2, 8, 2)
      }
    }
    // Wire mesh window in front of the counter (like a real sari-sari store)
    ctx.fillStyle = '#8a7a64'
    ctx.fillRect(0, 84, w, h - 84)
    ctx.strokeStyle = 'rgba(30, 30, 30, 0.6)'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 6) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 84)
      ctx.stroke()
    }
    for (let y = 0; y < 84; y += 6) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }, repeat)

// A sign with text. Use "\n" for two lines, or vertical: true to stack the letters.
export function signTexture({ text, bg = '#222222', fg = '#ffffff', vertical = false }, w, h) {
  const scale = Math.min(200, 1024 / Math.max(w, h))
  const W = Math.max(32, Math.round(w * scale))
  const H = Math.max(32, Math.round(h * scale))
  return makeTexture(`sign|${text}|${bg}|${fg}|${vertical}|${W}x${H}`, W, H, (ctx) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = fg
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (vertical) {
      const letters = [...text.replace(/\s/g, '')]
      const slot = H / (letters.length + 1)
      ctx.font = `bold ${Math.min(slot * 0.8, W * 0.7)}px Arial, sans-serif`
      letters.forEach((letter, i) => ctx.fillText(letter, W / 2, slot * (i + 1)))
    } else {
      const lines = text.split('\n')
      const lineH = H / lines.length
      lines.forEach((line, i) => {
        let size = lineH * 0.65
        ctx.font = `bold ${size}px Arial, sans-serif`
        const width = ctx.measureText(line).width
        if (width > W * 0.9) {
          size *= (W * 0.9) / width
          ctx.font = `bold ${size}px Arial, sans-serif`
        }
        ctx.fillText(line, W / 2, lineH * (i + 0.5))
      })
    }
  })
}

// Pickleball net mesh
export const netTexture = (repeat) =>
  makeTexture('net', 16, 16, (ctx, w, h) => {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, w, 2)
    ctx.fillRect(0, 0, 2, h)
  }, repeat)

// Painted lines on a compound wall (like the teal PEYSON wall)
export const stripesTexture = (repeat) =>
  makeTexture('stripes', 16, 64, (ctx, w) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.fillRect(0, 30, w, 3)
  }, repeat)

// Sky gradient. colors = [top, upper, near horizon, horizon] (see timeOfDay.js)
export const skyTexture = (colors) =>
  makeTexture(`sky|${colors.join()}`, 4, 512, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(0.3, colors[1])
    gradient.addColorStop(0.47, colors[2])
    gradient.addColorStop(0.5, colors[3])
    gradient.addColorStop(1, colors[3])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
  })

// Round glowing moon
export const moonTexture = () =>
  makeTexture('moon', 128, 128, (ctx, w, h) => {
    const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 64)
    glow.addColorStop(0, 'rgba(220, 230, 255, 0.5)')
    glow.addColorStop(1, 'rgba(220, 230, 255, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#f4f1e6'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(180, 175, 160, 0.5)'
    ctx.beginPath()
    ctx.arc(w / 2 - 7, h / 2 - 5, 6, 0, Math.PI * 2)
    ctx.arc(w / 2 + 8, h / 2 + 7, 4, 0, Math.PI * 2)
    ctx.fill()
  })

// Fluffy white cloud made of soft circles
export const cloudTexture = (seed) =>
  makeTexture(`cloud${seed}`, 256, 128, (ctx, w, h) => {
    const random = rng(seed * 11 + 5)
    for (let i = 0; i < 22; i++) {
      const x = w * (0.2 + random() * 0.6)
      const y = h * (0.45 + random() * 0.25)
      const r = 18 + random() * 30
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
      const shade = 235 + Math.round(random() * 20)
      gradient.addColorStop(0, `rgba(${shade}, ${shade}, ${shade + 5 > 255 ? 255 : shade + 5}, 0.9)`)
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)
    }
  })

// Grey metal wall panels in a grid (top of Taytay New Life Fellowship)
export const panelTexture = (repeat) =>
  makeTexture('panels', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d3d5d6'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#e2e4e5'
    ctx.fillRect(4, 4, w - 8, h / 2 - 8)
    ctx.fillStyle = '#9fa3a6'
    ctx.fillRect(0, 0, w, 3)
    ctx.fillRect(0, 0, 3, h)
  }, repeat)

// Row of wooden casement windows, some of them open
export const windowRowTexture = (repeat) =>
  makeTexture('windowRow', 128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#6b4a32'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * 31
      ctx.fillStyle = i === 2 ? '#8f8a80' : '#2c3640'
      ctx.fillRect(x, 6, 26, h - 12)
      if (i === 2) {
        ctx.fillStyle = '#6f6a62'
        for (let y = 10; y < h - 8; y += 5) ctx.fillRect(x + 2, y, 22, 2)
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(x + 3, 9, 8, h - 20)
    }
  }, repeat)

// Dark natural stone tiles at the bottom of the wall
export const stoneTexture = (repeat) =>
  makeTexture('stone', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3a3936'
    ctx.fillRect(0, 0, w, h)
    const random = rng(9)
    for (let y = 0; y < h; y += 16) {
      for (let x = (y / 16) % 2 ? -10 : 0; x < w; x += 20) {
        const v = 70 + Math.round(random() * 50)
        ctx.fillStyle = `rgb(${v}, ${v - 2}, ${v - 6})`
        ctx.fillRect(x + 1, y + 1, 18, 14)
      }
    }
  }, repeat)

// Sliding gate made of grey horizontal slats with gaps
export const slatGateTexture = (repeat) =>
  makeTexture('slatGate', 16, 32, (ctx, w) => {
    ctx.fillStyle = '#a9adb0'
    ctx.fillRect(0, 0, w, 18)
    ctx.fillStyle = '#7d8184'
    ctx.fillRect(0, 16, w, 2)
  }, repeat)


// Tall warehouse wall of old corrugated sheets: rusty, faded blue, orange and green patches
export const patchworkTexture = (repeat) =>
  makeTexture('patchwork', 256, 128, (ctx, w, h) => {
    const random = rng(12)
    const colors = ['#8f969c', '#a9653f', '#c48a4a', '#7b8f9e', '#b8a27c', '#5f8a6a', '#9c5a3c', '#a7a39a']
    for (let x = 0; x < w; ) {
      const pw = 14 + Math.floor(random() * 30)
      ctx.fillStyle = colors[Math.floor(random() * colors.length)]
      ctx.fillRect(x, 0, pw, h)
      x += pw
    }
    for (let x = 0; x < w; x += 3) {
      ctx.fillStyle = x % 6 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.18)'
      ctx.fillRect(x, 0, 1, h)
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${110 + random() * 40 | 0}, ${50 + random() * 20 | 0}, 25, ${0.3 + random() * 0.4})`
      ctx.fillRect(random() * w, random() * h, 2 + random() * 4, 10 + random() * 50)
    }
  }, repeat)

// Dark painted wall with white graffiti loops
export const graffitiTexture = (bg = '#2d2838', seed = 1) =>
  makeTexture(`graffiti|${bg}|${seed}`, 256, 128, (ctx, w, h) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    const random = rng(seed * 7 + 3)
    ctx.strokeStyle = 'rgba(240, 240, 240, 0.85)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    for (let n = 0; n < 3; n++) {
      ctx.beginPath()
      let x = 30 + random() * (w - 60)
      let y = 30 + random() * (h - 60)
      ctx.moveTo(x, y)
      for (let i = 0; i < 5; i++) {
        const nx = x + (random() - 0.5) * 50
        const ny = y + (random() - 0.5) * 50
        ctx.quadraticCurveTo(x + (random() - 0.5) * 60, y + (random() - 0.5) * 60, nx, ny)
        x = nx
        y = ny
      }
      ctx.stroke()
    }
  })

// Dark wooden louvers / vertical slats
export const louverTexture = (repeat) =>
  makeTexture('louver', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#4a3a2e'
    ctx.fillRect(0, 0, w, h)
    for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = '#6b5644'
      ctx.fillRect(x, 0, 5, h)
    }
  }, repeat)

// Sign of the EGB engine oil shop
export const egbSignTexture = () =>
  makeTexture('egbSign', 768, 96, (ctx, w, h) => {
    ctx.fillStyle = '#141414'
    ctx.fillRect(0, 0, w, h)
    ctx.textBaseline = 'middle'
    ctx.font = 'italic bold 46px Arial, sans-serif'
    ctx.fillStyle = '#e53935'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeText('VUMERZ', 18, h / 2)
    ctx.fillText('VUMERZ', 18, h / 2)
    ctx.fillStyle = '#ffd23f'
    ctx.font = 'bold 72px Arial Black, Arial, sans-serif'
    ctx.fillText('EGB', 270, h / 2 + 2)
    ctx.font = 'bold 30px Arial, sans-serif'
    ctx.fillText('SAFETY', 480, h / 2 - 17)
    ctx.fillText('ENGINE LUBE', 480, h / 2 + 19)
  })

// Black wall of the badminton court: COURT, HOME OF TEAM ABR, and yellow handprints
export const courtWallTexture = () =>
  makeTexture('courtWall', 1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#151515'
    ctx.fillRect(0, 0, w, h)
    const random = rng(5)
    ctx.fillStyle = '#f2c230'
    for (let i = 0; i < 26; i++) {
      const x = 40 + random() * (w - 80)
      const y = 20 + random() * 60
      ctx.beginPath()
      ctx.ellipse(x, y, 9, 11, 0, 0, Math.PI * 2)
      ctx.fill()
      for (let f = 0; f < 4; f++) ctx.fillRect(x - 8 + f * 5, y - 22, 3, 12)
    }
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 110px Arial, sans-serif'
    ctx.fillText('COURT', w * 0.62, h * 0.55)
    ctx.font = 'bold 44px Arial, sans-serif'
    ctx.fillText('HOME OF TEAM ABR', w * 0.62, h * 0.85)
  })

// ---------- Bridgetowne ----------

// Dark grey wall of vertical fins with a thin gold line every few fins (Opus)
export const finTexture = (repeat) =>
  makeTexture('fins', 128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#2b2e32'
    ctx.fillRect(0, 0, w, h)
    for (let x = 0; x < w; x += 16) {
      ctx.fillStyle = '#4f545a'
      ctx.fillRect(x, 0, 7, h)
      ctx.fillStyle = '#1f2124'
      ctx.fillRect(x + 7, 0, 3, h)
    }
    ctx.fillStyle = '#c69a55'
    ctx.fillRect(0, 0, 3, h)
    ctx.fillRect(64, 0, 3, h)
  }, repeat)

// Copper hexagons that stick out like little pyramids (Opus). One tile = 2 hexagons across.
export const hexTexture = (repeat) =>
  makeTexture('hex', 256, 222, (ctx, w, h) => {
    ctx.fillStyle = '#26221f'
    ctx.fillRect(0, 0, w, h)
    const r = h / 3 // corner to middle of one hexagon
    const cw = w / 2 // width of one hexagon
    // each of the 6 sloping faces gets its own shade, lit from the top left
    const shades = ['#e7ab84', '#d39168', '#b97752', '#a5663f', '#bd7b55', '#dc9d75']
    for (let row = -1; row <= 3; row++) {
      for (let col = -1; col <= 2; col++) {
        const cx = col * cw + (((row % 2) + 2) % 2 ? cw / 2 : 0)
        const cy = row * 1.5 * r
        const corner = (k) => {
          const a = (-90 + 60 * k) * (Math.PI / 180)
          return [cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5)]
        }
        for (let k = 0; k < 6; k++) {
          const [ax, ay] = corner(k)
          const [bx, by] = corner(k + 1)
          ctx.fillStyle = shades[k]
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(ax, ay)
          ctx.lineTo(bx, by)
          ctx.closePath()
          ctx.fill()
        }
      }
    }
  }, repeat)

// Glass curtain wall: panels in a grid, each a slightly different shade of sky
export const glassTexture = (repeat) =>
  makeTexture('glass', 128, 128, (ctx, w, h) => {
    const random = rng(21)
    for (let y = 0; y < h; y += 32) {
      for (let x = 0; x < w; x += 32) {
        const v = random()
        const g = ctx.createLinearGradient(x, y, x + 32, y + 32)
        g.addColorStop(0, v < 0.2 ? '#3e4b57' : '#7f95a8')
        g.addColorStop(1, v < 0.2 ? '#56636e' : '#a8bccb')
        ctx.fillStyle = g
        ctx.fillRect(x, y, 32, 32)
      }
    }
    ctx.fillStyle = '#2a3138'
    for (let i = 0; i < w; i += 32) {
      ctx.fillRect(i, 0, 2, h)
      ctx.fillRect(0, i, w, 2)
    }
  }, repeat)

// Black block of thin vertical louvers with a few small dark vents (GBF Center, side street)
export const blackLouverTexture = (repeat) =>
  makeTexture('blackLouver', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#1b1d20'
    ctx.fillRect(0, 0, w, h)
    for (let x = 0; x < w; x += 4) {
      ctx.fillStyle = '#34383d'
      ctx.fillRect(x, 0, 2, h)
    }
    ctx.fillStyle = '#060606'
    ctx.fillRect(10, 20, 4, 4)
    ctx.fillRect(42, 46, 4, 4)
  }, repeat)

// Tower still being built: concrete floor slabs, dark openings, green safety net and a few blue windows.
// One tile = 4 floors.
export const constructionTexture = (repeat) =>
  makeTexture('construction', 256, 128, (ctx, w, h) => {
    const random = rng(33)
    ctx.fillStyle = '#9d988f'
    ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 32) {
      for (let x = 0; x < w; x += 16) {
        const v = random()
        ctx.fillStyle = v < 0.45 ? '#2c2f33' : v < 0.75 ? '#3f8f5c' : v < 0.88 ? '#6fa3cf' : '#bdb7ab'
        ctx.fillRect(x + 2, y + 8, 12, 22)
      }
      ctx.fillStyle = '#c9c4ba'
      ctx.fillRect(0, y, w, 7)
    }
  }, repeat)

// Parking floors under the towers: light grey bands with dark slots
export const podiumTexture = (repeat) =>
  makeTexture('podium', 128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#c4c0b7'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#4b4f54'
    for (let x = 4; x < w; x += 32) ctx.fillRect(x, 20, 24, 30)
  }, repeat)

// Wooden deck boards (riverside walk)
export const deckTexture = (repeat) =>
  makeTexture('deck', 64, 64, (ctx, w, h) => {
    speckle(ctx, w, h, '#6d5a4b', ['#5b4a3d', '#7e6a59'], 300, 41)
    ctx.fillStyle = '#4a3c31'
    for (let x = 0; x < w; x += 8) ctx.fillRect(x, 0, 1, h)
  }, repeat)

// Thin railing bars, see-through between them
export const railBarsTexture = (repeat, color = '#2f2622') =>
  makeTexture(`railBars${color}`, 32, 32, (ctx, w, h) => {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 4, h)
  }, repeat)

// Greenish-brown water of the Pasig River
export const riverTexture = (repeat) =>
  makeTexture('river', 256, 256, (ctx, w, h) => {
    speckle(ctx, w, h, '#4d6258', ['#5e7368', '#41544b', '#6f8578'], 2500, 47)
  }, repeat)

// Blue-grey corrugated fence around the construction site
export const hoardingTexture = (repeat) =>
  makeTexture('hoarding', 32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#3e4c5e'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#566579'
    ctx.fillRect(0, 0, 10, h)
  }, repeat)
