import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// npm run dev      -> http://localhost:5173 (voice works on this computer)
// npm run dev:lan  -> https://...:5173 so friends on the same Wi-Fi can use voice chat too
//                     (browsers only allow the microphone on https pages)
export default defineConfig(({ mode }) => {
  // The multiplayer server (npm run server) is reached through the game's own address,
  // so it also works on https
  const proxy = { '/socket.io': { target: 'http://localhost:3001', ws: true } }
  return {
    plugins: mode === 'lan' ? [react(), basicSsl()] : [react()],
    // host: true lets other devices on the same Wi-Fi open the game
    server: { host: true, proxy },
    preview: { host: true, proxy },
  }
})
