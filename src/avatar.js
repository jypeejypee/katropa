// ============================================================
//  Character creator: every choice a player can make.
//  Used by the game AND the multiplayer server (so it checks what others send).
//  Add a color to a list and it shows up on the start screen.
// ============================================================

export const SKIN_TONES = ['#f1c7a5', '#e0ac7e', '#c68a5e', '#b07a52', '#8d5a3b', '#5f3b26']
export const HAIR_COLORS = ['#1a1410', '#3b2416', '#6b4423', '#c99a4b', '#8e3b1f', '#e8e2d6', '#2f5fbf', '#e05a9a']
export const EYE_COLORS = ['#24160c', '#4a2c17', '#3b6fb6', '#3f8a4f', '#7a6a3a']
export const CLOTH_COLORS = [
  '#e63946', '#f4a261', '#ffb703', '#2e7d32', '#2a9d8f', '#457b9d',
  '#34425f', '#8e44ad', '#ff6fa8', '#f4f4f4', '#9e9e9e', '#222222', '#a0522d', '#c9b28a',
]

export const OPTIONS = {
  build: ['slim', 'average', 'chubby'],
  skin: SKIN_TONES,
  eyes: ['round', 'happy', 'sleepy', 'cool'],
  eyeColor: EYE_COLORS,
  hairStyle: ['short', 'curly', 'spiky', 'long', 'ponytail', 'bun', 'bald'],
  hairColor: HAIR_COLORS,
  top: ['tshirt', 'polo', 'tank', 'hoodie'],
  topColor: CLOTH_COLORS,
  bottom: ['shorts', 'pants'],
  bottomColor: CLOTH_COLORS,
  shoes: ['sneakers', 'tsinelas', 'boots'],
  shoeColor: CLOTH_COLORS,
  extra: ['none', 'watch', 'cap'],
}

// Names shown on the buttons
export const LABELS = {
  slim: 'Slim', average: 'Average', chubby: 'Chubby',
  round: 'Round', happy: 'Happy', sleepy: 'Sleepy', cool: 'Shades',
  short: 'Short', curly: 'Curly', spiky: 'Spiky', long: 'Long', ponytail: 'Ponytail', bun: 'Bun', bald: 'Bald',
  tshirt: 'T-shirt', polo: 'Polo', tank: 'Sando', hoodie: 'Hoodie',
  shorts: 'Shorts', pants: 'Pants',
  sneakers: 'Sneakers', tsinelas: 'Tsinelas', boots: 'Boots',
  none: 'None', watch: 'Watch', cap: 'Cap',
}

export const DEFAULT_AVATAR = {
  build: 'average', skin: '#c68a5e',
  eyes: 'round', eyeColor: '#24160c',
  hairStyle: 'short', hairColor: '#1a1410',
  top: 'tshirt', topColor: '#e63946',
  bottom: 'shorts', bottomColor: '#34425f',
  shoes: 'sneakers', shoeColor: '#f4f4f4',
  extra: 'none',
}

// Edson's look
export const EDSON_AVATAR = {
  build: 'chubby', skin: '#b07a52',
  eyes: 'round', eyeColor: '#24160c',
  hairStyle: 'curly', hairColor: '#1a1410',
  top: 'polo', topColor: '#2a9d8f',
  bottom: 'pants', bottomColor: '#34425f',
  shoes: 'sneakers', shoeColor: '#f4f4f4',
  extra: 'watch',
}

// Keep only allowed choices (anything unknown becomes the default)
export function sanitizeAvatar(avatar) {
  const clean = {}
  for (const [key, allowed] of Object.entries(OPTIONS)) {
    clean[key] = allowed.includes(avatar?.[key]) ? avatar[key] : DEFAULT_AVATAR[key]
  }
  return clean
}

export function randomAvatar() {
  const pick = (list) => list[Math.floor(Math.random() * list.length)]
  const avatar = {}
  for (const [key, allowed] of Object.entries(OPTIONS)) avatar[key] = pick(allowed)
  // Less wild: mostly natural hair colors, and not too many sunglasses
  if (Math.random() < 0.75) avatar.hairColor = pick(HAIR_COLORS.slice(0, 5))
  if (avatar.eyes === 'cool' && Math.random() < 0.5) avatar.eyes = 'round'
  return avatar
}
