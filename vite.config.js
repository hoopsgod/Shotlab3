import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import playerWorkspacesPhase2Plugin from './scripts/playerWorkspacesPhase2VitePlugin.mjs'

export default defineConfig({
  plugins: [playerWorkspacesPhase2Plugin(), react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 1048576
  }
})