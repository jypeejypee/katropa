import { useSyncExternalStore } from 'react'
import { DEFAULT_AVATAR } from './avatar.js'
import { timeFromClock } from './timeOfDay.js'

// The game "mode" and what the screen should show.
//   mode: 'start' (typing your name), 'walk' (walking around), 'talk' (talking to Edson), 'pickleball' (playing)
// Phones and tablets get the joystick, touch buttons and lighter graphics.
// Add ?touch to the address (like localhost:5173/?touch) to try the phone layout on a laptop.
const isTouch = typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || new URLSearchParams(location.search).has('touch'))

let state = {
  touch: isTouch,
  // 'low' = Smooth (no shadows, fewer lights; best for phones), 'high' = Pretty
  quality: isTouch ? 'low' : 'high',
  mode: 'start',
  nearNpc: false,
  dialogue: null, // which line of dialogue.js is showing
  score: [0, 0], // [you, Edson]
  message: '',
  time: timeFromClock(), // 'noon', 'afternoon' or 'night' (see timeOfDay.js)
  timeSetting: 'auto', // 'auto' follows the real clock; only the admin can change it (for the whole room)
  admin: false, // true for jaypee with the right admin code (checked by the server)
  myId: null,
  pb: null, // 2-player pickleball game in this room (from the server)
  watching: false, // watching someone else's game from beside the court
  toast: null, // { text, at } short message at the top of the screen
  playerName: '',
  avatar: DEFAULT_AVATAR, // your character's look (see avatar.js)
  room: 'tnlf',
  map: 'tnlf', // which place you walk around in: 'tnlf' or 'bridgetowne' (see maps.js)
  online: 'offline', // 'connecting', 'online' or 'offline'
  others: [], // other players in the room: [{ id, name, color }]
  chat: [], // last chat messages: [{ id, name, color, text, at }]
  bubbles: {}, // speech bubbles: { playerId (or 'me'): { text, at } }
  typing: false, // true while typing a chat message (so the player doesn't walk)
  voice: 'off', // 'off', 'starting', 'on' or 'error'
  voiceError: '',
  muted: false,
  voiceUsers: [], // ids of players in voice chat (for the 🎙 icons)
}
const listeners = new Set()

export const getGame = () => state

export function setGame(changes) {
  state = { ...state, ...changes }
  listeners.forEach((listener) => listener())
}

// Lets React parts of the screen (Hud.jsx) update when the game changes
export function useGame() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state
  )
}
