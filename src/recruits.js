// ============================================================
//  108 Katropa: the people you can bring to the Plaza.
//
//  You're new in the city. The old town plaza is empty and quiet.
//  Find people in other places and win them over; each one who joins
//  opens something in the Plaza (a stall, a cart, a skate corner...).
//
//  Two kinds of progress:
//    - your own katropa list (saved in this browser): who YOU have recruited
//    - the Plaza itself is shared by everyone online: once anyone brings
//      Aling Nena, her store is open for all players
//
//  Three ways to recruit (like Suikoden's 108 Stars):
//    help:   do something for them (Aling Nena's lost bayong)
//    beat:   win at their thing (Andrew: 150 points in one skate run)
//    hidden: find them at the right time and place (Kuya Jun, only at night)
// ============================================================
import { getGame, setGame } from './game.js'

export const TOTAL_KATROPA = 108

// Who can be recruited. stall = what opens in the Plaza when they join.
export const RECRUITS = {
  nena: {
    name: 'Aling Nena', role: 'Tindera', how: 'help', where: 'Taytay',
    stall: 'Sari-sari ni Aling Nena',
    hint: 'May tindera daw sa Taytay, malapit sa sari-sari store sa tabi ng TNLF. Parang may problema siya.',
  },
  andrew: {
    name: 'Andrew', role: 'Skater', how: 'beat', where: 'Bridgetowne',
    stall: 'Skate corner ni Andrew',
    hint: 'Si Andrew, yung skater sa Bridgetowne, malapit sa ilog. Hamunin mo daw sa skateboard.',
  },
  jun: {
    name: 'Kuya Jun', role: 'Kwek-kwek vendor', how: 'hidden', where: 'Bridgetowne',
    stall: 'Kwek-kwek cart ni Kuya Jun',
    hint: 'May nagtitinda daw ng kwek-kwek sa Bridgetowne... pero pag gabi lang, sa may ilog bago tumawid ng tulay.',
  },
}
export const RECRUIT_ORDER = ['nena', 'andrew', 'jun']

// The score Andrew wants to see in one run before he joins
export const ANDREW_CHALLENGE = 150

// ---------- Your own katropa list (this browser) ----------
const SAVE_KEY = 'street-game-katropa'
export function loadRecruited() {
  try {
    const list = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '[]')
    return Array.isArray(list) ? list.filter((id) => RECRUITS[id]) : []
  } catch {
    return []
  }
}

// Called when someone joins your katropa. sendRecruit tells the server (so the Plaza opens for everyone).
let sendRecruit = () => {}
export function onRecruit(send) {
  sendRecruit = send
}
export function recruit(id) {
  const { recruited, plaza } = getGame()
  if (recruited.includes(id)) return
  const next = [...recruited, id]
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(next))
  } catch {
    // private window: only for this visit
  }
  setGame({
    recruited: next,
    plaza: plaza.includes(id) ? plaza : [...plaza, id], // offline: at least your own Plaza opens
    toast: { text: `${RECRUITS[id].name} joined your katropa! Bukas na sa Plaza: ${RECRUITS[id].stall}`, at: Date.now() },
  })
  sendRecruit(id)
}

// ---------- What they say ----------
// Same shape as dialogue.js. Actions: 'close', 'recruit:<id>', 'quest:<id>'.
// text and choices can be functions of the game (they change as you make progress).

// Lolo Ben, the old caretaker of the Plaza: tells the story and gives hints
export const benDialogue = {
  start: {
    text: (game) => game.plaza.length === 0
      ? 'Ah, bago ka dito? Ako si Lolo Ben, ako ang nagbabantay sa plaza. Noong araw, ang saya dito... may tindahan, may kainan, may naglalaro. Ngayon, tahimik na. Wala nang pumupunta.'
      : `Tingnan mo, iho/iha! ${game.plaza.length} na ang bukas dito sa plaza. Unti-unti, bumabalik ang buhay. Salamat sa inyong lahat.`,
    choices: [
      { label: 'Paano ko po ito bubuhayin?', next: 'how' },
      { label: 'Sino po ang pwede kong hanapin?', next: 'hints' },
      { label: 'Sige po, Lolo.', action: 'close' },
    ],
  },
  how: {
    text: 'Maghanap ka ng mga tao sa ibang lugar, sa Taytay, sa Bridgetowne. Tulungan mo sila, o talunin sa hilig nila. Pag naging katropa mo sila, babalik sila dito at magbubukas ng pwesto. Hindi lang ikaw, lahat ng dumadaan dito, tumutulong. Isang daan at walo daw ang kailangan para tuluyang mabuhay ulit ang plaza.',
    choices: [
      { label: 'Sino po ang pwede kong hanapin?', next: 'hints' },
      { label: 'Kaya ko \'yan!', action: 'close' },
    ],
  },
  hints: {
    text: (game) => {
      const left = RECRUIT_ORDER.filter((id) => !game.recruited.includes(id))
      if (left.length === 0) return 'Nakuha mo na lahat ng alam ko! Pero marami pa daw sa labas... balik ka pag may bagong lugar na.'
      return RECRUITS[left[0]].hint
    },
    choices: [
      { label: 'Salamat po!', action: 'close' },
    ],
  },
}

// Aling Nena (Taytay): lost her bayong of supplies down the street. Bring it back.
// nenaQuest: undefined (not asked yet) -> 'looking' -> 'found'
export const nenaDialogue = {
  start: {
    text: (game) => {
      if (game.recruited.includes('nena')) return 'Uy, ikaw pala! Bukas na ang tindahan ko sa plaza. Dalaw ka doon ha, may pa-libreng kendi ako sa mga suki.'
      if (game.nenaQuest === 'found') return 'Ay! Yan ang bayong ko! Andiyan pa ang sardinas, kape, at asukal! Salamat, salamat!'
      if (game.nenaQuest === 'looking') return 'Nahanap mo na ba? Sa dulo ng kalye daw nahulog, sabi ng tricycle driver, sa kabila banda malapit sa KALIDAD.'
      return 'Hay naku... Nahulog ang bayong ko ng paninda pauwi. Sardinas, kape, asukal, lahat nandoon. Matanda na ako, hindi ko na kayang hanapin.'
    },
    choices: (game) => {
      if (game.recruited.includes('nena')) return [{ label: 'Sige po, dadalaw ako!', action: 'close' }]
      if (game.nenaQuest === 'found') return [{ label: 'Wala pong anuman!', next: 'thanks' }]
      if (game.nenaQuest === 'looking') return [{ label: 'Hahanapin ko pa po.', action: 'close' }]
      return [
        { label: 'Ako na po ang maghahanap!', action: 'quest:nena' },
        { label: 'Pasensya na po, nagmamadali ako.', action: 'close' },
      ]
    },
  },
  thanks: {
    text: 'Alam mo, iho/iha, matagal ko nang gustong magtinda sa plaza, katulad noong araw. Kung sasamahan mo ako... doon na ako magbubukas!',
    choices: [
      { label: 'Tara na po sa plaza!', action: 'recruit:nena' },
    ],
  },
}

// Kuya Jun (Bridgetowne, only at night): kwek-kwek by the river
export const junDialogue = {
  start: {
    text: (game) => game.recruited.includes('jun')
      ? 'O, suki! Nasa plaza na ako gabi-gabi. Mas maraming tao doon, mas masaya!'
      : 'Kwek-kwek! Fishball! Uy, nakita mo ako! Gabi lang ako nagtitinda dito sa tabi ng ilog. Tahimik, maganda ang ilaw sa tubig. Kaso... konti lang ang dumadaan.',
    choices: (game) => game.recruited.includes('jun')
      ? [{ label: 'Pabili po isang kwek-kwek!', action: 'close' }]
      : [
        { label: 'May plaza po na kailangan ng tindero!', next: 'plaza' },
        { label: 'Pabili po isang kwek-kwek!', next: 'buy' },
      ],
  },
  buy: {
    text: 'Eto o, mainit pa! Sawsaw mo sa suka, yung maanghang. Libre na, ikaw lang ang bumili sa akin ngayong gabi, haha.',
    choices: [
      { label: 'Kuya, sa plaza po kayo magtinda!', next: 'plaza' },
      { label: 'Salamat po!', action: 'close' },
    ],
  },
  plaza: {
    text: 'Plaza? Yung luma sa kabila? Akala ko patay na \'yon... Sige! Kung may mga tao na ulit doon, dadalhin ko ang kariton ko!',
    choices: [
      { label: 'Tara na po!', action: 'recruit:jun' },
    ],
  },
}
