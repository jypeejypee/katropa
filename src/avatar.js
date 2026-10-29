// ============================================================
//  Character creator: every choice a player can make.
//  Used by the game AND the multiplayer server (so it checks what others send).
//  Add a color to a list and it shows up on the start screen.
// ============================================================

export const SKIN_TONES = ['#f1c7a5', '#e0ac7e', '#c68a5e', '#b07a52', '#8d5a3b', '#5f3b26']
export const HAIR_COLORS = ['#1a1410', '#3b2416', '#6b4423', '#a0703f', '#c99a4b', '#8e3b1f', '#e8e2d6', '#2f5fbf', '#e05a9a']
export const EYE_COLORS = ['#3b2416', '#24160c', '#3b6fb6', '#3f8a4f', '#7a6a3a']
export const CLOTH_COLORS = [
  '#5b9bd5', '#457b9d', '#1f3a5f', '#34425f', '#2a9d8f', '#2e7d32', '#4a5a3c', '#e8b84a', '#ffb703',
  '#f4a261', '#e63946', '#ff6fa8', '#8e44ad', '#f4f4f4', '#9e9e9e', '#222222', '#7a4a2a', '#c9b28a',
]

export const OPTIONS = {
  gender: ['male', 'female'],
  build: ['slim', 'average', 'chubby'],
  skin: SKIN_TONES,
  eyes: ['round', 'happy', 'sleepy', 'cool'],
  eyeColor: EYE_COLORS,
  hairStyle: ['short', 'sidepart', 'curly', 'spiky', 'bob', 'long', 'ponytail', 'bun', 'bald'],
  hairColor: HAIR_COLORS,
  top: ['longsleeve', 'polo', 'tshirt', 'blouse', 'hoodie', 'tank'],
  topColor: CLOTH_COLORS,
  bottom: ['pants', 'shorts', 'skirt'],
  bottomColor: CLOTH_COLORS,
  shoes: ['leather', 'sneakers', 'flats', 'boots', 'tsinelas'],
  shoeColor: CLOTH_COLORS,
  extra: ['none', 'watch', 'glasses', 'cap'],
}

// Names shown on the buttons
export const LABELS = {
  male: 'Lalaki', female: 'Babae',
  slim: 'Slim', average: 'Average', chubby: 'Chubby',
  round: 'Round', happy: 'Happy', sleepy: 'Sleepy', cool: 'Shades',
  short: 'Short', sidepart: 'Side part', curly: 'Curly', spiky: 'Spiky', bob: 'Bob', long: 'Long',
  ponytail: 'Ponytail', bun: 'Bun', bald: 'Bald',
  longsleeve: 'Long sleeve', polo: 'Polo', tshirt: 'T-shirt', blouse: 'Blouse', hoodie: 'Hoodie', tank: 'Sando',
  pants: 'Pants', shorts: 'Shorts', skirt: 'Skirt',
  leather: 'Leather shoes', sneakers: 'Sneakers', flats: 'Flats', boots: 'Boots', tsinelas: 'Tsinelas',
  none: 'None', watch: 'Watch', glasses: 'Glasses', cap: 'Cap',
}

// Picking Lalaki or Babae starts from one of these looks (you can change everything after)
export const GENDER_PRESETS = {
  male: {
    gender: 'male', hairStyle: 'sidepart', top: 'longsleeve', topColor: '#5b9bd5',
    bottom: 'pants', bottomColor: '#4a5a3c', shoes: 'leather', shoeColor: '#7a4a2a',
  },
  female: {
    gender: 'female', hairStyle: 'bob', top: 'blouse', topColor: '#e8b84a',
    bottom: 'pants', bottomColor: '#1f3a5f', shoes: 'flats', shoeColor: '#222222',
  },
}

export const DEFAULT_AVATAR = {
  build: 'average', skin: '#e0ac7e',
  eyes: 'round', eyeColor: '#3b2416',
  hairColor: '#3b2416',
  extra: 'none',
  ...GENDER_PRESETS.male,
}

// Edson's look
export const EDSON_AVATAR = {
  gender: 'male', build: 'chubby', skin: '#b07a52',
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
  const gender = pick(OPTIONS.gender)
  const female = gender === 'female'
  const avatar = {}
  for (const [key, allowed] of Object.entries(OPTIONS)) avatar[key] = pick(allowed)
  avatar.gender = gender
  // Mostly typical choices for each, so random looks are nice
  avatar.hairStyle = pick(female ? ['bob', 'long', 'ponytail', 'bun', 'curly'] : ['short', 'sidepart', 'curly', 'spiky', 'bald'])
  avatar.top = pick(female ? ['blouse', 'tshirt', 'polo', 'hoodie', 'longsleeve'] : ['longsleeve', 'polo', 'tshirt', 'hoodie', 'tank'])
  avatar.bottom = pick(female ? ['pants', 'skirt', 'shorts'] : ['pants', 'pants', 'shorts'])
  avatar.shoes = pick(female ? ['flats', 'sneakers', 'boots', 'tsinelas'] : ['leather', 'sneakers', 'boots', 'tsinelas'])
  if (Math.random() < 0.8) avatar.hairColor = pick(HAIR_COLORS.slice(0, 6))
  if (avatar.eyes === 'cool' && Math.random() < 0.6) avatar.eyes = 'round'
  if (avatar.extra === 'cap' && Math.random() < 0.5) avatar.extra = 'none'
  return avatar
}
