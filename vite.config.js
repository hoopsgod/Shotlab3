import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { RUNTIME_CSS_MANIFEST } from './scripts/build-runtime-css.mjs'

const normalizeModuleId = (id = '') => String(id).replaceAll('\\', '/')

function stableProductionChunk(id) {
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

  if (moduleId.includes('/src/lib/')) {
    return 'domain-services'
  }

  return undefined
}

function pruneRuntimeCssSources() {
  let resolvedConfig

  return {
    name: 'shotlab-prune-runtime-css-sources',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      resolvedConfig = config
    },
    async closeBundle() {
      const rootDir = resolvedConfig?.root || process.cwd()
      const publicDir = resolvedConfig?.publicDir || path.join(rootDir, 'public')
      const outDir = path.resolve(rootDir, resolvedConfig?.build?.outDir || 'dist')
      const manifestPath = path.join(publicDir, RUNTIME_CSS_MANIFEST)
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

      await Promise.all(manifest.sources.map((source) => (
        rm(path.join(outDir, source), { force: true })
      )))
      await rm(path.join(outDir, RUNTIME_CSS_MANIFEST), { force: true })
    },
  }
}

export default defineConfig({
  plugins: [react(), pruneRuntimeCssSources()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 1048576,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: stableProductionChunk,
      },
    },
  },
})
