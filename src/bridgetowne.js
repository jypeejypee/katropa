// ============================================================
//  Bridgetowne (Pasig / Quezon City), from the photos.
//  The main road runs along z, like the Taytay street.
//    -z = Pasig side: The Victor, Opus and GBF Center
//    +z = Quezon City side: the round towers being built, the riverside walk
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
export const START = -175 // Pasig end (past GBF Center)
export const END = 130 // Quezon City end
export const RIVER = [-28, 28] // the bridge goes over the river here
export const HALF_WIDTH = 70 // how far left and right you can walk
export const SIDE_ROAD = [-95, -85] // side street on the left, between The Victor and GBF Center

export const VICTOR = { x: -26, z: -60, height: 48 }

// Double street lights on the median
export const lamps = [-160, -135, -110, -78, -50, -22, 6, 34, 62, 90, 118]
// The two lamp heads on each pole
export const LAMP_ARM = 2.3
export const LAMP_HEIGHT = 9.3

// Royal palms (x, z)
export const palms = [
  // in front of Opus
  ...[-48, -62, -76, -112, -126, -140, -154, -168].map((z) => [13.2, z]),
  // around The Victor
  ...Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + 0.3
    return [VICTOR.x + Math.cos(a) * 12, VICTOR.z + Math.sin(a) * 12]
  }),
]

// Leafy trees (x, z)
export const trees = [
  // riverside walk, QC side
  [-20, 33], [-34, 34], [-52, 33], [-64, 35],
  // lawn on the right, QC side
  [18, 40], [26, 52], [16, 64], [22, 104], [17, 120], [30, 112],
  // in front of GBF Center and along the side street
  [-14, -108], [-14, -124], [-14, -140], [-30, -82], [-46, -82], [-60, -98],
  // beside the walk on the Pasig riverbank
  [56, -34], [64, -36],
]

// Moving cars. x = which lane (+x side drives toward the Pasig side, -z)
export const traffic = [
  { type: 'car', x: LANES[0], z: -40, speed: 7, color: '#eeeeee' },
  { type: 'suv', x: LANES[1], z: 15, speed: 6, color: '#1d1f22' },
  { type: 'motorbike', x: LANES[0], z: 70, speed: 8, color: '#1b1b1b' },
  { type: 'car', x: LANES[1], z: -120, speed: 6, color: '#2bb5b0' },
  { type: 'car', x: -LANES[0], z: -90, speed: 7, color: '#b9bec4' },
  { type: 'van', x: -LANES[1], z: 0, speed: 6, color: '#d7dadd' },
  { type: 'motorbike', x: -LANES[0], z: 95, speed: 8.5, color: '#3a5f9e' },
  { type: 'suv', x: -LANES[1], z: -150, speed: 6.5, color: '#f2f2f2' },
]
