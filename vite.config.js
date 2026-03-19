import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 1048576,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        playerDemo: resolve(__dirname, "pages/player/index.html"),
      },
    },
  }
})
