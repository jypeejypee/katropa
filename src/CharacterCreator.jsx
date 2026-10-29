import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { getGame, setGame } from './game.js'
import { connect } from './network.js'
import { Person } from './Person.jsx'
import { OPTIONS, LABELS, DEFAULT_AVATAR, sanitizeAvatar, randomAvatar } from './avatar.js'

// The tabs of the character creator and which choices are on each
const TABS = [
  { name: 'Katawan', rows: [['build', 'Body'], ['skin', 'Skin']] },
  { name: 'Mukha', rows: [['eyes', 'Eyes'], ['eyeColor', 'Eye color']] },
  { name: 'Buhok', rows: [['hairStyle', 'Hair style'], ['hairColor', 'Hair color']] },
  { name: 'Damit', rows: [['top', 'Top'], ['topColor', 'Top color'], ['bottom', 'Bottom'], ['bottomColor', 'Bottom color']] },
  { name: 'Sapatos', rows: [['shoes', 'Shoes'], ['shoeColor', 'Shoe color'], ['extra', 'Extra']] },
]

// Saved in this browser so you don't have to make your character every time
function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem('street-game-player')) || {}
  } catch {
    return {}
  }
}

// First screen: make your character, type your name and room code
export default function CharacterCreator() {
  const saved = loadSaved()
  const [name, setName] = useState(saved.name ?? '')
  const [room, setRoom] = useState(saved.room ?? 'tnlf')
  const [quality, setQuality] = useState(saved.quality ?? getGame().quality)
  const [avatar, setAvatar] = useState(saved.avatar ? sanitizeAvatar(saved.avatar) : DEFAULT_AVATAR)
  const [tab, setTab] = useState(0)
  const ready = name.trim().length > 0
  const change = (key, value) => setAvatar((a) => ({ ...a, [key]: value }))

  const start = (e) => {
    e.preventDefault()
    if (!ready) return
    const player = { name: name.trim().slice(0, 16), room: room.trim().toLowerCase().slice(0, 20) || 'tnlf', avatar }
    try {
      localStorage.setItem('street-game-player', JSON.stringify({ ...player, quality }))
    } catch {
      // private window: just don't remember it
    }
    setGame({ mode: 'walk', playerName: player.name, room: player.room, quality, avatar })
    connect(player)
  }

  return (
    <div className="start-screen">
      <form className="creator" onSubmit={start}>
        <div className="creator-preview">
          <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.1, 4.1], fov: 34 }}>
            <hemisphereLight args={['#dbeeff', '#6b5a48', 1.3]} />
            <directionalLight position={[2, 3, 4]} intensity={2.2} />
            <PreviewModel avatar={avatar} />
            <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.6}
              target={[0, 0.1, 0]} minPolarAngle={1.2} maxPolarAngle={1.75} />
          </Canvas>
          <button type="button" className="random-button" onClick={() => setAvatar(randomAvatar())}>🎲 Random</button>
        </div>

        <div className="creator-panel">
          <h1>Katropa</h1>
          <p className="tagline">Tambay, laro at kwentuhan kasama ang tropa</p>
          <input className="name-input" value={name} maxLength={16} placeholder="Pangalan mo (your name)"
            onChange={(e) => setName(e.target.value)} />

          <div className="tabs">
            {TABS.map((t, i) => (
              <button key={t.name} type="button" className={i === tab ? 'active' : ''} onClick={() => setTab(i)}>
                {t.name}
              </button>
            ))}
          </div>
          <div className="tab-body">
            {TABS[tab].rows.map(([key, label]) => (
              <ChoiceRow key={key} label={label} values={OPTIONS[key]} value={avatar[key]}
                onPick={(v) => change(key, v)} />
            ))}
          </div>

          <label className="room-label">
            Room code <span className="hint">(same code = same street as your friends)</span>
            <input value={room} maxLength={20} onChange={(e) => setRoom(e.target.value)} />
          </label>
          <div className="quality-row">
            <button type="button" className={quality === 'low' ? 'active' : ''} onClick={() => setQuality('low')}>
              ⚡ Smooth <small>best for phones</small>
            </button>
            <button type="button" className={quality === 'high' ? 'active' : ''} onClick={() => setQuality('high')}>
              ✨ Pretty <small>shadows, lights</small>
            </button>
          </div>
          <button type="submit" className="start-button" disabled={!ready}>
            {ready ? 'Pasok na!' : 'Type your name first'}
          </button>
        </div>
      </form>
    </div>
  )
}

// One row of choices: colors become round swatches, everything else becomes word buttons
function ChoiceRow({ label, values, value, onPick }) {
  const colors = values[0].startsWith('#')
  return (
    <div className="choice-row">
      <div className="choice-label">{label}</div>
      <div className="choice-options">
        {values.map((v) =>
          colors ? (
            <button key={v} type="button" className={v === value ? 'swatch active' : 'swatch'}
              style={{ background: v }} aria-label={`${label} ${v}`} onClick={() => onPick(v)} />
          ) : (
            <button key={v} type="button" className={v === value ? 'chip active' : 'chip'} onClick={() => onPick(v)}>
              {LABELS[v] ?? v}
            </button>
          )
        )}
      </div>
    </div>
  )
}

// The turning character in the preview, gently swinging its arms
function PreviewModel({ avatar }) {
  const limbs = useRef({ legs: [], arms: [] })
  const paddle = useRef()
  useEffect(() => {
    if (paddle.current) paddle.current.visible = false
  })
  useFrame((state) => {
    const t = state.clock.elapsedTime
    limbs.current.arms.forEach((arm, i) => arm && (arm.rotation.x = Math.sin(t * 1.5 + i * Math.PI) * 0.12))
  })
  return (
    <group position={[0, -0.05, 0]}>
      <Person limbs={limbs} avatar={avatar} paddleRef={paddle} />
    </group>
  )
}
