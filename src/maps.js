// The places you can walk around in. Pick one on the start screen.
//   start: where the player appears [x, y, z] (looking toward -z)
//   fog: how much farther you can see than on the normal street (Bridgetowne has tall buildings far away)
//   moon: where the moon is in the night sky [x, y, z] (low, so you can see it without looking up)
export const MAPS = {
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
    moon: [272, 52, -45], // over the river, behind the big coil arch on the right side of the bridge
  },
}

export const MAP_ORDER = ['tnlf', 'bridgetowne']

// Players on different maps never meet, so each map gets its own rooms on the server
// (room "tropa" on Bridgetowne is "bt-tropa" on the server). The server cuts room names at 20 letters.
export function serverRoom(map, room) {
  return map === 'bridgetowne' ? `bt-${room.slice(0, 17)}` : room
}
