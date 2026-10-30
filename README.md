# Katropa

Tambay, laro at kwentuhan kasama ang tropa. A 3D street in Taytay you can walk around with friends:
chat, voice, pickleball with Edson, and your own character. (From the maker of Kasama.)

There are two places to hang out (pick one on the start screen under **Saan tayo?**):
- **Taytay (TNLF)**: the street at Taytay New Life Fellowship, with Edson and pickleball.
- **Bridgetowne, Pasig**: you start between GBF Center (left) and Opus (right), then cross the bridge
  over the Pasig River with the rattan coils. After the bridge: The Victor on the right, the round towers being built on the left.
  Friends have to pick the same place and the same room code to see each other.

A box character walking around a simple 3D street.
Built with React + React Three Fiber + Rapier (physics).

## Before you start (one time only)

1. Install **Node.js LTS** from https://nodejs.org (if you don't have it yet).
2. Check it works. Open a terminal and type:
   ```
   node -v
   npm -v
   ```
   Both should show a version number.

## Run the game in VS Code

1. **Unzip** `street-game.zip` somewhere easy, like `Documents/street-game`.
2. Open **VS Code** → **File → Open Folder** → pick the `street-game` folder.
3. Open the terminal in VS Code: **Terminal → New Terminal** (or press `` Ctrl + ` ``).
4. Install the packages (only the first time, takes a minute):
   ```
   npm install
   ```
5. Start the game:
   ```
   npm run dev
   ```
6. **Ctrl + click** the link it shows (usually `http://localhost:5173`).
7. Click once on the game, then play:
   - **W A S D** or **Arrow keys** to walk
   - Hold **Shift** to run
   - **Space** or **J** to jump, **K** to dive, **C** to sit down / stand up (or tap the JUMP / DIVE / SIT buttons, bottom right)
   - **Drag the mouse** to look around
   - Press **V** to switch between third-person and first-person
   - The time of day follows the real clock: day until 3 PM, afternoon 3–6 PM, night after 6 PM.
   - You start where photo 2 was taken. Walk up to **Edson** (across the street from Taytay New Life Fellowship, just ahead) and press **E** to talk. Pick an answer with the mouse or keys **1–4**.

### Playing pickleball with Edson

Say *"Sige, laro tayo!"* and a court with a net appears on the road in front of **Taytay New Life Fellowship (TNLF)**. The tricycles wait until you're done.
- **Space** = swing the paddle when the ball is close
- Hold **A** / **D** while swinging = aim left / right, **W** = deep, **S** = short dink
- **J** = jump (for high balls), **K** = dive (reaches balls that are far away, and hits automatically)
- The ball must cross the net and land inside the lines. First to 11, win by 2.
- **Q** = stop playing

### Skateboarding with Andrew (Bridgetowne)

After the bridge, on the right between The Victor and the river, there's a skatepark. **Andrew** stands at the corner.
Press **E** (or tap him) and say *"Sige, pahiram ng board!"* to borrow his skateboard.
- **W** = push, **A** / **D** = turn (the board keeps rolling when you let go)
- **Space** = ollie, **Shift** = kickflip (from the ground it pops an ollie too). Land after the board finishes turning, or it's *Sablay!*
- Ride up the kicker, the funbox and the big bank to fly. Points: ollie 10, kickflip 50, big air 25
- **Q** = give the board back
- Phone: joystick to push and turn, **OLLIE** / **FLIP** buttons, **Stop** to give the board back

To stop the game: click the terminal and press `Ctrl + C`.

## Playing on a phone

Phones get their own controls automatically:
- **Joystick** (bottom left): walk. Push it all the way to run.
- **Drag anywhere else** on the screen: look around (you can walk and look at the same time with two thumbs).
- **JUMP / DIVE / SIT** buttons (bottom right). In pickleball a big yellow **HIT** button appears.
  Aim your hit with the joystick: left/right, forward = deep, back = short dink.
- **👁** = first-person view. **Stop** = quit pickleball. Tap the "Tap to talk" box to talk to Edson.
- Turn your phone **sideways (landscape)** for the best view.
- **Graphics** (on the start screen): **⚡ Smooth** turns off shadows and lamp lights so phones don't lag (the default on phones). **✨ Pretty** has everything.
- To try the phone layout on your laptop, open `localhost:5173/?touch`.

To play on a phone at home:
1. Terminal 1: `npm run server`
2. Terminal 2: `npm run lan` (packs the game first, so it loads fast on phones; wait for the addresses to appear)
3. On the phone (same Wi-Fi or hotspot), open the **Network** address it shows, like `https://192.168.1.5:4173`.
   Tap **Advanced → Proceed** on the "not private" warning.

`npm run dev:lan` also works, but it's slow on phones (it sends hundreds of small files). Use it only while changing code.

**If the phone just keeps loading:**
- Turn off **Cloudflare WARP** or any VPN on the laptop while playing.
- Check the phone uses `https://` and the right number at the end (`:4173` for `npm run lan`).
- If a red error box appears at the bottom, screenshot it and send it to Claude.

## Play together (multiplayer)

You need **two terminals** in VS Code (click the **+** in the terminal panel for a second one):

1. Terminal 1: `npm run server` (the multiplayer server, keep it running)
2. Terminal 2: `npm run dev` (the game)
3. Open the game, **make your character** (body, face, hair, clothes, shoes, or 🎲 Random), type your **name**, and keep the room code `tnlf`.
4. To test alone: open the game in a **second browser tab** with a different name. You'll see each other!

**Friends on the same Wi-Fi:** use `npm run dev:lan` instead of `npm run dev` (needed for voice chat).
It shows a **Network** address like `https://192.168.1.5:5173`. Friends open that address on their phone or laptop.
The browser will warn "Your connection is not private": click **Advanced → Proceed** (it's your own computer, so it's safe).
(The first time, Windows may ask to allow Node.js through the firewall. Click **Allow** for private networks.)

- **Chat:** press **Enter** (or the 💬 Chat button), type, and press **Enter** to send. Esc cancels. Your message shows in the chat box and as a speech bubble above your head.
- **Voice chat:** click **🎙️ Join voice** (top right) and allow the microphone. Everyone in your room who joined voice can hear you.
  It's **proximity voice**: people sound louder when they're close and fade out when far away, so walk over to talk!
  **M** = mute / unmute. A 🎙 next to a name means that player is in voice. Use headphones to avoid echo.
- Same room code = same street. Different room code = a different, private street.
- The bottom-left box shows if you're online and who's with you.
- Without the server, the game still works on its own (solo mode).
- Everyone has their own Edson and their own pickleball game for now.


## Adding a 3D character (like the 3D Pinoy)

1. Make a character (Tripo, Trellis 3D...) in a **T-pose or A-pose** and download it as **GLB** (1k texture).
2. Upload it to **mixamo.com**, let it auto-rig, then download these animations as **FBX Binary, 30 fps**
   (first one **With Skin**, the rest **Without Skin**; tick **In Place** for walking and running):
   Idle, Walking, Running, Sitting, Jumping (and optionally **Dive Roll**, saved as `dive.fbx`,
   and two **Skateboarding** ones: riding crouched as `skate.fbx`, kicking the ground as `push.fbx`).
3. Make a folder `models/<name>/` (like `models/pinay/`) with: `color.glb` (the colored model), `idle.fbx`, `walk.fbx`, `run.fbx`, `sit.fbx`, `jump.fbx`.
   For `sit.fbx`, pick a sit **on the floor** (chair sits float in the air).
4. Run `npm run character -- <name>`. It makes `public/models/<name>.glb` (small and phone-friendly).
5. For a new name, add it to `MODEL_FILES` in `src/ModelPerson.jsx` and to `model` in `src/avatar.js`.

## Changing The Victor

The statue is `public/models/victor.glb`, made from `models/victor/victor.obj` (a body made from photos).
`npm run victor` cuts off the OBJ's round ball head, sculpts a human head in its place (brow, eyes, nose,
lips, jaw, chin, ears, neck, looking up at the fist) and saves the GLB, about 56 m tall.
To change the face, edit `head()` in `tools/build-victor.mjs` and run it again
(`npm run victor -- --obj` also writes `models/work/victor.obj` to look at).

## Admin (jaypee)

- Type the name **jaypee** on the start screen and an **Admin code** box appears. With the right code you get the **⚙️ Admin** button:
  change the time of day (Auto / Noon / Afternoon / Night) **for everyone in the room**.
- The code is checked by the server. Set it on Render: **katropa-server → Environment → Add `ADMIN_CODE`**.
  On your laptop: `$env:ADMIN_CODE="your-code"; npm run server` (PowerShell).
- Anyone who types "jaypee" without the right code joins as a Guest.

## Pickleball with a friend (2 players)

Talk to Edson and pick **"Laro tayo, 2 players"**. You wait on the court until a friend in the same room
talks to Edson and picks **"Sali sa laro ni ..."**. Then you play each other (first to 11, win by 2).
You can also tap **🏓 Sali** on the banner at the top to join the waiting player. **Q** or **Stop** to quit.

**Watching (spectators):** when two people are playing, everyone else in the room (also people who enter
the room in the middle of a game) sees a banner with the score. Tap **👀 Manood** (or talk to Edson) to
stand behind the court and watch, with the scoreboard and the calls. Players' paddles and swings show for
everyone. Tap **Tapos na** to stop watching.

## The files (what each one does)

| File | What it does |
|---|---|
| `src/houses.js` | **The whole street layout: buildings, trees, posts, signs, parked cars, traffic. Edit this!** |
| `src/maps.js` | The places you can pick (Taytay, Bridgetowne): where you start, how far you can see |
| `src/bridgetowne.js` | **Bridgetowne layout: road and bridge sizes, palms, trees, street lights, traffic. Edit this!** |
| `src/skate.js` | **What Andrew says, and how the skateboard feels (speed, ollie, points). Edit this!** |
| `src/Skatepark.jsx` | The skatepark ramps, the skateboard, and Andrew |
| `src/Bridgetowne.jsx` | Bridgetowne: the ground, river, bridge, road, sidewalks, railings, and puts everything in place |
| `src/BridgetowneLandmarks.jsx` | The Victor, the rattan coils, Opus, GBF Center, the towers being built, palms, bollards |
| `src/dialogue.js` | **Everything Edson says. Edit it to change the conversation!** |
| `src/timeOfDay.js` | Colors and lights for noon, afternoon and night. Tweak them here! |
| `src/NightLights.jsx` | Street lights and glowing lights that turn on at night |
| `server/index.js` | The multiplayer server: tells everyone where the other players are |
| `src/network.js` | Connects the game to the server and sends your position |
| `src/RemotePlayers.jsx` | Draws the other players with their names |
| `src/SpeechBubble.jsx` | The chat speech bubble above a player's head |
| `src/voice.js` | Voice chat: microphone, connecting to other players, mute |
| `src/App.jsx` | Sets up the 3D world: sky, sun, physics, keyboard |
| `src/Player.jsx` | Your character: movement, camera, mouse look, first-person |
| `src/Street.jsx` | The road, sidewalks, and puts everything from `houses.js` in place |
| `src/Building.jsx` | How a building is made (floors, roof, shutters, signs, balconies) |
| `src/Props.jsx` | Trees, electric posts and wires, street lights, signs, plants |
| `src/Vehicles.jsx` | Tricycles, truck, van, jeep, motorbikes, and the moving traffic |
| `src/NewLifeFellowship.jsx` | Taytay New Life Fellowship (TNLF), built from Street View and your photos |
| `src/NearTNLF.jsx` | Left of TNLF: EGB and the shop row, Margie 2 Sari-Sari Store, the badminton COURT, the white house |
| `src/ModelPerson.jsx` | Ready-made 3D characters (GLB + Mixamo animations) |
| `tools/` | Scripts that turn Mixamo files into one small character file, and build The Victor (`build-victor.mjs`) |
| `src/AcrossTNLF.jsx` | Across from TNLF: the yellow-green house with the gold gate, KTV ROOM and Cuesociety |
| `server/pickleball.js` | 2-player pickleball: the server moves the ball and keeps score |
| `src/Pickleball2P.jsx` | Draws the 2-player game and sends your swings |
| `src/Npc.jsx` | Edson: walks home, looks at you, lets you talk with E |
| `src/Pickleball.jsx` | The pickleball game: court, net, ball, scoring, how Edson plays (difficulty settings at the top) |
| `src/Hud.jsx` | Things on the screen: talk prompt, dialogue box, scoreboard |
| `src/Person.jsx` | How a character is built from their look (body, face, hair, clothes, shoes) |
| `src/avatar.js` | **All character creator choices (add colors here!)** and Edson's look |
| `src/CharacterCreator.jsx` | The start screen: 3D preview, tabs, name, room code, graphics |
| `src/StaticBatch.jsx` | Speed trick: glues the non-moving street pieces together so it runs smoothly |
| `src/game.js` | Keeps track of walking / talking / playing and the score |
| `src/textures.js` | Asphalt, tin roof, shutters, sari-sari shelves (drawn in code, no images) |
| `src/world.js` | Street sizes (road width, where buildings start, where the court is) |

## Your first fun task

Open `src/houses.js` and change things (the comments at the top explain every setting):
- `wallColor` / `trimColor` / `roofColor` → match the colors on your street
- `floors` → `1`, `2`, `3`...
- `roof` → `'flat'`, `'tin'` or `'hip'`
- `sign: { text: 'MY STORE' }` → put a sign on any building
- Add more tricycles to `traffic`
- Make Edson easier or harder: change `NPC_SPEED` and `NPC_MISS_CHANCE` at the top of `src/Pickleball.jsx`

Save the file and the game updates instantly. No restart needed.

## What's next (step by step)

- [ ] **Step 1:** Character walking on a street ✅ (this starter)
- [x] **Step 2:** Make the street look like yours ✅ (built from your photos; keep tweaking `houses.js`)
- [x] **Bonus:** Talk to Edson and play pickleball on the street ✅
- [ ] **Step 3:** Walk to a door and press **E** to enter a house (on hold for now)
- [ ] **Step 4:** Swap the box for a low-poly character (Quaternius / Kenney)
- [x] **Step 5:** On-screen joystick for phones ✅
- [x] **Step 6a:** Multiplayer: name screen, rooms, see each other walk ✅
- [x] **Step 6b:** Text chat with speech bubbles ✅
- [x] **Step 6c:** Voice chat (proximity) ✅
- [ ] **Step 6d:** Pickleball against a friend
- [ ] **Step 7:** Wrap with Capacitor → Play Store

## If something goes wrong

- **`npm` is not recognized** → Node.js isn't installed. Install it, then restart VS Code.
- **Black or empty screen** → open the browser console (F12) and send Claude the red error.
- **Character doesn't move** → click on the game first so it gets keyboard focus.
- **Laptop is slow** → close extra Chrome tabs and plug in your charger.
