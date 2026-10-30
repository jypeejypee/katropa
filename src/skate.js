// ============================================================
//  Andrew and the skatepark at Bridgetowne
//  (on the right after the bridge, between The Victor and the river).
//  Edit what Andrew says, and how the skateboard feels!
//
//  Each choice either goes to another line ("next") or does something ("action"):
//    action: 'skate' -> borrow Andrew's board and skate
//    action: 'close' -> stop talking
//  text can also be a function of the game, to say something about your score.
// ============================================================

export const ANDREW_NAME = 'Andrew'
export const ANDREW_HOME = [17, 0, -40] // at the corner of the skatepark, next to the sidewalk

export const ANDREW_AVATAR = {
  model: 'custom',
  gender: 'male', build: 'slim', skin: '#c68a5e',
  eyes: 'cool', eyeColor: '#24160c',
  hairStyle: 'spiky', hairColor: '#1a1410',
  top: 'hoodie', topColor: '#e63946',
  bottom: 'shorts', bottomColor: '#222222',
  shoes: 'sneakers', shoeColor: '#f4f4f4',
  extra: 'cap',
}

// The skatepark: where the smooth concrete is (x from..to, z from..to)
export const PARK = { x: [15, 45], z: [-43, -29.5] }

// How the board feels
export const SKATE = {
  push: 8, // top speed when pushing (meters per second)
  fast: 11, // top speed when holding Shift (or the joystick all the way)
  accel: 5, // how fast you speed up
  turn: 2.6, // how fast you can turn
  coast: 0.25, // how fast you slow down when you stop pushing
  ollie: 5.2, // how hard you pop an ollie
  flipTime: 0.45, // seconds for one kickflip
}

// Points for landing tricks
export const POINTS = { ollie: 10, kickflip: 50, air: 25 }

export const andrewDialogue = {
  start: {
    text: (game) => game.skateBest > 0
      ? `Uy, balik ka! ${game.skateBest} points yung best mo kanina, astig! Isa pa?`
      : 'Uy pre! Ako si Andrew. Dito ako lagi nag-i-skate, tabi ng ilog at ni Victor. Gusto mo subukan board ko?',
    choices: [
      { label: 'Sige, pahiram ng board!', action: 'skate' },
      { label: 'Paano ba mag-skate?', next: 'howto' },
      { label: 'Sino yung higante dun?', next: 'victor' },
      { label: 'Mamaya na lang, pre.', next: 'bye' },
    ],
  },
  howto: {
    text: (game) => game.touch
      ? 'Madali lang! Joystick para tumulak at lumiko, itulak nang buo para bumilis. OLLIE para tumalon. FLIP para mag-kickflip, dapat tapos ang ikot bago lumapag! Dumaan ka sa mga ramp para lumipad. Stop para ibalik ang board.'
      : 'Madali lang! W para tumulak, A o D para lumiko, Shift para bumilis. SPACE para mag-ollie. K para mag-kickflip, dapat tapos ang ikot bago lumapag! Dumaan ka sa mga ramp para lumipad. Q para ibalik ang board.',
    choices: [
      { label: 'Gets! Pahiram na!', action: 'skate' },
      { label: 'Mamaya na lang.', next: 'bye' },
    ],
  },
  victor: {
    text: 'Si The Victor yan! Mas matangkad pa daw sa Statue of Liberty. Pag gabi, umiilaw pa yan. Ang ganda mag-skate dito pag gabi.',
    choices: [
      { label: 'Skate tayo!', action: 'skate' },
      { label: 'Sige, bye!', next: 'bye' },
    ],
  },
  bye: {
    text: 'Sige pre, nandito lang ako sa skatepark. Balik ka ha!',
    choices: [{ label: 'Sige!', action: 'close' }],
  },
}
