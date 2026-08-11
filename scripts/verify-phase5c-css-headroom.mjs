import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const distDir = path.resolve('dist')
const assetsDir = path.join(distDir, 'assets')
const MAX_LARGEST_CSS_BYTES = 125_000
const MAX_TOTAL_CSS_GZIP_BYTES = 87_000

function collectCssFiles(directory) {
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...collectCssFiles(fullPath))
    else if (entry.isFile() && entry.name.endsWith('.css')) files.push(fullPath)
  }
  return files
}

const files = collectCssFiles(distDir)
if (!files.length) throw new Error('Phase 5C could not find production CSS assets')

const metrics = files.map((file) => {
  const bytes = fs.readFileSync(file)
  return {
    file: path.relative(distDir, file).replaceAll('\\', '/'),
    bytes: bytes.byteLength,
    gzipBytes: gzipSync(bytes, { level: 9 }).byteLength,
  }
}).sort((a, b) => b.bytes - a.bytes)

const largest = metrics[0]
const totalGzipBytes = metrics.reduce((sum, metric) => sum + metric.gzipBytes, 0)
const failures = []

if (largest.bytes > MAX_LARGEST_CSS_BYTES) {
  failures.push(`largest CSS ${largest.file} is ${largest.bytes} bytes; Phase 5C reserve target is ${MAX_LARGEST_CSS_BYTES}`)
}
if (totalGzipBytes > MAX_TOTAL_CSS_GZIP_BYTES) {
  failures.push(`total CSS gzip is ${totalGzipBytes} bytes; Phase 5C reserve target is ${MAX_TOTAL_CSS_GZIP_BYTES}`)
}

console.log(`Phase 5C CSS reserve: largest ${largest.bytes}/${MAX_LARGEST_CSS_BYTES} bytes; total gzip ${totalGzipBytes}/${MAX_TOTAL_CSS_GZIP_BYTES} bytes`)

if (failures.length) {
  throw new Error(`Phase 5C durable headroom gate failed:\n- ${failures.join('\n- ')}`)
}

console.log('Phase 5C durable CSS headroom: PASS')
