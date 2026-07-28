import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import playerExperiencePhase2Plugin from './scripts/playerExperiencePhase2VitePlugin.mjs'

export default defineConfig({
  plugins: [playerExperiencePhase2Plugin(), react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 1048576
  }
})
