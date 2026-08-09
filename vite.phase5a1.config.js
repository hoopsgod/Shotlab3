import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import baseConfig from './vite.config.js'

const normalize = (value = '') => String(value).replaceAll('\\', '/')

function reportRenderedModuleWeight() {
  return {
    name: 'shotlab-phase5a1-rendered-module-weight',
    apply: 'build',
    async generateBundle(_options, bundle) {
      const chunks = []

      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue

        const modules = Object.entries(output.modules || {})
          .filter(([id]) => normalize(id).includes('/src/'))
          .map(([id, details]) => ({
            path: normalize(id).replace(/^.*\/src\//, 'src/'),
            renderedLength: details.renderedLength || 0,
            originalLength: details.originalLength || 0,
            renderedExports: details.renderedExports || [],
            removedExports: details.removedExports || [],
          }))
          .sort((a, b) => b.renderedLength - a.renderedLength)

        chunks.push({
          chunk: output.name,
          file: output.fileName,
          renderedLength: modules.reduce((sum, module) => sum + module.renderedLength, 0),
          modules,
        })
      }

      chunks.sort((a, b) => b.renderedLength - a.renderedLength)
      const dir = path.resolve(process.cwd(), 'artifacts/performance')
      await mkdir(dir, { recursive: true })
      await writeFile(
        path.join(dir, 'rendered-module-weight.json'),
        `${JSON.stringify({ generatedAt: new Date().toISOString(), chunks }, null, 2)}\n`,
      )
    },
  }
}

export default {
  ...baseConfig,
  plugins: [...(baseConfig.plugins || []), reportRenderedModuleWeight()],
}
