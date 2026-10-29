// ============================================================
//  What Edson says. Edit the text to make Edson talk the way you like!
//
//  Each choice either goes to another line ("next") or does something ("action"):
//    action: 'play'  -> start a pickleball game
//    action: 'close' -> stop talking
// ============================================================

export const NPC_NAME = 'Edson'
export const NPC_HOME = [5.2, 0, -22] // stands across the street from Taytay New Life Fellowship (TNLF)

export const dialogue = {
  start: {
    text: 'Uy, kapitbahay! Ang init, no? May dala akong paddle at bola. Pickleball tayo dito sa tapat ng TNLF?',
    choices: [
      { label: 'Sige, laro tayo!', action: 'play' },
      { label: 'Paano ba laruin?', next: 'howto' },
      { label: 'Ano ba yung pickleball?', next: 'what' },
      { label: 'Mamaya na lang.', next: 'bye' },
    ],
  },
  what: {
    text: 'Parang tennis pero maliit ang court at plastic ang bola. Uso na kahit saan! Dito lang tayo sa kalsada, maluwag naman. Hihinto muna ang mga tricycle habang naglalaro tayo.',
    choices: [
      { label: 'Paano laruin?', next: 'howto' },
      { label: 'Game na!', action: 'play' },
    ],
  },
  howto: {
    text: 'Pindutin ang SPACE para pumalo kapag malapit ang bola. J para tumalon, K para mag-dive kapag malayo ang bola! Habang pumapalo: A o D para sa kaliwa o kanan, W para malalim, S para pa-dink lang. Dapat tumawid sa net at tumalbog sa loob ng linya. Una sa 11 points, lamang ng 2!',
    choices: [
      { label: 'Gets! Laro na!', action: 'play' },
      { label: 'Mamaya na lang.', next: 'bye' },
    ],
  },
  bye: {
    text: 'Sige, nandito lang ako sa tapat ng TNLF, sa kabilang side. Balikan mo ako ha!',
    choices: [{ label: 'Sige!', action: 'close' }],
  },
  won: {
    text: 'Grabe, ang galing mo! Saan ka natuto? Rematch tayo?',
    choices: [
      { label: 'Game ulit!', action: 'play' },
      { label: 'Pahinga muna.', next: 'bye' },
    ],
  },
  lost: {
    text: 'Hehe, panalo ako! Pero muntik na, ha. Isa pa?',
    choices: [
      { label: 'Babawi ako!', action: 'play' },
      { label: 'Pahinga muna.', next: 'bye' },
    ],
  },
  quit: {
    text: 'Pagod ka na? Sige, pahinga muna tayo. Ang init talaga.',
    choices: [
      { label: 'Ulitin natin!', action: 'play' },
      { label: 'Sige, bye!', action: 'close' },
    ],
  },
}
