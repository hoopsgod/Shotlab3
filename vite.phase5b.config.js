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
const RETAINED_MISSION_CONTROL_CSS = `@media(min-width:981px){.mcShellV3{grid-template-columns:184px minmax(0,1fr)}.mcRail{align-items:stretch;background:linear-gradient(180deg,var(--team-brand-surface-deep,#061827),#03111d)}.mcRailBrand{width:auto;min-height:76px;margin:0;padding:0 18px;place-items:center start;border:0;border-bottom:1px solid #ffffff14;background:0 0}.mcRailBrand:after{content:"SHOTLAB";color:#f5f7f3;font:italic 900 24px/.9 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.035em}.mcRailBrand .mcRailLogo{display:none;width:86px;height:86px}.mcRail nav{width:100%;gap:4px;padding:20px 10px}.mcRail nav button{min-height:46px;padding:0 12px;border:0;border-radius:8px;grid-template-columns:22px minmax(0,1fr);place-items:center start;align-content:center;column-gap:10px;background:0 0;color:#e8edf0}.mcRail nav button svg{width:18px;height:18px}.mcRail nav button span{font-size:13px}.mcRail nav button.is-active{color:color-mix(in srgb,var(--mc) 86%,white);background:#ffffff0e;box-shadow:inset 3px 0 0 var(--mc)}.mcHeader{min-height:62px;padding:0 28px;border:0;border-bottom:1px solid #1018201a;border-radius:0;background:#f7f3ea;color:#101820;box-shadow:none}.mcHeader:after{display:none}.mcBrandLockup{display:flex;align-items:center;gap:10px}.mcBrandCopy small{color:#7d8589}.mcBrandCopy strong{color:#101820;text-transform:none}.mcTeamSelect,.mcBell{height:36px;border:1px solid #1018201f;border-radius:7px;background:#f7f3ea;color:#101820;box-shadow:none}.mcTeamSelect{min-width:144px}.mcBell{width:36px;min-width:36px;min-height:36px}}.mcDrawerBrand .mcDrawerLogo{width:60px;height:60px;padding:0;border:0;background:0 0}.mcDrawerLogo img{width:60px;height:60px}`

const MISSION_CONTROL_REPLACEMENTS = new Map([
  ['./CoachMissionControlHeader.css', RETAINED_MISSION_CONTROL_MODULE],
  ['./CoachMissionControlPolish.css', RETIRED_MISSION_CONTROL_MODULE],
  ['./CoachMissionControl2026.css', RETIRED_MISSION_CONTROL_MODULE],
])

/* V2 was consolidated in Phase 4.8. Only the live drawer image rule still
   overlaps the retained production module; retired BrandLockup/RailLogo anchors
   must not be required or a valid source cleanup will fail the production build. */
const V2_PRODUCTION_REWRITES = [
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
