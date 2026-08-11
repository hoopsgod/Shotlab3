import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import { createCssModuleDeadSelectorPruner } from './scripts/css-module-dead-selector-pruner.mjs'

const COACH_COMMAND_CENTER_SUFFIX = '/src/components/CoachCommandCenter.jsx'
const COACH_MISSION_CONTROL_V2_SUFFIX = '/src/components/CoachMissionControlV2.css'
const RETAINED_MISSION_CONTROL_MODULE = '\0shotlab-retained-mission-control-legacy.css'
const RETIRED_MISSION_CONTROL_MODULE = '\0shotlab-retired-mission-control-css.css'
const RETAINED_MISSION_CONTROL_CSS = `.mcRafters{position:absolute;z-index:1;inset:0 0 46% 43%;overflow:hidden}.mcRafters span{position:absolute;background:linear-gradient(90deg,#0000,#ffffff11,#0000)}.mcRafters span:nth-child(-n+2){left:-10%;right:-8%;height:1px}.mcRafters span:first-child{top:18%;transform:rotate(-8deg)}.mcRafters span:nth-child(2){top:43%;transform:rotate(7deg)}.mcRafters span:nth-child(3){left:23%;top:-15%;bottom:-12%;width:1px;transform:rotate(13deg)}.mcRafters span:nth-child(4){left:58%;top:-18%;bottom:-8%;width:1px;transform:rotate(-11deg)}.mcRailBrand{width:96px;margin:10px auto 5px;padding:7px 4px;border:0;display:grid;place-items:center;background:0 0}.mcRailBrand .mcRailLogo{width:86px;height:86px;margin:0}.mcDrawerLogo{width:60px!important;height:60px!important;padding:0!important;border:0!important;background:0 0!important}.mcDrawerLogo img{width:60px!important;height:60px!important}`

const MISSION_CONTROL_REPLACEMENTS = new Map([
  ['./CoachMissionControlHeader.css', RETAINED_MISSION_CONTROL_MODULE],
  ['./CoachMissionControlPolish.css', RETIRED_MISSION_CONTROL_MODULE],
  ['./CoachMissionControl2026.css', RETIRED_MISSION_CONTROL_MODULE],
])

const DEAD_BRAND_IMAGE_RULES = [
  '.mcBrandLockup img{display:none;width:42px;height:42px;object-fit:contain}',
  '.mcBrandLockup img{display:block}',
  '.mcBrandLockup img{width:34px;height:34px}',
]

function normalizeModuleId(id = '') {
  return String(id).replaceAll('\\', '/')
}

function stripDeadBrandImageRules(source) {
  let output = source
  for (const rule of DEAD_BRAND_IMAGE_RULES) {
    if (!output.includes(rule)) {
      throw new Error(`Phase 5B expected dead Coach brand-image rule is missing: ${rule}`)
    }
    output = output.replace(rule, '')
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
      return { code: stripDeadBrandImageRules(source), map: null }
    },
  }
}

export default defineConfig(async (environment) => {
  const resolvedBase = typeof baseConfig === 'function' ? await baseConfig(environment) : baseConfig
  return {
    ...resolvedBase,
    plugins: [
      retireSupersededMissionControlCss(),
      createCssModuleDeadSelectorPruner(),
      ...(resolvedBase.plugins || []),
    ],
  }
})
