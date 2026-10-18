import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  envPrefix: ['VITE_', 'GEMINI_'],
  server: {
    port: 5176,
    strictPort: true,
  },
})
