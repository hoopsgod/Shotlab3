import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const normalizeModuleId = (id = '') => String(id).replaceAll('\\', '/')
const APP_MODULE_SUFFIX = '/src/App.jsx'
const STATIC_CHART_IMPORT = './components/ShotLabCharts'
const STATIC_LEADERBOARDS_IMPORT = './components/PremiumLeaderboardsHub'
const STATIC_COACH_COMMAND_CENTER_IMPORT = './components/CoachCommandCenter'
const STATIC_COACH_PHASE2_IMPORT = './components/CoachDashboardPhase2.jsx'
const STATIC_COACH_INTERACTIVE_IMPORT = './components/CoachInteractiveDashboards.jsx'
const STATIC_CAREER_HISTORY_IMPORT = './components/PlayerCareerHistory.jsx'
const DEFERRED_CHART_MODULE = path.resolve(process.cwd(), 'src/components/DeferredShotLabCharts.jsx')
const DEFERRED_LEADERBOARDS_MODULE = path.resolve(process.cwd(), 'src/components/DeferredPremiumLeaderboardsHub.jsx')
const DEFERRED_COACH_COMMAND_CENTER_MODULE = path.resolve(process.cwd(), 'src/components/DeferredCoachCommandCenter.jsx')
const DEFERRED_COACH_PHASE2_MODULE = path.resolve(process.cwd(), 'src/components/DeferredCoachDashboardPhase2.jsx')
const DEFERRED_COACH_INTERACTIVE_MODULE = path.resolve(process.cwd(), 'src/components/DeferredCoachInteractiveDashboards.jsx')
const DEFERRED_CAREER_HISTORY_MODULE = path.resolve(process.cwd(), 'src/components/DeferredPlayerCareerHistory.jsx')
const COACH_ADMIN_REDIRECTS = new Map([
  ['./screens/PlayersScreen', path.resolve(process.cwd(), 'src/components/DeferredPlayersScreen.jsx')],
  ['./components/NewSeasonWizard.jsx', path.resolve(process.cwd(), 'src/components/DeferredNewSeasonWizard.jsx')],
  ['./components/CoachPlayerInviteForm.jsx', path.resolve(process.cwd(), 'src/components/DeferredCoachPlayerInviteForm.jsx')],
  ['./components/CoachProgramScoreDrawer.jsx', path.resolve(process.cwd(), 'src/components/DeferredCoachProgramScoreDrawer.jsx')],
  ['./screens/CoachTeamBrandingScreen', path.resolve(process.cwd(), 'src/components/DeferredCoachTeamBrandingScreen.jsx')],
])

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

function deferCoachCommandCenter() {
  return {
    name: 'shotlab-defer-coach-command-center',
    enforce: 'pre',
    resolveId(source, importer) {
      const importerId = normalizeModuleId(importer)
      if (source === STATIC_COACH_COMMAND_CENTER_IMPORT && importerId.endsWith(APP_MODULE_SUFFIX)) {
        return DEFERRED_COACH_COMMAND_CENTER_MODULE
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

function deferCoachInteractiveDashboards() {
  return {
    name: 'shotlab-defer-coach-interactive-dashboards',
    enforce: 'pre',
    resolveId(source, importer) {
      const importerId = normalizeModuleId(importer)
      if (source === STATIC_COACH_INTERACTIVE_IMPORT && importerId.endsWith(APP_MODULE_SUFFIX)) {
        return DEFERRED_COACH_INTERACTIVE_MODULE
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

function deferCoachAdministration() {
  return {
    name: 'shotlab-defer-coach-administration',
    enforce: 'pre',
    resolveId(source, importer) {
      const importerId = normalizeModuleId(importer)
      if (!importerId.endsWith(APP_MODULE_SUFFIX)) return null
      return COACH_ADMIN_REDIRECTS.get(source) || null
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

  if (
    moduleId.includes('/src/components/PremiumLeaderboardsHub.jsx')
    || moduleId.includes('/src/lib/seasonLeaderboardAnalytics.js')
  ) {
    return 'PremiumLeaderboardsHub'
  }

  if (
    moduleId.includes('/src/components/ShotLabCharts.jsx')
    || moduleId.includes('/src/components/PlayerCareerHistory.jsx')
  ) {
    return 'PlayerProfileWorkspaces'
  }

  if (
    moduleId.includes('/src/screens/PlayersScreen.jsx')
    || moduleId.includes('/src/components/NewSeasonWizard.jsx')
    || moduleId.includes('/src/components/CoachPlayerInviteForm.jsx')
    || moduleId.includes('/src/components/CoachProgramScoreDrawer.jsx')
    || moduleId.includes('/src/screens/CoachTeamBrandingScreen.jsx')
  ) {
    return 'CoachAdministrationWorkspaces'
  }

  if (
    moduleId.includes('/src/components/CoachCommandCenter.jsx')
    || moduleId.includes('/src/components/CoachDashboardPhase2.jsx')
    || moduleId.includes('/src/components/CoachInteractiveDashboards.jsx')
    || moduleId.includes('/src/components/SecondaryPageSystem.jsx')
    || moduleId.includes('/src/components/ExperiencePrimitives.jsx')
  ) {
    return 'CoachOperationalWorkspaces'
  }

  return undefined
}

export default defineConfig({
  plugins: [
    deferProgressCharts(),
    deferLeaderboardAnalytics(),
    deferCoachCommandCenter(),
    deferCoachPhase2Intelligence(),
    deferCoachInteractiveDashboards(),
    deferPlayerCareerHistory(),
    deferCoachAdministration(),
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
