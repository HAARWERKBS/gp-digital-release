import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Wichtig für Electron: relative Pfade im Build
  base: './',
  build: {
    // Sicherstellen dass die Dateien korrekt für Electron gebaut werden
    outDir: 'dist',
    emptyOutDir: true
  }
})
