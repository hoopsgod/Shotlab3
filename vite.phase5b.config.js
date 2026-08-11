import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import { createCssModuleDeadSelectorPruner } from './scripts/css-module-dead-selector-pruner.mjs'

const COACH_COMMAND_CENTER_SUFFIX = '/src/components/CoachCommandCenter.jsx'
const RETAINED_MISSION_CONTROL_MODULE = '\0shotlab-retained-mission-control-legacy'
const RETIRED_MISSION_CONTROL_MODULE = '\0shotlab-retired-mission-control-css'
const RETAINED_MISSION_CONTROL_STYLE_ID = 'shotlab-retained-mission-control-css'
const RETAINED_MISSION_CONTROL_CSS = `.mcShellV3 .mcRafters{position:absolute;z-index:1;inset:0 0 46% 43%;overflow:hidden;opacity:.36}.mcShellV3 .mcRafters span{position:absolute;left:-10%;right:-8%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);transform-origin:center}.mcShellV3 .mcRafters span:nth-child(1){top:18%;transform:rotate(-8deg)}.mcShellV3 .mcRafters span:nth-child(2){top:43%;transform:rotate(7deg)}.mcShellV3 .mcRafters span:nth-child(3){left:23%;top:-15%;bottom:-12%;right:auto;width:1px;height:auto;transform:rotate(13deg)}.mcShellV3 .mcRafters span:nth-child(4){left:58%;top:-18%;bottom:-8%;right:auto;width:1px;height:auto;transform:rotate(-11deg)}.mcShellV3 .mcRailBrand{width:96px;min-height:104px;margin:10px auto 5px;padding:7px 4px;border:0;display:grid;place-items:center;background:transparent;cursor:pointer}.mcShellV3 .mcRailBrand .mcRailLogo{width:86px;height:86px;margin:0;object-fit:contain;filter:drop-shadow(0 0 13px color-mix(in srgb,var(--mc) 24%,transparent))}.mcShellV3 .mcDrawerLogo{width:60px!important;height:60px!important;padding:0!important;border:0!important;background:transparent!important}.mcShellV3 .mcDrawerLogo img{width:60px!important;height:60px!important;object-fit:contain}`

const MISSION_CONTROL_REPLACEMENTS = new Map([
  ['./CoachMissionControlHeader.css', RETAINED_MISSION_CONTROL_MODULE],
  ['./CoachMissionControlPolish.css', RETIRED_MISSION_CONTROL_MODULE],
  ['./CoachMissionControl2026.css', RETIRED_MISSION_CONTROL_MODULE],
])

function normalizeModuleId(id = '') {
  return String(id).replaceAll('\\', '/')
}

function retainedMissionControlModule() {
  return `const id=${JSON.stringify(RETAINED_MISSION_CONTROL_STYLE_ID)};if(typeof document!=="undefined"&&!document.getElementById(id)){const style=document.createElement("style");style.id=id;style.textContent=${JSON.stringify(RETAINED_MISSION_CONTROL_CSS)};document.head.appendChild(style)}`
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
      if (id === RETAINED_MISSION_CONTROL_MODULE) return retainedMissionControlModule()
      if (id === RETIRED_MISSION_CONTROL_MODULE) return ''
      return null
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
