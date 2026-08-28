import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { transform as transformCss } from 'lightningcss'
import { minify } from 'terser'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const LEGACY_STYLE_SOURCE = path.resolve(process.cwd(), 'src/styles/appLegacyStyles.js')
const LEGACY_STYLE_EXPORTS = ['_STYLES_CSS', '_PAGE_SIGNATURE_CSS', '_DESKTOP_SHELL_CSS', '_PLAYER_COMPACT_DASHBOARD_CSS']

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await listJavaScriptFiles(fullPath))
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(fullPath)
  }
  return files
}

async function recompress(file) {
  const source = await readFile(file, 'utf8')
  const result = await minify(source, {
    ecma: 2022,
    module: true,
    compress: {
      passes: 5,
      toplevel: true,
      pure_funcs: ['console.log', 'console.debug', 'console.info'],
    },
    mangle: { toplevel: true },
    format: { comments: false },
  })
  const output = result.code || source
  if (Buffer.byteLength(output) >= Buffer.byteLength(source)) {
    return { changed: false, sourceBytes: Buffer.byteLength(source), outputBytes: Buffer.byteLength(source) }
  }
  await writeFile(file, output)
  return { changed: true, sourceBytes: Buffer.byteLength(source), outputBytes: Buffer.byteLength(output) }
}

function extractLegacyStyleTemplate(source, exportName) {
  const openingMarker = `export const ${exportName}=\``
  const openingIndex = source.indexOf(openingMarker)
  if (openingIndex === -1) throw new Error(`Legacy style export ${exportName} was not found while reporting transfer headroom.`)
  const valueStart = openingIndex + openingMarker.length
  const valueEnd = source.indexOf('`;', valueStart)
  if (valueEnd === -1) throw new Error(`Legacy style export ${exportName} is not terminated while reporting transfer headroom.`)
  return source.slice(valueStart, valueEnd)
}

function compactLegacyStyleForMeasurement(template, exportName) {
  const tokenized = template.replace(/\$\{([A-Z_]+)\}/g, (_match, tokenName) => `var(--slbt-${tokenName.toLowerCase().replaceAll('_', '-')})`)
  return transformCss({
    filename: `${exportName}.css`,
    code: Buffer.from(tokenized),
    minify: true,
    sourceMap: false,
  }).code
}

async function reportLegacyStyleTransferHeadroom() {
  const source = await readFile(LEGACY_STYLE_SOURCE, 'utf8')
  const rows = LEGACY_STYLE_EXPORTS.map((exportName) => {
    const compact = compactLegacyStyleForMeasurement(extractLegacyStyleTemplate(source, exportName), exportName)
    return {
      exportName,
      rawBytes: compact.byteLength,
      gzipBytes: gzipSync(compact, { level: 9 }).byteLength,
    }
  })
  const totalRaw = rows.reduce((sum, row) => sum + row.rawBytes, 0)
  const totalGzip = rows.reduce((sum, row) => sum + row.gzipBytes, 0)
  console.log('Legacy runtime style transfer candidates:')
  for (const row of rows) console.log(` - ${row.exportName}: ${(row.rawBytes / 1024).toFixed(1)} KiB raw, ${(row.gzipBytes / 1024).toFixed(1)} KiB gzip`)
  console.log(` - total: ${(totalRaw / 1024).toFixed(1)} KiB raw, ${(totalGzip / 1024).toFixed(1)} KiB gzip`)
}

const files = await listJavaScriptFiles(DIST_DIR)
let changedFiles = 0
let sourceBytes = 0
let outputBytes = 0
for (const file of files) {
  const result = await recompress(file)
  sourceBytes += result.sourceBytes
  outputBytes += result.outputBytes
  if (result.changed) changedFiles += 1
}

console.log(`Recompressed ${changedFiles}/${files.length} production JavaScript files with the existing Terser toolchain; saved ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB raw.`)
await reportLegacyStyleTransferHeadroom()
