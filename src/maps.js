// The places you can walk around in. Pick one on the start screen.
//   start: where the player appears [x, y, z] (looking toward -z)
//   fog: how much farther you can see than on the normal street (Bridgetowne has tall buildings far away)
//   moon: where the moon is in the night sky [x, y, z] (low, so you can see it without looking up)
//   water: a river the moon shines on (its height, and from where to where along z)
export const MAPS = {
  plaza: {
    label: 'Ang Plaza',
    start: [0, 1.5, 24], // south side of the square, looking at the fountain and the old chapel
    fog: 1.2,
    moon: [-60, 50, -260], // low over the chapel
  },
  tnlf: {
    label: 'Taytay (TNLF)',
    start: [-5.0, 1.5, -7], // left sidewalk, where photo 2 was taken; TNLF and Edson are just ahead
    fog: 1,
    moon: [12, 52, -270], // over the far end of the street
  },
  bridgetowne: {
    label: 'Bridgetowne, Pasig',
    start: [-10.6, 1.5, 53], // GBF Center corner, at the crossing before the bridge, looking toward The Victor
    fog: 1.6,
    moon: [-272, 52, 8], // over the river on the left (west) side of the bridge
    water: { y: -2.6, z: [-28, 28] }, // the Pasig River (the moon shines on it at night)
  },
}

export const MAP_ORDER = ['plaza', 'tnlf', 'bridgetowne']

// Players on different maps never meet, so each map gets its own rooms on the server
// (room "tropa" on Bridgetowne is "bt-tropa" on the server, "pz-tropa" in the Plaza). The server cuts room names at 20 letters.
export function serverRoom(map, room) {
  if (map === 'bridgetowne') return `bt-${room.slice(0, 17)}`
  if (map === 'plaza') return `pz-${room.slice(0, 17)}`
  return room
}
