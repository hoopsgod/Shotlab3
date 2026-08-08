import path from 'node:path'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { transform as transformWithEsbuild } from 'esbuild'

const normalizeModuleId = (id = '') => String(id).replaceAll('\\', '/')
const APP_MODULE_SUFFIX = '/src/App.jsx'
const STATIC_CHART_IMPORT = './components/ShotLabCharts'
const STATIC_LEADERBOARDS_IMPORT = './components/PremiumLeaderboardsHub'
const STATIC_COACH_COMMAND_CENTER_IMPORT = './components/CoachCommandCenter'
const STATIC_COACH_PHASE2_IMPORT = './components/CoachDashboardPhase2.jsx'
const STATIC_COACH_INTERACTIVE_IMPORT = './components/CoachInteractiveDashboards.jsx'
const STATIC_CAREER_HISTORY_IMPORT = './components/PlayerCareerHistory.jsx'
const STATIC_LEGACY_STYLE_IMPORT = './styles/appLegacyStyles.js'
const DEFERRED_CHART_MODULE = path.resolve(process.cwd(), 'src/components/DeferredShotLabCharts.jsx')
const DEFERRED_LEADERBOARDS_MODULE = path.resolve(process.cwd(), 'src/components/DeferredPremiumLeaderboardsHub.jsx')
const DEFERRED_COACH_COMMAND_CENTER_MODULE = path.resolve(process.cwd(), 'src/components/DeferredCoachCommandCenter.jsx')
const DEFERRED_COACH_PHASE2_MODULE = path.resolve(process.cwd(), 'src/components/DeferredCoachDashboardPhase2.jsx')
const DEFERRED_COACH_INTERACTIVE_MODULE = path.resolve(process.cwd(), 'src/components/DeferredCoachInteractiveDashboards.jsx')
const DEFERRED_CAREER_HISTORY_MODULE = path.resolve(process.cwd(), 'src/components/DeferredPlayerCareerHistory.jsx')
const LEGACY_STYLE_RUNTIME_MODULE = path.resolve(process.cwd(), 'src/styles/appLegacyStylesRuntime.js')
const PLAYER_INTERFACE_REDIRECTS = new Map([
  ['./components/PlayerDashboardHeader', path.resolve(process.cwd(), 'src/components/DeferredPlayerDashboardHeader.jsx')],
  ['./components/PlayerDailyCommandCenter.jsx', path.resolve(process.cwd(), 'src/components/DeferredPlayerDailyCommandCenter.jsx')],
  ['./components/PlayerOperationalWorkspace.jsx', path.resolve(process.cwd(), 'src/components/DeferredPlayerOperationalWorkspace.jsx')],
])
const COACH_ADMIN_REDIRECTS = new Map([
  ['./components/NewSeasonWizard.jsx', path.resolve(process.cwd(), 'src/components/DeferredNewSeasonWizard.jsx')],
  ['./components/CoachPlayerInviteForm.jsx', path.resolve(process.cwd(), 'src/components/DeferredCoachPlayerInviteForm.jsx')],
  ['./components/CoachProgramScoreDrawer.jsx', path.resolve(process.cwd(), 'src/components/DeferredCoachProgramScoreDrawer.jsx')],
  ['./screens/CoachTeamBrandingScreen', path.resolve(process.cwd(), 'src/components/DeferredCoachTeamBrandingScreen.jsx')],
])
const APP_DOMAIN_SERVICE_FRAGMENTS = [
  '/src/lib/appPersistenceService',
  '/src/lib/remotePersistence',
  '/src/lib/homeShotLogging',
  '/src/lib/playerDataManagement',
  '/src/lib/seasonArchive',
  '/src/lib/playerDashboardSelectors',
  '/src/lib/coachDashboardSelectors',
  '/src/lib/coachOperationalDashboard',
  '/src/lib/coachOperationalIntelligence',
  '/src/lib/playerOperationalWorkspaces',
  '/src/lib/operationalInsightRails',
  '/src/lib/trainingCatalogPersistenceService',
  '/src/lib/playerChallengePersistenceService',
]
const APP_WORKSPACE_STYLE_IMPORTS = [
  './styles/PremiumWorkspace.css',
  './styles/CoachInteractiveDashboard.css',
]
const AUTHORITY_BUNDLE_TARGET_BYTES = 88_000

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

function hydrateLegacyStyles() {
  return {
    name: 'shotlab-hydrate-legacy-styles',
    enforce: 'pre',
    resolveId(source, importer) {
      const importerId = normalizeModuleId(importer)
      if (source === STATIC_LEGACY_STYLE_IMPORT && importerId.endsWith(APP_MODULE_SUFFIX)) {
        return LEGACY_STYLE_RUNTIME_MODULE
      }
      return null
    },
  }
}

function deferPlayerInterface() {
  return {
    name: 'shotlab-defer-player-interface',
    enforce: 'pre',
    resolveId(source, importer) {
      const importerId = normalizeModuleId(importer)
      if (!importerId.endsWith(APP_MODULE_SUFFIX)) return null
      return PLAYER_INTERFACE_REDIRECTS.get(source) || null
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

function deferWorkspaceStyles() {
  return {
    name: 'shotlab-defer-workspace-styles',
    enforce: 'pre',
    transform(code, id) {
      const moduleId = normalizeModuleId(id)
      if (!moduleId.endsWith(APP_MODULE_SUFFIX)) return null

      let nextCode = code
      let changed = false
      for (const source of APP_WORKSPACE_STYLE_IMPORTS) {
        const staticImport = `import \"${source}\";`
        if (!nextCode.includes(staticImport)) continue
        nextCode = nextCode.replace(staticImport, `void import(\"${source}\");`)
        changed = true
      }

      return changed ? { code: nextCode, map: null } : null
    },
  }
}

function bundleVisualAuthorityCss() {
  return {
    name: 'shotlab-bundle-visual-authority-css',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist')
      const indexPath = path.join(distDir, 'index.html')
      let html = await readFile(indexPath, 'utf8')
      const linkPattern = /<link\b[^>]*href=["']\/?(shotlab-[^"'?]+\.css)(?:\?[^"']*)?["'][^>]*>/gi
      const links = [...html.matchAll(linkPattern)]
      if (links.length < 2) return

      const ordered = []
      for (const match of links) {
        const name = match[1]
        const css = await readFile(path.join(distDir, name), 'utf8')
        ordered.push({ name, css, bytes: Buffer.byteLength(css) })
      }

      const groups = []
      let group = []
      let groupBytes = 0
      for (const entry of ordered) {
        if (group.length && groupBytes + entry.bytes > AUTHORITY_BUNDLE_TARGET_BYTES) {
          groups.push(group)
          group = []
          groupBytes = 0
        }
        group.push(entry)
        groupBytes += entry.bytes
      }
      if (group.length) groups.push(group)

      const bundleTags = []
      for (let index = 0; index < groups.length; index += 1) {
        const bundleName = `shotlab-authority-${index + 1}.css`
        const concatenated = groups[index].map((entry) => entry.css).join('\n')
        const transformed = await transformWithEsbuild(concatenated, { loader: 'css', minify: true })
        await writeFile(path.join(distDir, bundleName), transformed.code)
        bundleTags.push(`<link rel="stylesheet" href="/${bundleName}" data-shotlab-authority-bundle="${index + 1}" />`)
      }

      let injected = false
      html = html.replace(linkPattern, () => {
        if (injected) return ''
        injected = true
        return bundleTags.join('\n  ')
      })
      await writeFile(indexPath, html)
      await Promise.all(ordered.map((entry) => unlink(path.join(distDir, entry.name))))
      console.log(`Bundled ${ordered.length} visual authority stylesheets into ${groups.length} ordered production bundles.`)
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
    || moduleId.includes('/src/components/ShotLabCharts.jsx')
    || moduleId.includes('/src/components/PlayerCareerHistory.jsx')
  ) {
    return 'PlayerAnalyticsWorkspaces'
  }

  if (
    moduleId.includes('/src/components/PlayerCoachAssignmentCard.jsx')
    || moduleId.includes('/src/components/PlayerDashboardHeader.jsx')
    || moduleId.includes('/src/components/PlayerDailyCommandCenter.jsx')
    || moduleId.includes('/src/components/PlayerDailyPrimitives.jsx')
    || moduleId.includes('/src/components/PlayerOperationalWorkspace.jsx')
  ) {
    return 'PlayerInterfaceWorkspaces'
  }

  if (
    moduleId.includes('/src/components/NewSeasonWizard.jsx')
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

  if (APP_DOMAIN_SERVICE_FRAGMENTS.some((fragment) => moduleId.includes(fragment))) {
    return 'AppDomainServices'
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
    hydrateLegacyStyles(),
    deferPlayerInterface(),
    deferCoachAdministration(),
    deferWorkspaceStyles(),
    react(),
    bundleVisualAuthorityCss(),
  ],
  esbuild: {
    drop: ['debugger'],
    pure: ['console.log', 'console.debug', 'console.info'],
  },
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        manualChunks: stableVendorChunk,
      },
    },
  },
})
