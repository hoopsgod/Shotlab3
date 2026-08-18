import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const AUTHORITY_BUNDLE = /^shotlab-authority-(\d+)\.css$/
const MAX_AUTHORITY_BUNDLE_BYTES = 124_000

function gzipBytes(source) {
  return gzipSync(Buffer.from(source), { level: 9 }).byteLength
}

function safeTopLevelBoundaries(source) {
  const boundaries = new Set()
  let quote = ''
  let comment = false
  let escaped = false
  let braces = 0
  let parens = 0
  let brackets = 0

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (comment) {
      if (char === '*' && next === '/') {
        comment = false
        index += 1
      }
      continue
    }

    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === quote) quote = ''
      continue
    }

    if (char === '/' && next === '*') {
      comment = true
      index += 1
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (char === '(') parens += 1
    else if (char === ')') parens = Math.max(0, parens - 1)
    else if (char === '[') brackets += 1
    else if (char === ']') brackets = Math.max(0, brackets - 1)
    else if (parens === 0 && brackets === 0 && char === '{') braces += 1
    else if (parens === 0 && brackets === 0 && char === '}') {
      braces = Math.max(0, braces - 1)
      if (braces === 0) boundaries.add(index + 1)
    } else if (braces === 0 && parens === 0 && brackets === 0 && char === ';') {
      boundaries.add(index + 1)
    }
  }

  return [...boundaries].sort((a, b) => a - b)
}

export function rebalanceAuthorityBundles(sources, { maxBytes = MAX_AUTHORITY_BUNDLE_BYTES } = {}) {
  if (!Array.isArray(sources) || sources.length !== 2) {
    return {
      sources: Array.isArray(sources) ? [...sources] : [],
      changed: false,
      originalGzipBytes: Array.isArray(sources) ? sources.reduce((sum, source) => sum + gzipBytes(source), 0) : 0,
      optimizedGzipBytes: Array.isArray(sources) ? sources.reduce((sum, source) => sum + gzipBytes(source), 0) : 0,
    }
  }

  const combined = sources.join('')
  const originalBoundary = sources[0].length
  const candidateBoundaries = new Set([originalBoundary, ...safeTopLevelBoundaries(combined)])
  const originalGzipBytes = sources.reduce((sum, source) => sum + gzipBytes(source), 0)
  let best = {
    boundary: originalBoundary,
    sources: [...sources],
    gzipBytes: originalGzipBytes,
  }

  for (const boundary of candidateBoundaries) {
    if (boundary <= 0 || boundary >= combined.length) continue
    const left = combined.slice(0, boundary)
    const right = combined.slice(boundary)
    const leftBytes = Buffer.byteLength(left)
    const rightBytes = Buffer.byteLength(right)
    if (leftBytes > maxBytes || rightBytes > maxBytes) continue
    const candidateGzipBytes = gzipBytes(left) + gzipBytes(right)
    if (candidateGzipBytes >= best.gzipBytes) continue
    best = { boundary, sources: [left, right], gzipBytes: candidateGzipBytes }
  }

  return {
    sources: best.sources,
    changed: best.boundary !== originalBoundary,
    originalGzipBytes,
    optimizedGzipBytes: best.gzipBytes,
    savedGzipBytes: originalGzipBytes - best.gzipBytes,
    bundleBytes: best.sources.map((source) => Buffer.byteLength(source)),
  }
}

async function main() {
  const entries = await readdir(DIST_DIR, { withFileTypes: true })
  const bundles = entries
    .filter((entry) => entry.isFile() && AUTHORITY_BUNDLE.test(entry.name))
    .map((entry) => ({ name: entry.name, index: Number(entry.name.match(AUTHORITY_BUNDLE)[1]) }))
    .sort((a, b) => a.index - b.index)

  if (bundles.length !== 2) {
    console.log(`Expected exactly two ShotLab authority bundles; found ${bundles.length}. Rebalancing skipped.`)
    return
  }

  const sources = await Promise.all(bundles.map(({ name }) => readFile(path.join(DIST_DIR, name), 'utf8')))
  const result = rebalanceAuthorityBundles(sources)

  if (result.changed) {
    await Promise.all(result.sources.map((source, index) => writeFile(path.join(DIST_DIR, bundles[index].name), source)))
  }

  console.log(`Authority bundle rebalance: ${result.bundleBytes?.join(' / ') || 'unchanged'} raw bytes; gzip ${result.originalGzipBytes} -> ${result.optimizedGzipBytes} (${result.savedGzipBytes || 0} B saved).`)
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (entryPath && entryPath === path.resolve(fileURLToPath(import.meta.url))) {
  await main()
}
