import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5175,
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      input: {
        dashboard: path.resolve('dashboard.html')
      }
    }
  }
})
