import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import { createCssModuleDeadSelectorPruner } from './scripts/css-module-dead-selector-pruner.mjs'

const APP_SUFFIX = '/src/App.jsx'
const APP_COACH_STYLE_IMPORT = 'import "./styles/CoachInteractiveDashboard.css";'
const COACH_COMMAND_CENTER_SUFFIX = '/src/components/CoachCommandCenter.jsx'
const COACH_MISSION_CONTROL_V2_SUFFIX = '/src/components/CoachMissionControlV2.css'
const SHARED_SECONDARY_PAGE_FRAGMENT = '/src/components/SecondaryPageSystem'
const SHARED_PREMIUM_WORKSPACE_STYLE = '/src/styles/PremiumWorkspace.css'
const RETAINED_MISSION_CONTROL_MODULE = '\0shotlab-retained-mission-control-legacy.css'
const RETIRED_MISSION_CONTROL_MODULE = '\0shotlab-retired-mission-control-css.css'
const RETAINED_MISSION_CONTROL_CSS = `.mcRafters{position:absolute;z-index:1;inset:0 0 46% 43%;overflow:hidden}.mcRafters span{position:absolute;background:linear-gradient(90deg,#0000,#fff1,#0000)}.mcRafters span:nth-child(-n+2){left:-10%;right:-8%;height:1px}.mcRafters span:first-child{top:18%;transform:rotate(-8deg)}.mcRafters span:nth-child(2){top:43%;transform:rotate(7deg)}.mcRafters span:nth-child(3){left:23%;top:-15%;bottom:-12%;width:1px;transform:rotate(13deg)}.mcRafters span:nth-child(4){left:58%;top:-18%;bottom:-8%;width:1px;transform:rotate(-11deg)}.mcRailBrand{width:96px;margin:10px auto 5px;padding:7px 4px;border:0;display:grid;place-items:center;background:0 0}.mcRailBrand .mcRailLogo{width:86px;height:86px;margin:0}.mcDrawerBrand .mcDrawerLogo{width:60px;height:60px;padding:0;border:0;background:0 0}.mcDrawerLogo img{width:60px;height:60px}`

const MISSION_CONTROL_REPLACEMENTS = new Map([
  ['./CoachMissionControlHeader.css', RETAINED_MISSION_CONTROL_MODULE],
  ['./CoachMissionControlPolish.css', RETIRED_MISSION_CONTROL_MODULE],
  ['./CoachMissionControl2026.css', RETIRED_MISSION_CONTROL_MODULE],
])

const V2_PRODUCTION_REWRITES = [
  [
    '.mcBrandLockup{display:flex;align-items:center;gap:12px;min-width:0}',
    '.mcBrandLockup{min-width:0}',
  ],
  [
    '.mcBrandLockup img{display:none;width:42px;height:42px;object-fit:contain}',
    '',
  ],
  [
    '.mcBrandLockup img{display:block}',
    '',
  ],
  [
    '.mcBrandLockup img{width:34px;height:34px}',
    '',
  ],
  [
    '.mcRailLogo{width:76px;height:76px;margin:22px auto 14px;object-fit:contain;filter:drop-shadow(0 0 14px color-mix(in srgb,var(--mc) 25%,transparent))}',
    '.mcRailLogo{object-fit:contain;filter:drop-shadow(0 0 14px color-mix(in srgb,var(--mc) 25%,transparent))}',
  ],
  [
    '.mcDrawerBrand img{width:48px;height:48px;object-fit:contain}',
    '.mcDrawerBrand img{object-fit:contain}',
  ],
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

function applyExpectedV2Rewrites(source) {
  let output = source
  for (const [before, after] of V2_PRODUCTION_REWRITES) {
    if (!output.includes(before)) {
      throw new Error(`Phase 5B expected Coach V2 production rule is missing: ${before}`)
    }
    output = output.replace(before, after)
  }
  return output
}

function retireSupersededMissionControlCss() {
  return {
    name: 'shotlab-retire-superseded-mission-control-css',
    apply: 'build',
    enforce: 'pre',
    resolveId(source, importer) {
      const replacement = MISSION_CONTROL_REPLACEMENTS.get(source)
      if (!replacement) return null
      if (!normalizeModuleId(importer).endsWith(COACH_COMMAND_CENTER_SUFFIX)) return null
      return replacement
    },
    load(id) {
      if (id === RETAINED_MISSION_CONTROL_MODULE) return RETAINED_MISSION_CONTROL_CSS
      if (id === RETIRED_MISSION_CONTROL_MODULE) return ''
      return null
    },
    transform(source, id) {
      if (!normalizeModuleId(id).endsWith(COACH_MISSION_CONTROL_V2_SUFFIX)) return null
      return { code: applyExpectedV2Rewrites(source), map: null }
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
      retireSupersededMissionControlCss(),
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
