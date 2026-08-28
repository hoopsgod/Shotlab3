import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import { createCssModuleDeadSelectorPruner } from './scripts/css-module-dead-selector-pruner.mjs'

const APP_SUFFIX = '/src/App.jsx'
const APP_COACH_STYLE_IMPORT = 'import "./styles/CoachInteractiveDashboard.css";'
const SHARED_SECONDARY_PAGE_FRAGMENT = '/src/components/SecondaryPageSystem'
const SHARED_PREMIUM_WORKSPACE_STYLE = '/src/styles/PremiumWorkspace.css'
const CORE_DOMAIN_SERVICE_FRAGMENTS = [
  '/src/lib/schedulePersistenceService.js',
  '/src/lib/playerProfilePersistenceService.js',
  '/src/lib/playerIdentityPersistenceService.js',
  '/src/lib/teamPersistenceService.js',
  '/src/lib/strengthConditioningPersistenceService.js',
  '/src/lib/apiFetchBridge.js',
  '/src/lib/programScorePersistenceService.js',
  '/src/lib/scorePersistenceService.js',
  '/src/lib/shotLogPersistenceService.js',
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

export default defineConfig(async (environment) => {
  const resolvedBase = typeof baseConfig === 'function' ? await baseConfig(environment) : baseConfig
  const baseBuild = resolvedBase.build || {}
  const baseRollupOptions = baseBuild.rollupOptions || {}
  const baseOutput = baseRollupOptions.output || {}
  const baseManualChunks = baseOutput.manualChunks

  return {
    ...resolvedBase,
    plugins: [
      ownCoachInteractiveStylesInWorkspace(),
      createCssModuleDeadSelectorPruner(),
      ...(resolvedBase.plugins || []),
    ],
    build: {
      ...baseBuild,
      rollupOptions: {
        ...baseRollupOptions,
        output: {
          ...baseOutput,
          manualChunks(id, api) {
            const moduleId = normalizeModuleId(id)
            if (CORE_DOMAIN_SERVICE_FRAGMENTS.some((fragment) => moduleId.includes(fragment))) return 'AuthenticatedUi'
            if (moduleId.includes(SHARED_SECONDARY_PAGE_FRAGMENT) || moduleId.includes(SHARED_PREMIUM_WORKSPACE_STYLE)) return 'AuthenticatedUi'
            const baseChunk = typeof baseManualChunks === 'function' ? baseManualChunks(id, api) : undefined
            // Domain services are already co-required with the authenticated UI in the
            // production graph. Keeping them in one CSS-free shared chunk removes an
            // extra request/compression boundary without changing route behavior.
            if (baseChunk === 'AppDomainServices') return 'AuthenticatedUi'
            return baseChunk
          },
        },
      },
    },
  }
})
