import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind every interface (0.0.0.0) rather than just localhost, so phones and
    // other devices on the same Wi-Fi can reach the dev server by LAN IP.
    host: true,
    port: 5173,
    // Fail loudly instead of silently moving to 5174, which would break the
    // URL you typed into your phone.
    strictPort: true,
  },
})
