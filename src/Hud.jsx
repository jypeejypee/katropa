import { useEffect, useRef, useState } from 'react'
import { useGame, getGame, setGame } from './game.js'
import { dialogue, NPC_NAME } from './dialogue.js'
import { playerState, touchInput } from './world.js'
import { TIMES, TIME_ORDER, timeFromClock } from './timeOfDay.js'
import { isTyping, sendChat } from './network.js'
import CharacterCreator from './CharacterCreator.jsx'
import { startVoice, stopVoice, toggleMute } from './voice.js'

function choose(choice) {
  if (choice.action === 'play') setGame({ mode: 'pickleball', dialogue: null, score: [0, 0], message: '' })
  else if (choice.action === 'close') setGame({ mode: 'walk', dialogue: null })
  else setGame({ dialogue: choice.next })
}

// Everything drawn on top of the 3D view
export default function Hud() {
  const game = useGame()
  const line = game.mode === 'talk' ? dialogue[game.dialogue] : null

  // Automatic time of day: check the clock every minute
  useEffect(() => {
    const tick = () => {
      if (getGame().timeAuto && getGame().time !== timeFromClock()) setGame({ time: timeFromClock() })
    }
    const timer = setInterval(tick, 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  // Keyboard: E to talk, 1-4 to pick an answer, Esc to stop talking
  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e)) return
      const { mode, nearNpc, dialogue: node, time } = getGame()
      if (e.code === 'KeyM') toggleMute()
      if (e.code === 'KeyT') setGame({ time: TIME_ORDER[(TIME_ORDER.indexOf(time) + 1) % TIME_ORDER.length], timeAuto: false })
      if (mode === 'walk' && nearNpc && e.code === 'KeyE') setGame({ mode: 'talk', dialogue: 'start' })
      if (mode !== 'talk') return
      const choices = dialogue[node].choices
      const number = Number(e.key)
      if (number >= 1 && number <= choices.length) choose(choices[number - 1])
      if (e.code === 'Escape') setGame({ mode: 'walk', dialogue: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {game.mode === 'start' && <CharacterCreator />}

      {game.mode !== 'start' && <OnlineBadge game={game} />}
      {game.mode !== 'start' && game.online === 'online' && <Chat game={game} />}
      {game.mode !== 'start' && game.online === 'online' && <VoiceControls game={game} />}

      {game.mode === 'walk' && (
        <div className="help">
          WASD / Arrows to walk · Shift to run · Space or J to jump · K to dive · C to sit · Drag mouse to look around · V for first-person · T for time of day
        </div>
      )}

      {game.mode === 'walk' && game.nearNpc && (
        <button className="prompt" tabIndex={-1} onMouseDown={(e) => e.preventDefault()}
          onClick={() => setGame({ mode: 'talk', dialogue: 'start' })}>
          {game.touch ? <>Tap to talk to {NPC_NAME}</> : <>Press <b>E</b> to talk to {NPC_NAME}</>}
        </button>
      )}

      {line && (
        <div className="dialogue">
          <div className="dialogue-name">{NPC_NAME}</div>
          {(game.dialogue === 'won' || game.dialogue === 'lost') && (
            <div className="dialogue-score">
              Final score: Ikaw {game.score[0]} – {game.score[1]} {NPC_NAME}
            </div>
          )}
          <div className="dialogue-text">{line.text}</div>
          <div className="dialogue-choices">
            {line.choices.map((choice, i) => (
              <button
                key={i}
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(choice)}
              >
                <span className="key">{i + 1}</span> {choice.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {game.mode !== 'start' && (
      <div className="time-buttons">
        <button tabIndex={-1} className={game.timeAuto ? 'active' : ''} onMouseDown={(e) => e.preventDefault()}
          onClick={() => setGame({ timeAuto: true, time: timeFromClock() })}>
          {game.touch ? '🕐' : '🕐 Auto'}
        </button>
        {TIME_ORDER.map((name) => (
          <button key={name} tabIndex={-1} className={!game.timeAuto && game.time === name ? 'active' : ''}
            onMouseDown={(e) => e.preventDefault()} onClick={() => setGame({ time: name, timeAuto: false })}>
            {game.touch ? TIMES[name].label.split(' ')[0] : TIMES[name].label}
          </button>
        ))}
      </div>
      )}

      {game.mode !== 'talk' && game.mode !== 'start' && (
        <div className="action-buttons">
          <button tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); playerState.jumpRequest = true }}>
            JUMP<small>J</small>
          </button>
          <button tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); playerState.diveRequest = true }}>
            DIVE<small>K</small>
          </button>
          {game.mode === 'walk' && (
            <button tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); playerState.sitRequest = true }}>
              SIT<small>C</small>
            </button>
          )}
          {game.mode === 'pickleball' && (
            <button className="hit-button" tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); playerState.hitRequest = true }}>
              HIT<small>Space</small>
            </button>
          )}
        </div>
      )}

      {game.touch && game.mode !== 'start' && game.mode !== 'talk' && <Joystick />}
      {game.touch && game.mode !== 'start' && (
        <div className="touch-top-buttons">
          <button tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); playerState.viewRequest = true }}>👁</button>
          {game.mode === 'pickleball' && (
            <button tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); setGame({ mode: 'talk', dialogue: 'quit', message: '' }) }}>
              Stop
            </button>
          )}
        </div>
      )}

      {game.mode === 'pickleball' && (
        <>
          <div className="scoreboard">
            <span>Ikaw</span>
            <b>{game.score[0]}</b>
            <span className="dash">–</span>
            <b>{game.score[1]}</b>
            <span>{NPC_NAME}</span>
          </div>
          {game.message && <div className="game-message">{game.message}</div>}
          <div className="help">
            SPACE to hit · Hold A / D while hitting to aim left / right · W deep · S short · J jump · K dive · Q to stop
          </div>
        </>
      )}
    </>
  )
}

// Small box showing if you're online and who else is here
function OnlineBadge({ game }) {
  const names = game.others.map((o) => (game.voiceUsers.includes(o.id) ? `🎙${o.name}` : o.name))
  return (
    <div className="online-badge">
      <span className={`dot ${game.online}`} />
      {game.online === 'online' ? (
        <span>
          Room <b>{game.room}</b> · {names.length === 0 ? 'Ikaw pa lang dito' : `Kasama mo: ${names.join(', ')}`}
        </span>
      ) : game.online === 'connecting' ? (
        <span>Connecting...</span>
      ) : (
        <span>Offline (solo). Start the server with <b>npm run server</b> to play together.</span>
      )}
    </div>
  )
}

// Chat box: press Enter (or the Chat button) to type, Enter to send, Esc to cancel
function Chat({ game }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const input = useRef()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' || isTyping(e)) return
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  const close = () => {
    setOpen(false)
    setGame({ typing: false })
  }
  const send = (e) => {
    e.preventDefault()
    if (text.trim()) sendChat(text)
    setText('')
    input.current?.blur()
  }

  return (
    <div className="chat">
      <div className="chat-log">
        {game.chat.slice(-6).map((m) => (
          <div key={`${m.id}-${m.at}`} className="chat-line">
            <b style={{ color: m.color }}>{m.name}:</b> {m.text}
          </div>
        ))}
      </div>
      {open ? (
        <form onSubmit={send}>
          <input
            ref={input}
            value={text}
            maxLength={120}
            placeholder="Type a message, Enter to send"
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setGame({ typing: true })}
            onBlur={close}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setText('')
                e.currentTarget.blur()
              }
            }}
          />
        </form>
      ) : (
        <button className="chat-open" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen(true)}>
          💬 Chat <small>(Enter)</small>
        </button>
      )}
    </div>
  )
}

// Voice chat buttons: join / mute / leave
function VoiceControls({ game }) {
  const keep = (e) => e.preventDefault() // don't steal keyboard focus from the game
  return (
    <div className="voice-controls">
      {game.voice === 'on' ? (
        <>
          <button tabIndex={-1} onMouseDown={keep} onClick={toggleMute} className={game.muted ? 'muted' : 'live'}>
            {game.muted ? '🔇 Muted' : '🎙️ Talking'} <small>(M)</small>
          </button>
          <button tabIndex={-1} onMouseDown={keep} onClick={stopVoice}>Leave voice</button>
        </>
      ) : (
        <button tabIndex={-1} onMouseDown={keep} onClick={startVoice} disabled={game.voice === 'starting'}>
          {game.voice === 'starting' ? 'Starting mic...' : '🎙️ Join voice'}
        </button>
      )}
      {game.voice === 'error' && <div className="voice-error">{game.voiceError}</div>}
    </div>
  )
}

// On-screen joystick for phones (bottom left). Push it all the way to run.
function Joystick() {
  const base = useRef()
  const knob = useRef()
  const finger = useRef(null)
  const RADIUS = 50

  const move = (e) => {
    const rect = base.current.getBoundingClientRect()
    let dx = e.clientX - (rect.left + rect.width / 2)
    let dy = e.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy)
    if (length > RADIUS) {
      dx *= RADIUS / length
      dy *= RADIUS / length
    }
    knob.current.style.transform = `translate(${dx}px, ${dy}px)`
    touchInput.x = dx / RADIUS
    touchInput.y = -dy / RADIUS
    touchInput.active = true
  }
  const release = (e) => {
    if (e.pointerId !== finger.current) return
    finger.current = null
    knob.current.style.transform = ''
    touchInput.x = 0
    touchInput.y = 0
    touchInput.active = false
  }

  useEffect(() => () => {
    touchInput.x = 0
    touchInput.y = 0
    touchInput.active = false
  }, [])

  return (
    <div
      ref={base}
      className="joystick"
      onPointerDown={(e) => {
        e.preventDefault()
        finger.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={(e) => e.pointerId === finger.current && move(e)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div ref={knob} className="joystick-knob" />
    </div>
  )
}
