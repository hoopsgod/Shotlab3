import { readFile, readdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { minify } from 'terser'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const gzipBytes = (value) => gzipSync(value, { level: 9 }).byteLength
const CANDIDATE_OPTIONS = [
  { passes: 5, quoteStyle: 0 },
  { passes: 5, quoteStyle: 1 },
  { passes: 5, quoteStyle: 2 },
  { passes: 3, quoteStyle: 0 },
  { passes: 8, quoteStyle: 0 },
]
const APP_DOMAIN_OPTIONS = [
  { passes: 10, quoteStyle: 0 },
  { passes: 12, quoteStyle: 0 },
  { passes: 16, quoteStyle: 0 },
  { passes: 20, quoteStyle: 0 },
  { passes: 8, quoteStyle: 1 },
  { passes: 8, quoteStyle: 2 },
  { passes: 10, quoteStyle: 1 },
  { passes: 10, quoteStyle: 2 },
  { passes: 8, quoteStyle: 0, compress: { hoist_props: false } },
  { passes: 8, quoteStyle: 0, compress: { collapse_vars: false } },
  { passes: 8, quoteStyle: 0, compress: { reduce_vars: false } },
  { passes: 8, quoteStyle: 0, compress: { sequences: false } },
  { passes: 8, quoteStyle: 0, compress: { join_vars: false } },
  { passes: 8, quoteStyle: 0, compress: { hoist_funs: true } },
  { passes: 8, quoteStyle: 0, compress: { hoist_vars: true } },
  { passes: 8, quoteStyle: 0, format: { semicolons: false } },
  { passes: 10, quoteStyle: 0, format: { semicolons: false } },
]

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

async function minifyCandidate(source, { passes, quoteStyle, compress = {}, format = {} }) {
  const result = await minify(source, {
    ecma: 2022,
    module: true,
    compress: {
      passes,
      toplevel: true,
      pure_funcs: ['console.log', 'console.debug', 'console.info'],
      ...compress,
    },
    mangle: { toplevel: true },
    format: { comments: false, quote_style: quoteStyle, ...format },
  })
  return result.code || source
}

async function recompress(file) {
  const source = await readFile(file, 'utf8')
  const options = path.basename(file).startsWith('AppDomainServices-')
    ? [...CANDIDATE_OPTIONS, ...APP_DOMAIN_OPTIONS]
    : CANDIDATE_OPTIONS
  const candidates = await Promise.all(options.map((candidate) => minifyCandidate(source, candidate)))
  const output = candidates.reduce((best, candidate) => {
    const bestGzip = gzipBytes(best)
    const candidateGzip = gzipBytes(candidate)
    if (candidateGzip !== bestGzip) return candidateGzip < bestGzip ? candidate : best
    return Buffer.byteLength(candidate) < Buffer.byteLength(best) ? candidate : best
  }, source)
  if (output === source) {
    return { changed: false, sourceBytes: Buffer.byteLength(source), outputBytes: Buffer.byteLength(source) }
  }
  await writeFile(file, output)
  return { changed: true, sourceBytes: Buffer.byteLength(source), outputBytes: Buffer.byteLength(output) }
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

console.log(`Recompressed ${changedFiles}/${files.length} production JavaScript files with gzip-aware output selection; raw delta ${((sourceBytes - outputBytes) / 1024).toFixed(1)} KiB.`)
