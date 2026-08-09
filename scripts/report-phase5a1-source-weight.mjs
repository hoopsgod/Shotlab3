import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const ownershipPath = path.join(root, 'artifacts/performance/bundle-ownership.json')
const reportPath = path.join(root, 'artifacts/performance/source-weight.json')

const normalize = (value = '') => String(value).replaceAll('\\', '/')
const stripQuery = (value = '') => value.split('?')[0]

const ownership = JSON.parse(await readFile(ownershipPath, 'utf8'))
const chunks = []

for (const chunk of ownership) {
  const modules = []
  let sourceBytes = 0

  for (const moduleId of chunk.modules || []) {
    const normalized = normalize(stripQuery(moduleId))
    const marker = '/src/'
    const markerIndex = normalized.lastIndexOf(marker)
    if (markerIndex === -1) continue

    const relativePath = normalized.slice(markerIndex + 1)
    const absolutePath = path.join(root, relativePath)

    try {
      const details = await stat(absolutePath)
      sourceBytes += details.size
      modules.push({ path: relativePath, sourceBytes: details.size })
    } catch {
      modules.push({ path: relativePath, sourceBytes: null })
    }
  }

  modules.sort((a, b) => (b.sourceBytes || 0) - (a.sourceBytes || 0))
  chunks.push({
    chunk: chunk.name,
    file: chunk.file,
    sourceBytes,
    modules,
  })
}

chunks.sort((a, b) => b.sourceBytes - a.sourceBytes)
await mkdir(path.dirname(reportPath), { recursive: true })
await writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), chunks }, null, 2)}\n`)

console.log('Phase 5A.1 source-weight report')
for (const chunk of chunks) {
  console.log(`\n${chunk.chunk}: ${(chunk.sourceBytes / 1024).toFixed(1)} KiB source`)
  for (const module of chunk.modules.slice(0, 12)) {
    const size = module.sourceBytes == null ? 'unknown' : `${(module.sourceBytes / 1024).toFixed(1)} KiB`
    console.log(`  ${size.padStart(10)}  ${module.path}`)
  }
}
