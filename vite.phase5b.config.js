import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'
import { createCssModuleDeadSelectorPruner } from './scripts/css-module-dead-selector-pruner.mjs'

export default defineConfig(async (environment) => {
  const resolvedBase = typeof baseConfig === 'function' ? await baseConfig(environment) : baseConfig
  return {
    ...resolvedBase,
    plugins: [
      createCssModuleDeadSelectorPruner(),
      ...(resolvedBase.plugins || []),
    ],
  }
})
