// ============================================================
//  YOUR STREET — edit this file to change how the street looks.
//  Save, and the game updates instantly.
//
//  The road runs straight ahead (along z). You start at z = -7 (where photo 2 was taken),
//  facing toward negative z. Turn around and walk back for photo 1.
//    x negative = LEFT side of the road
//    x positive = RIGHT side of the road
//
//  z 40 to 100  = photo 1 (big trees, tricycles, KALIDAD, Fries Burger, café)
//  z -14 to 40  = left of TNLF: EGB and shops, Margie 2 sari-sari, badminton COURT, white house (NearTNLF.jsx)
//  z -15 to -50 = photo 2 (TNLF; across: Polystar, Cuesociety/KTV house, froyo shop, Reyson Wood)
//                 The pickleball court is on the road in front of New Life Fellowship (see world.js)
// ============================================================

// ---------- BUILDINGS ----------
//  side:        'left' or 'right'
//  z:           where along the street (middle of the building)
//  width:       how wide its front is (along the street)
//  depth:       how deep it goes back (default 8)
//  floors:      1, 2, 3...   (or height: 3.6 for an exact height in meters)
//  wallColor, groundColor (different color for the ground floor), trimColor (lines, roof edge)
//  roof:        'flat' (concrete), 'tin' (rusty yero over the sidewalk), 'hip' (pointed tile roof)
//  roofColor:   color of a 'hip' roof.  gable: true = triangle at the front of the roof
//  front:       ground floor: 'shutter', 'glass', 'gate', 'store' (sari-sari), 'stripes', 'plain'
//  awning:      a color, or { color, style: 'barrel' } for a rounded one
//  sign:        { text, bg, fg }  (optional: width, height, y)
//  balcony:     true, or 'wrap' for a rounded corner
//  pillars:     color of pillars on both sides of the ground floor
//  stairs:      height of a raised step in front (like 0.5).  railing: true = black railing on it
//  pergola:     color of a steel canopy frame in front
//  eave:        { color, depth } thick roof edge sticking out over the sidewalk
//  billboard:   true = empty steel billboard frame on the roof
//  annex:       { floors, color, setback } an extra floor on top, set back from the front
//  ac:          true = aircon unit on the ground floor wall
export const buildings = [
  // ----- LEFT side -----
  // Far end
  { side: 'left', z: 110, width: 10, floors: 2, wallColor: '#e9e4d8', front: 'gate' },
  { side: 'left', z: 101, width: 8, floors: 1, wallColor: '#d6cfc0', roof: 'tin', front: 'shutter' },
  // Photo 1
  { side: 'left', z: 91, width: 9, floors: 1, wallColor: '#a9b8bf', roof: 'tin', front: 'store',
    annex: { floors: 1, color: '#eceae4', setback: 3 } },
  { side: 'left', z: 82.5, width: 7, floors: 1, wallColor: '#d9b27c', roof: 'tin', front: 'shutter', ac: true },
  { side: 'left', z: 77, width: 4, floors: 1, wallColor: '#f2c230', roof: 'tin', front: 'plain',
    sign: { text: 'Yummy\nFRIES BURGER', bg: '#ffe7a3', fg: '#b71c1c', width: 2.4, height: 0.8, y: 2.6 } },
  { side: 'left', z: 71, width: 7, floors: 2, wallColor: '#f3f1ec', front: 'glass', pergola: '#1f1f1f',
    stairs: 0.5, railing: true, sign: { text: "Baker's Café", bg: '#f3f1ec', fg: '#1b1b1b', y: 3.7 } },
  { side: 'left', z: 63, width: 8, floors: 2, wallColor: '#eeeeea', front: 'glass', awning: '#f4f4f4' },
  { side: 'left', z: 54, width: 8, floors: 1, wallColor: '#e2dccf', front: 'shutter', awning: '#d9d4c7' },
  { side: 'left', z: 45, width: 9, floors: 2, wallColor: '#e6dccb', front: 'shutter' },
  // Photo 2
  // (Taytay New Life Fellowship is at z -22, see newLifeFellowship below; its alley runs to z -32)
  { side: 'left', z: -36, width: 8, floors: 3, wallColor: '#ece6da', pillars: '#d48a2c', front: 'glass',
    sign: { text: "Joanne's", bg: '#fff8d0', fg: '#1a237e', width: 2.2 } },
  { side: 'left', z: -44.5, width: 8, floors: 2, wallColor: '#dcd3c4', front: 'store',
    sign: { text: 'TAPSILOGAN', bg: '#ffd23f', fg: '#b71c1c' } },
  { side: 'left', z: -55, width: 13, floors: 1, wallColor: '#cfc8bb', roof: 'tin', front: 'store' },
  { side: 'left', z: -67, width: 12, floors: 2, wallColor: '#e2ddd0', front: 'gate' },
  { side: 'left', z: -79, width: 10, floors: 1, wallColor: '#d8cfc0', roof: 'tin', front: 'shutter' },

  // ----- RIGHT side -----
  // Far end
  { side: 'right', z: 110, width: 10, floors: 2, wallColor: '#f3e3c3', trimColor: '#a0522d', roof: 'hip', front: 'gate' },
  { side: 'right', z: 100, width: 8, floors: 1, wallColor: '#d6d0c4', front: 'shutter' },
  // Photo 1
  { side: 'right', z: 86, width: 12, height: 3.6, wallColor: '#ecebe6', front: 'glass',
    eave: { color: '#2b2c30', depth: 1.8 }, billboard: true, ac: true,
    sign: { text: 'KALIDAD', bg: '#d32f2f', fg: '#ffffff', width: 6, height: 0.9, y: 2.95 } },
  { side: 'right', z: 75, width: 10, floors: 1, wallColor: '#ddd5c5', front: 'shutter',
    sign: { text: 'BIGASAN', bg: '#efe6cf', fg: '#5d4037', width: 2.2, height: 0.5 } },
  { side: 'right', z: 64, width: 10, floors: 2, wallColor: '#f1ece2', front: 'shutter' },
  { side: 'right', z: 53, width: 10, floors: 1, wallColor: '#e0d6c6', roof: 'tin', front: 'store' },
  { side: 'right', z: 43, width: 8, floors: 2, wallColor: '#e6e1d3', front: 'gate' },
  // Across from the EGB shops and the badminton court (side by side, no gaps)
  { side: 'right', z: 34, width: 10, floors: 2, wallColor: '#e8e1d2', front: 'shutter', awning: '#8c4a3a' },
  { side: 'right', z: 24.5, width: 9, floors: 1, wallColor: '#d6d0c4', front: 'shutter' },
  { side: 'right', z: 15, width: 10, floors: 2, wallColor: '#f1e3c8', trimColor: '#a0522d', roof: 'hip', front: 'gate' },
  { side: 'right', z: 5.5, width: 9, floors: 2, wallColor: '#dfe6e9', front: 'shutter', awning: '#3c6e9e' },
  { side: 'right', z: -3.5, width: 9, floors: 1, wallColor: '#e0d6c6', roof: 'tin', front: 'store' },
  // Across from TNLF (from the photos). The yellow-green house with KTV and Cuesociety is in AcrossTNLF.jsx (z -36 to -14)
  { side: 'right', z: -11, width: 6, height: 3.2, wallColor: '#e9e7e1', roof: 'tin', front: 'glass', awning: '#2f6fc4',
    sign: { text: 'POLYSTAR GLASS\n& ALUMINUM INC.', bg: '#ffffff', fg: '#1f4fa8', width: 3.2, height: 0.9, y: 1.0 } },
  { side: 'right', z: -39, width: 6, height: 3.4, wallColor: '#e8e2d2', pillars: '#f3eee3', front: 'glass', stairs: 0.6,
    awning: '#2e8b57', sign: { text: 'FROZEN YOGURT · CROFFLES · SMOOTHIES', bg: '#efe9dc', fg: '#7a6a55', width: 4.6, height: 0.32, y: 3.05 } },
  { side: 'right', z: -45.25, width: 6.5, height: 3.2, wallColor: '#5f7f86', front: 'stripes',
    sign: { text: 'REYSON WOOD\nEnterprises Co.\nDealer of Good Lumber', bg: '#ffffff', fg: '#263238', width: 3, height: 1.0, y: 2.55 } },
  { side: 'right', z: -55, width: 13, floors: 2, wallColor: '#e8d9c0', trimColor: '#8c4a3a', roof: 'hip',
    roofColor: '#9a4b3a', front: 'shutter', awning: '#3c6e9e' },
  { side: 'right', z: -67, width: 12, floors: 2, wallColor: '#ecdcb0', trimColor: '#8b4a3c', roof: 'hip', front: 'gate' },
  { side: 'right', z: -79, width: 10, floors: 1, wallColor: '#d6d0c4', roof: 'tin', front: 'store' },
]

// ---------- TAYTAY NEW LIFE FELLOWSHIP ----------  (built in NewLifeFellowship.jsx, left side)
export const newLifeFellowship = { z: -22 }
// The shops, sari-sari store and badminton court to the left of TNLF are in NearTNLF.jsx

// ---------- TREES ----------  lean: 1 = spreads over the road from the left, -1 from the right
export const trees = [
  { position: [-5.2, 0, 120], lean: 1 },
  { position: [-5.2, 0, 94], lean: 1, scale: 1.2 },
  { position: [-5.2, 0, 79.5], lean: 1, scale: 1.25 },
  { position: [-5.2, 0, 66], lean: 1, scale: 1.15 },
  { position: [-5.2, 0, 52], lean: 1, scale: 1.1 },
  { position: [5.3, 0, 57], lean: -1, scale: 1.1 },
  { position: [5.3, 0, 47], lean: -1 },
  { position: [5.3, 0, -84], lean: -1 },
  { position: [-5.2, 0, -84], lean: 1 },
  { position: [-5.6, 0, 21], lean: 1, scale: 0.9 }, // tree in the lot in front of the badminton COURT
]

// ---------- ELECTRIC POSTS ----------
// Each line is a row of posts. The last post of a line is wired to the first post of the next one.
export const powerLines = [
  // Left side: photo 1, then in front of the badminton court and the EGB shops
  { poles: [{ x: -4.6, z: 124 }, { x: -4.6, z: 100 }, { x: -4.6, z: 74, transformer: true }, { x: -4.6, z: 50 }, { x: -4.6, z: 26 }, { x: -4.6, z: 2 }] },
  // Right side, photo 2: the big bundle of wires along the yellow-green house
  { poles: [{ x: 4.7, z: -16 }, { x: 4.7, z: -46, transformer: true }, { x: 4.7, z: -76 }], bundle: 15, bundleY: 4.8 },
]

// ---------- STREET LIGHTS ----------  solar: false = no solar panel
export const streetLamps = [
  { x: 4.7, z: 87.5 },
  { x: 4.7, z: 62 },
  // Lights for the pickleball court in front of TNLF at night
  { x: 4.7, z: -27 },
  { x: 4.7, z: -16, solar: false }, // on the electric post in front of Cuesociety
  { x: -5.9, z: -24.4, solar: false }, // on the pink-and-green post in front of TNLF
  { x: -4.6, z: -58, solar: false },
]

// ---------- SIGNS ----------  rotation: 0 = faces you at the start, -Math.PI/2 = on a right-side wall
export const signs = [
  // Tall KALIDAD sign standing on the sidewalk
  { position: [5.4, 2.0, 84], size: [0.8, 3], text: 'KALIDAD', bg: '#2a1d24', fg: '#ffffff', vertical: true, posts: true },
  // Banners on the yellow-green house
  // Yellow TAKOYAKI sign next to the alley of New Life Fellowship
  // Posters at the froyo shop
  { position: [6.4, 1.4, -37.3], rotation: -Math.PI / 2, size: [0.7, 1.1], text: 'PRINT\nXEROX\nSCAN', bg: '#1565c0', fg: '#ffffff' },
  { position: [-5.3, 1.5, -33.5], size: [0.45, 2.0], text: 'TAKOYAKI', bg: '#ffd23f', fg: '#1b1b1b', vertical: true, posts: true },
]

// ---------- PLANTS AND SMALL THINGS ----------
export const planters = [
  // In front of New Life Fellowship, on both sides of the garage: bamboo, and bushes with a grey railing
  { position: [-5.95, 0.1, -17.3], length: 5, plants: 'bamboo', railColor: '#8f918c', color: '#c4a46a', soil: '#8c8780' },
  { position: [-5.95, 0.1, -27.05], length: 4.5, plants: 'shrubs', railColor: '#8f918c', color: '#c4a46a', soil: '#8c8780' },
  // Low planter with bushes in front of KALIDAD (photo 1)
  { position: [5.95, 0.1, 81.5], length: 3.5, height: 0.5, railing: false, plants: 'shrubs', color: '#b9b2a6' },
]
export const pottedPlants = [
  { position: [6.0, 0.1, 88.5], size: 1.2 },
  { position: [-6.0, 0.1, 59] },
  { position: [6.0, 0.1, -36], size: 0.8 },
]
export const pipeFrames = [{ position: [-5.9, 0.1, 81.5], width: 4 }]
export const buckets = [{ position: [4.75, 0.1, 81] }]

// ---------- PARKED VEHICLES ----------  type: 'tricycle', 'jeep', 'van', 'truck', 'motorbike'
// rotation: 0 = facing toward you at the start, Math.PI = facing away
export const parkedVehicles = [
  { type: 'jeep', position: [-3.3, 0, 88.5], rotation: 0 },
  { type: 'motorbike', position: [-3.7, 0, 85.6], rotation: 0.3, color: '#1e3a8a' },
  { type: 'motorbike', position: [-3.7, 0, 84.4], rotation: 0.3, color: '#b71c1c' },
  { type: 'tricycle', position: [-3.3, 0, 80], rotation: 0, color: '#3b3b3b', plate: '214' },
  { type: 'tricycle', position: [3.3, 0, 69], rotation: Math.PI, color: '#2f7d3a', plate: '118' },
  { type: 'tricycle', position: [3.3, 0, 65.5], rotation: Math.PI, color: '#5d4037', plate: '163' },
  { type: 'van', position: [3.3, 0, -38], rotation: 0 },
]

// ---------- TRAFFIC (moving) ----------
// lane 'right' drives away from you (toward -z), 'left' comes toward you. speed in meters/second.
export const traffic = [
  // Light traffic: just a few. Add more lines here if you want a busier street.
  { type: 'tricycle', lane: 'right', z: 88, speed: 4.5, color: '#7b4a2e', plate: '037' },
  { type: 'tricycle', lane: 'right', z: -20, speed: 5, color: '#2d5fa8', plate: '451' },
  { type: 'truck', lane: 'left', z: -60, speed: 4.5, color: '#2e9e48' },
  { type: 'tricycle', lane: 'left', z: 50, speed: 5, color: '#e0b21c', plate: '319' },
]
