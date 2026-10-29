import { getGame, setGame } from './game.js'

// ============================================================
//  Voice chat. Voices go straight between browsers (WebRTC).
//  The game server only introduces players to each other.
//  Proximity voice: you hear people louder when they're close (see RemotePlayers.jsx).
// ============================================================

// A free public server that helps browsers find each other on the internet
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

let socket = null
let localStream = null // your microphone
const peers = new Map() // other player id -> { pc, audio, pending }

// Called once from network.js when connecting to the game server
export function attachVoice(s) {
  socket = s
  s.on('connect', () => {
    // Reconnected after a network hiccup: join voice again
    if (localStream) s.emit('voice-join')
  })
  s.on('disconnect', () => {
    peers.forEach((_, id) => closePeer(id))
    setGame({ voiceUsers: [] })
  })
  s.on('voice-peers', (ids) => ids.forEach(callPeer))
  s.on('voice-signal', handleSignal)
  s.on('voice-left', closePeer)
  s.on('voice-users', (ids) => setGame({ voiceUsers: ids }))
}

export async function startVoice() {
  if (localStream || !socket?.connected) return
  if (!navigator.mediaDevices?.getUserMedia) {
    setGame({ voice: 'error', voiceError: 'Voice needs a secure page. Use localhost, or npm run dev:lan for friends on Wi-Fi.' })
    return
  }
  setGame({ voice: 'starting', voiceError: '' })
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
  } catch {
    setGame({ voice: 'error', voiceError: 'Microphone blocked. Allow the mic in your browser (the icon in the address bar) and try again.' })
    return
  }
  setGame({ voice: 'on', muted: false })
  socket.emit('voice-join')
}

export function stopVoice() {
  if (!localStream) return
  socket?.emit('voice-leave')
  peers.forEach((_, id) => closePeer(id))
  localStream.getTracks().forEach((track) => track.stop())
  localStream = null
  setGame({ voice: 'off', muted: false })
}

export function toggleMute() {
  if (!localStream) return
  const muted = !getGame().muted
  localStream.getAudioTracks().forEach((track) => (track.enabled = !muted))
  setGame({ muted })
}

// Proximity: RemotePlayers.jsx calls this every frame with a volume from 0 to 1
export function setPeerVolume(id, volume) {
  const peer = peers.get(id)
  if (peer) peer.audio.volume = Math.max(0, Math.min(1, volume))
}

function makePeer(id) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))
  const audio = new Audio()
  audio.autoplay = true
  pc.ontrack = (e) => {
    audio.srcObject = e.streams[0]
    audio.play().catch(() => {})
  }
  pc.onicecandidate = (e) => {
    if (e.candidate) socket.emit('voice-signal', { to: id, candidate: e.candidate })
  }
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') closePeer(id)
  }
  const peer = { pc, audio, pending: [] }
  peers.set(id, peer)
  return peer
}

// Start a call to another player (we're the newcomer)
async function callPeer(id) {
  if (!localStream || peers.has(id)) return
  const { pc } = makePeer(id)
  await pc.setLocalDescription(await pc.createOffer())
  socket.emit('voice-signal', { to: id, description: pc.localDescription })
}

async function handleSignal({ from, description, candidate }) {
  if (!localStream) return // our voice is off
  let peer = peers.get(from)
  try {
    if (description?.type === 'offer') {
      if (!peer) peer = makePeer(from)
      await peer.pc.setRemoteDescription(description)
      await peer.pc.setLocalDescription(await peer.pc.createAnswer())
      socket.emit('voice-signal', { to: from, description: peer.pc.localDescription })
      flushCandidates(peer)
    } else if (description?.type === 'answer' && peer) {
      await peer.pc.setRemoteDescription(description)
      flushCandidates(peer)
    } else if (candidate && peer) {
      // Connection details can arrive before the call is set up: keep them for later
      if (peer.pc.remoteDescription) await peer.pc.addIceCandidate(candidate)
      else peer.pending.push(candidate)
    }
  } catch (err) {
    console.warn('Voice connection problem', err)
  }
}

function flushCandidates(peer) {
  peer.pending.forEach((c) => peer.pc.addIceCandidate(c).catch(() => {}))
  peer.pending = []
}

function closePeer(id) {
  const peer = peers.get(id)
  if (!peer) return
  peer.pc.close()
  peer.audio.srcObject = null
  peers.delete(id)
}
