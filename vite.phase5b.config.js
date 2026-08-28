import { transform as transformWithLightningCss } from 'lightningcss'
import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import { createCssModuleDeadSelectorPruner } from './scripts/css-module-dead-selector-pruner.mjs'

const APP_SUFFIX = '/src/App.jsx'
const APP_COACH_STYLE_IMPORT = 'import "./styles/CoachInteractiveDashboard.css";'
const SHARED_SECONDARY_PAGE_FRAGMENT = '/src/components/SecondaryPageSystem'
const SHARED_PREMIUM_WORKSPACE_STYLE = '/src/styles/PremiumWorkspace.css'
const COACH_ENHANCER_MODULE = /\/src\/lib\/coach[A-Za-z0-9_-]*Enhancer\.js$/

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

function minifyCoachEnhancerRuntimeCss() {
  let transformedModules = 0
  let transformedTemplates = 0
  let rawBytesSaved = 0

  return {
    name: 'shotlab-minify-coach-enhancer-runtime-css',
    apply: 'build',
    enforce: 'pre',
    transform(source, id) {
      const moduleId = normalizeModuleId(id).split('?')[0]
      if (!COACH_ENHANCER_MODULE.test(moduleId)) return null

      let changed = false
      const next = source.replace(/const\s+styles\s*=\s*`([\s\S]*?)`;/g, (whole, css) => {
        if (!css || css.includes('${')) return whole
        let compact
        try {
          compact = Buffer.from(transformWithLightningCss({
            filename: `${moduleId.split('/').pop()}.css`,
            code: Buffer.from(css),
            minify: true,
            sourceMap: false,
            errorRecovery: false,
          }).code).toString('utf8')
        } catch {
          return whole
        }
        if (compact.length >= css.length) return whole
        changed = true
        transformedTemplates += 1
        rawBytesSaved += Buffer.byteLength(css) - Buffer.byteLength(compact)
        return `const styles=\`${compact}\`;`
      })

      if (!changed) return null
      transformedModules += 1
      return { code: next, map: null }
    },
    buildEnd() {
      console.log(`Minified ${transformedTemplates} Coach enhancer runtime CSS templates across ${transformedModules} modules; saved ${(rawBytesSaved / 1024).toFixed(1)} KiB raw JavaScript payload before Terser/gzip.`)
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
      minifyCoachEnhancerRuntimeCss(),
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
