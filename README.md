# Katropa

Tambay, laro at kwentuhan kasama ang tropa. A 3D street in Taytay you can walk around with friends:
chat, voice, pickleball with Edson, and your own character. (From the maker of Kasama.)

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
   - Press **T** (or the buttons at the top right) to switch between **Noon**, **Afternoon** and **Night**
   - You start where photo 2 was taken. Walk up to **Edson** (across the street from Taytay New Life Fellowship, just ahead) and press **E** to talk. Pick an answer with the mouse or keys **1–4**.

### Playing pickleball with Edson

Say *"Sige, laro tayo!"* and a court with a net appears on the road in front of **Taytay New Life Fellowship (TNLF)**. The tricycles wait until you're done.
- **Space** = swing the paddle when the ball is close
- Hold **A** / **D** while swinging = aim left / right, **W** = deep, **S** = short dink
- **J** = jump (for high balls), **K** = dive (reaches balls that are far away, and hits automatically)
- The ball must cross the net and land inside the lines. First to 11, win by 2.
- **Q** = stop playing

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
   Idle, Walking, Running, Sitting, Jumping.
3. Make a folder `models/<name>/` (like `models/pinay/`) with: `color.glb` (the colored model), `idle.fbx`, `walk.fbx`, `run.fbx`, `sit.fbx`, `jump.fbx`.
   For `sit.fbx`, pick a sit **on the floor** (chair sits float in the air).
4. Run `npm run character -- <name>`. It makes `public/models/<name>.glb` (small and phone-friendly).
5. For a new name, add it to `MODEL_FILES` in `src/ModelPerson.jsx` and to `model` in `src/avatar.js`.

## The files (what each one does)

| File | What it does |
|---|---|
| `src/houses.js` | **The whole street layout: buildings, trees, posts, signs, parked cars, traffic. Edit this!** |
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
| `tools/` | Scripts that turn Mixamo files into one small character file |
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
