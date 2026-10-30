// ============================================================
//  Bridgetowne, Pasig, from the photos.
//  The main road runs along z, like the Taytay street. You start at the +z end and walk toward -z:
//    +z (before the bridge): Opus on the right, GBF Center on the left
//    -z (after the bridge): The Victor on the right, the round towers being built on the left
//       (with the riverside walk in front of them)
//  The bridge crosses the Pasig River in the middle (z -28 to 28).
//  All numbers are in meters.
// ============================================================

// Across the road (x): median, 2 lanes each way, bike lane, sidewalk, railing
export const MEDIAN = 1.0 // half width of the middle island
export const LANES = [2.8, 6.0] // middle of the inner and outer lanes
export const CAR_EDGE = 7.6 // where the car lanes end and the bike lane starts
export const BIKE_EDGE = 9.2 // where the bike lane ends and the sidewalk starts
export const WALK_EDGE = 12 // outer edge of the sidewalk (railing on the bridge)

// Along the road (z)
export const START = -135 // the end past The Victor and the towers
export const END = 175 // the end past Opus and GBF Center (where you start)
export const RIVER = [-28, 28] // the bridge goes over the river here
export const HALF_WIDTH = 70 // how far left and right you can walk
export const SIDE_ROAD = [95, 105] // side street on the left, across from the Opus drive-through, next to GBF Center

export const VICTOR = { x: 28, z: -60, height: 48 } // right side, just past the bridge

// Double street lights on the median
export const lamps = [-118, -90, -62, -34, -6, 22, 50, 78, 106, 134, 162]
// The two lamp heads on each pole
export const LAMP_ARM = 2.3
export const LAMP_HEIGHT = 9.3

// Royal palms (x, z)
export const palms = [
  // in front of Opus
  ...[50, 62, 74, 86, 114, 126, 138, 150].map((z) => [13.2, z]),
  // around The Victor
  ...Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + 0.3
    return [VICTOR.x + Math.cos(a) * 12, VICTOR.z + Math.sin(a) * 12]
  }),
]

// Leafy trees (x, z)
export const trees = [
  // riverside walk in front of the towers being built
  [-20, -33], [-34, -34], [-52, -33], [-64, -35],
  // past The Victor on the right
  [18, -96], [18, -116], [56, -34], [64, -36],
  // little park on the left before the bridge
  [-20, 46], [-34, 58], [-22, 74], [-46, 70], [-58, 52], [-30, 88],
  // in front of GBF Center and along the side street
  [-14, 124], [-14, 140], [-14, 156], [-30, 91], [-46, 91], [-60, 110],
]

// Moving cars. x = which lane (+x side drives toward The Victor, -z)
export const traffic = [
  { type: 'car', x: LANES[0], z: -40, speed: 7, color: '#eeeeee' },
  { type: 'suv', x: LANES[1], z: 15, speed: 6, color: '#1d1f22' },
  { type: 'motorbike', x: LANES[0], z: 70, speed: 8, color: '#1b1b1b' },
  { type: 'car', x: LANES[1], z: 140, speed: 6, color: '#2bb5b0' },
  { type: 'car', x: -LANES[0], z: -90, speed: 7, color: '#b9bec4' },
  { type: 'van', x: -LANES[1], z: 0, speed: 6, color: '#d7dadd' },
  { type: 'motorbike', x: -LANES[0], z: 95, speed: 8.5, color: '#3a5f9e' },
  { type: 'suv', x: -LANES[1], z: 160, speed: 6.5, color: '#f2f2f2' },
]
