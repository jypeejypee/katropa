// ============================================================
//  Time of day: noon, afternoon and night.
//  Press T in the game (or the buttons at the top right) to switch.
//  Change the colors and numbers here to make it look the way you like.
// ============================================================
export const TIME_ORDER = ['noon', 'afternoon', 'night']

// Automatic: follows the clock on the player's phone or computer
//   6:00 AM - 2:59 PM = noon (daytime), 3:00 PM - 5:59 PM = afternoon, 6:00 PM - 5:59 AM = night
export function timeFromClock(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 6 && hour < 15) return 'noon'
  if (hour >= 15 && hour < 18) return 'afternoon'
  return 'night'
}

export const TIMES = {
  noon: {
    label: '☀️ Noon',
    sun: [22, 45, 12], // where the sun is, compared to the player (higher y = higher sun)
    sunColor: '#fff3dc',
    sunIntensity: 3.2,
    sky: ['#2f6fc4', '#4f8fd8', '#a9c9ea', '#dbe8f3'], // top ... horizon
    hemiSky: '#cfe4ff', // soft light from the sky
    hemiGround: '#8a7f6a', // soft light bouncing off the ground
    hemi: 1.2,
    fog: '#dbe8f3',
    fogNear: 60,
    fogFar: 170,
    cloudColor: '#ffffff',
    cloudOpacity: 1,
    lamps: 0, // street lights off
    stars: false,
  },
  afternoon: {
    label: '🌇 Afternoon',
    sun: [45, 13, -20], // low sun = long shadows
    sunColor: '#ffb067',
    sunIntensity: 2.6,
    sky: ['#3f6db0', '#7f9fcf', '#f3b47c', '#ffd2a0'],
    hemiSky: '#ffd9b5',
    hemiGround: '#6e5a48',
    hemi: 0.85,
    fog: '#f0c9a2',
    fogNear: 50,
    fogFar: 160,
    cloudColor: '#ffc49a',
    cloudOpacity: 1,
    lamps: 0,
    stars: false,
  },
  night: {
    label: '🌙 Night',
    sun: [-25, 40, 10], // this is the moon now
    sunColor: '#9fb4ff',
    sunIntensity: 0.35,
    sky: ['#03050c', '#070c1c', '#141e38', '#1c2742'],
    hemiSky: '#33405e',
    hemiGround: '#0c0c12',
    hemi: 0.45,
    fog: '#0e1528',
    fogNear: 30,
    fogFar: 130,
    cloudColor: '#4a5470',
    cloudOpacity: 0.5,
    lamps: 60, // street lights on (brightness)
    stars: true,
  },
}
