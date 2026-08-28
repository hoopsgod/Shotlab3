import path from 'node:path'
import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import { buildMinifiedLegacyStyleRuntimeSource } from './scripts/build-legacy-style-runtime-source.mjs'
import { createCssModuleDeadSelectorPruner } from './scripts/css-module-dead-selector-pruner.mjs'

const APP_SUFFIX = '/src/App.jsx'
const APP_COACH_STYLE_IMPORT = 'import "./styles/CoachInteractiveDashboard.css";'
const SHARED_SECONDARY_PAGE_FRAGMENT = '/src/components/SecondaryPageSystem'
const SHARED_PREMIUM_WORKSPACE_STYLE = '/src/styles/PremiumWorkspace.css'
const MINIFIED_LEGACY_STYLE_SOURCE_ID = '\0shotlab-minified-legacy-style-source'
const LEGACY_STYLE_SOURCE_MODULE = path.resolve(process.cwd(), 'src/styles/appLegacyStyles.js')
const LEGACY_STYLE_EXPORTS = ['_STYLES_CSS', '_PAGE_SIGNATURE_CSS', '_DESKTOP_SHELL_CSS', '_PLAYER_COMPACT_DASHBOARD_CSS']

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

function pruneLegacyStylePayload() {
  return {
    name: 'shotlab-prune-legacy-style-payload',
    apply: 'build',
    enforce: 'pre',
    async load(id) {
      if (id !== MINIFIED_LEGACY_STYLE_SOURCE_ID) return null
      const compactSource = await buildMinifiedLegacyStyleRuntimeSource({
        sourceFile: LEGACY_STYLE_SOURCE_MODULE,
        exportNames: LEGACY_STYLE_EXPORTS,
      })
      return `export default ${JSON.stringify(compactSource)};`
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
      pruneLegacyStylePayload(),
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
            if (moduleId.includes(SHARED_SECONDARY_PAGE_FRAGMENT) || moduleId.includes(SHARED_PREMIUM_WORKSPACE_STYLE)) return 'AuthenticatedUi'
            return typeof baseManualChunks === 'function' ? baseManualChunks(id, api) : undefined
          },
        },
      },
    },
  }
})
