import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SHOW_FOR = 6000 // milliseconds a bubble stays above the head
const LINE_LENGTH = 22 // characters per line before wrapping

// Split a message into short lines so the bubble isn't super wide
function wrap(text) {
  const lines = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > LINE_LENGTH) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, 5)
}

// White speech bubble with a little tail, drawn on a canvas
function makeBubble(text) {
  const lines = wrap(text)
  const longest = Math.max(...lines.map((l) => l.length))
  const w = Math.min(3.6, Math.max(0.9, longest * 0.135 + 0.4))
  const h = lines.length * 0.27 + 0.24
  const scale = 200
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  const tail = 0.08 * scale
  const bodyH = canvas.height - tail
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(2, 2, canvas.width - 4, bodyH - 4, 24)
  ctx.moveTo(canvas.width / 2 - tail, bodyH - 4)
  ctx.lineTo(canvas.width / 2, canvas.height - 2)
  ctx.lineTo(canvas.width / 2 + tail, bodyH - 4)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#1b1b1b'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${0.18 * scale}px Arial, sans-serif`
  const lineH = (bodyH - 8) / lines.length
  lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, 4 + lineH * (i + 0.5)))
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return { texture, w, h }
}

// Shows the latest chat message above a player's head for a few seconds.
// bubble: { text, at } or undefined
export default function SpeechBubble({ bubble, y = 1.75 }) {
  const sprite = useRef()
  const made = useMemo(() => (bubble ? makeBubble(bubble.text) : null), [bubble])
  useEffect(() => () => made?.texture.dispose(), [made])

  useFrame(() => {
    if (sprite.current) sprite.current.visible = performance.now() - bubble.at < SHOW_FOR
  })

  if (!made) return null
  return (
    <sprite ref={sprite} position={[0, y + made.h / 2, 0]} scale={[made.w, made.h, 1]} renderOrder={10}>
      <spriteMaterial map={made.texture} transparent depthTest={false} />
    </sprite>
  )
}
