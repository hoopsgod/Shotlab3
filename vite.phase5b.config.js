import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import { createCssModuleDeadSelectorPruner } from './scripts/css-module-dead-selector-pruner.mjs'

const COACH_COMMAND_CENTER_SUFFIX = '/src/components/CoachCommandCenter.jsx'
const SUPERSEDED_MISSION_CONTROL_CSS = new Set([
  './CoachMissionControlPolish.css',
  './CoachMissionControl2026.css',
  './CoachMissionControlFinal.css',
])
const RETIRED_COACH_CSS_MODULE = '\0shotlab-retired-mission-control-css'

function normalizeModuleId(id = '') {
  return String(id).replaceAll('\\', '/')
}

function retireSupersededMissionControlCss() {
  return {
    name: 'shotlab-retire-superseded-mission-control-css',
    apply: 'build',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!SUPERSEDED_MISSION_CONTROL_CSS.has(source)) return null
      if (!normalizeModuleId(importer).endsWith(COACH_COMMAND_CENTER_SUFFIX)) return null
      return RETIRED_COACH_CSS_MODULE
    },
    load(id) {
      if (id === RETIRED_COACH_CSS_MODULE) return 'export default undefined'
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
