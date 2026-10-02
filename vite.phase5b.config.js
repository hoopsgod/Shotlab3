import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import { createCssModuleDeadSelectorPruner } from './scripts/css-module-dead-selector-pruner.mjs'
import { createLegacyRuntimeCssExtractionPlugin } from './scripts/legacy-runtime-css-extraction-plugin.mjs'

const APP_SUFFIX = '/src/App.jsx'
const APP_COACH_STYLE_IMPORT = 'import "./styles/CoachInteractiveDashboard.css";'
const SHARED_SECONDARY_PAGE_FRAGMENT = '/src/components/SecondaryPageSystem'
const SHARED_PREMIUM_WORKSPACE_STYLE = '/src/styles/PremiumWorkspace.css'
const COACH_RESPONSE_SERVICE_FRAGMENTS = [
  '/src/lib/coachResponseLoopEnhancer.js',
  '/src/lib/coachFollowUpEnhancer.js',
  '/src/lib/coachAssignmentOutcomeEnhancer.js',
  '/src/lib/coachFollowUpService.js',
  '/src/lib/coachPlayerResponseLoop.js',
]

const CORE_DOMAIN_SERVICE_FRAGMENTS = [
  '/src/lib/schedulePersistenceService.js',
  '/src/lib/playerProfilePersistenceService.js',
  '/src/lib/playerIdentityPersistenceService.js',
  '/src/lib/teamPersistenceService.js',
  '/src/lib/strengthConditioningPersistenceService.js',
  '/src/lib/apiFetchBridge.js',
  '/src/lib/legacySignedCollectionPersistence.js',
  '/src/lib/programScorePersistenceService.js',
  '/src/lib/scorePersistenceService.js',
  '/src/lib/shotLogPersistenceService.js',
  '/src/lib/leaderboardService.js',
  '/src/lib/gameStatAnalytics.js',
  '/src/lib/gameStatPersistenceService.js',
  '/src/lib/playerDailyCommandCenter.js',
  '/src/lib/coachAssignmentOutcomes.js',
  '/src/lib/supabase.js',
  '/src/lib/releaseAuthService.js',
  '/src/lib/runtimeReleaseReadiness.js',
  '/src/lib/backendHealth.js',
  '/src/lib/supabaseSchemaVerification.js',
]

function normalizeModuleId(id = '') {
  return String(id).replaceAll('\\', '/')
}

function ownCoachInteractiveStylesInWorkspace() {
  return {
    name: 'shotlab-own-coach-interactive-styles-in-workspace',
    apply: 'build',
    enforce: 'pre',
    transform(source, id) {
      if (!normalizeModuleId(id).endsWith(APP_SUFFIX)) return null
      if (!source.includes(APP_COACH_STYLE_IMPORT)) {
        throw new Error('Phase 5B expected App Coach interactive stylesheet import is missing.')
      }
      return { code: source.replace(APP_COACH_STYLE_IMPORT, ''), map: null }
    },
  }
}

function enforceRootSpaAssetUrls() {
  return {
    name: 'shotlab-root-spa-asset-urls',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      const indexPath = path.resolve(process.cwd(), 'dist/index.html')
      let html = await readFile(indexPath, 'utf8')
      html = html
        .replaceAll('href="./shotlab-authority-', 'href="/shotlab-authority-')
        .replaceAll("href='./shotlab-authority-", "href='/shotlab-authority-")
      await writeFile(indexPath, html)
    },
  }
}

export default defineConfig(async (environment) => {
  const resolvedBase = typeof baseConfig === 'function' ? await baseConfig(environment) : baseConfig
  const baseBuild = resolvedBase.build || {}
  const baseRollupOptions = baseBuild.rollupOptions || {}
  const baseOutput = baseRollupOptions.output || {}
  const baseManualChunks = baseOutput.manualChunks

  return {
    ...resolvedBase,
    // Cloudflare and Capacitor both serve the production bundle from the app
    // origin root. Root-relative hashed assets keep hard-refresh SPA routes such
    // as /coach/events and /events from resolving bundles beneath those routes.
    base: '/',
    plugins: [
      createLegacyRuntimeCssExtractionPlugin(),
      ownCoachInteractiveStylesInWorkspace(),
      createCssModuleDeadSelectorPruner(),
      ...(resolvedBase.plugins || []),
      enforceRootSpaAssetUrls(),
    ],
    build: {
      ...baseBuild,
      rollupOptions: {
        ...baseRollupOptions,
        output: {
          ...baseOutput,
          manualChunks(id, api) {
            const moduleId = normalizeModuleId(id)
            if (COACH_RESPONSE_SERVICE_FRAGMENTS.some((fragment) => moduleId.includes(fragment))) return 'CoachWorkspaces'
            if (CORE_DOMAIN_SERVICE_FRAGMENTS.some((fragment) => moduleId.includes(fragment))) return 'AppDomainServices'
            if (moduleId.includes(SHARED_SECONDARY_PAGE_FRAGMENT)) return 'CoachWorkspaces'
            if (moduleId.includes(SHARED_PREMIUM_WORKSPACE_STYLE)) return 'AppDomainServices'
            return typeof baseManualChunks === 'function' ? baseManualChunks(id, api) : undefined
          },
        },
      },
    },
  }
})
