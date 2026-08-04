import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeModuleId = (id = '') => String(id).replaceAll('\\', '/')
const APP_MODULE_SUFFIX = '/src/App.jsx'
const STATIC_CHART_IMPORT = './components/ShotLabCharts'
const STATIC_LEADERBOARDS_IMPORT = './components/PremiumLeaderboardsHub'
const STATIC_COACH_PHASE2_IMPORT = './components/CoachDashboardPhase2.jsx'
const STATIC_CAREER_HISTORY_IMPORT = './components/PlayerCareerHistory.jsx'
const DEFERRED_CHART_MODULE = path.resolve(process.cwd(), 'src/components/DeferredShotLabCharts.jsx')
const DEFERRED_LEADERBOARDS_MODULE = path.resolve(process.cwd(), 'src/components/DeferredPremiumLeaderboardsHub.jsx')
const DEFERRED_COACH_PHASE2_MODULE = path.resolve(process.cwd(), 'src/components/DeferredCoachDashboardPhase2.jsx')
const DEFERRED_CAREER_HISTORY_MODULE = path.resolve(process.cwd(), 'src/components/DeferredPlayerCareerHistory.jsx')

function deferProgressCharts() {
  return {
    name: 'shotlab-defer-progress-charts',
    enforce: 'pre',
    resolveId(source, importer) {
      const importerId = normalizeModuleId(importer)
      if (source === STATIC_CHART_IMPORT && importerId.endsWith(APP_MODULE_SUFFIX)) {
        return DEFERRED_CHART_MODULE
      }
      return null
    },
  }
}

function deferLeaderboardAnalytics() {
  return {
    name: 'shotlab-defer-leaderboard-analytics',
    enforce: 'pre',
    resolveId(source, importer) {
      const importerId = normalizeModuleId(importer)
      if (source === STATIC_LEADERBOARDS_IMPORT && importerId.endsWith(APP_MODULE_SUFFIX)) {
        return DEFERRED_LEADERBOARDS_MODULE
      }
      return null
    },
  }
}

function deferCoachPhase2Intelligence() {
  return {
    name: 'shotlab-defer-coach-phase2-intelligence',
    enforce: 'pre',
    resolveId(source, importer) {
      const importerId = normalizeModuleId(importer)
      if (source === STATIC_COACH_PHASE2_IMPORT && importerId.endsWith(APP_MODULE_SUFFIX)) {
        return DEFERRED_COACH_PHASE2_MODULE
      }
      return null
    },
  }
}

function deferPlayerCareerHistory() {
  return {
    name: 'shotlab-defer-player-career-history',
    enforce: 'pre',
    resolveId(source, importer) {
      const importerId = normalizeModuleId(importer)
      if (source === STATIC_CAREER_HISTORY_IMPORT && importerId.endsWith(APP_MODULE_SUFFIX)) {
        return DEFERRED_CAREER_HISTORY_MODULE
      }
      return null
    },
  }
}

function stableVendorChunk(id) {
  const moduleId = normalizeModuleId(id)

  if (
    moduleId.includes('/node_modules/react/')
    || moduleId.includes('/node_modules/react-dom/')
    || moduleId.includes('/node_modules/scheduler/')
  ) {
    return 'react-vendor'
  }

  return undefined
}

export default defineConfig({
  plugins: [
    deferProgressCharts(),
    deferLeaderboardAnalytics(),
    deferCoachPhase2Intelligence(),
    deferPlayerCareerHistory(),
    react(),
  ],
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
