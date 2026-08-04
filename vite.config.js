import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeModuleId = (id = '') => String(id).replaceAll('\\', '/')

function stableVendorChunk(id) {
  const moduleId = normalizeModuleId(id)

  if (
    moduleId.includes('/node_modules/react/')
    || moduleId.includes('/node_modules/react-dom/')
    || moduleId.includes('/node_modules/scheduler/')
  ) {
    return 'react-vendor'
  }

  if (moduleId.includes('/vendor/recharts/')) {
    return 'charts-vendor'
  }

  return undefined
}

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 1048576,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        manualChunks: stableVendorChunk,
      },
    },
  },
})
