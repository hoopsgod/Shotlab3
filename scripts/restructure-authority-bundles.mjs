import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { minify } from 'csso'
import { rebalanceAuthorityBundles, safeTopLevelBoundaries } from './rebalance-authority-bundles.mjs'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const AUTHORITY_BUNDLE = /^shotlab-authority-(\d+)\.css$/
const MAX_AUTHORITY_BUNDLE_BYTES = 124_000
const UNSAFE_STYLESHEET_SCOPED_DIRECTIVE = /@(charset|import|namespace)\b/i

function gzipBytes(source) {
  return gzipSync(Buffer.from(source), { level: 9 }).byteLength
}

function chooseSafeInitialSplit(source, maxBytes) {
  const boundaries = safeTopLevelBoundaries(source)
  let best = null
  for (const boundary of boundaries) {
    if (boundary <= 0 || boundary >= source.length) continue
    const leftBytes = Buffer.byteLength(source.slice(0, boundary))
    const rightBytes = Buffer.byteLength(source.slice(boundary))
    if (leftBytes > maxBytes || rightBytes > maxBytes) continue
    const imbalance = Math.abs(leftBytes - rightBytes)
    if (!best || imbalance < best.imbalance) best = { boundary, imbalance }
  }
  return best?.boundary || null
}

export function restructureAuthorityBundles(sources, { maxBytes = MAX_AUTHORITY_BUNDLE_BYTES } = {}) {
  const originalSources = Array.isArray(sources) ? [...sources] : []
  const originalGzipBytes = originalSources.reduce((sum, source) => sum + gzipBytes(source), 0)
  if (originalSources.length !== 2) {
    return { sources: originalSources, changed: false, skipped: 'bundle-count', originalGzipBytes, optimizedGzipBytes: originalGzipBytes, savedGzipBytes: 0 }
  }

  const combined = originalSources.join('')
  // @charset, @import and @namespace have stylesheet-scoped placement/meaning.
  // They are not expected in the post-Vite authority payload, but refuse to
  // combine stylesheets if one ever appears rather than assuming equivalence.
  if (UNSAFE_STYLESHEET_SCOPED_DIRECTIVE.test(combined)) {
    return { sources: originalSources, changed: false, skipped: 'stylesheet-scoped-directive', originalGzipBytes, optimizedGzipBytes: originalGzipBytes, savedGzipBytes: 0 }
  }

  const optimized = minify(combined, {
    filename: 'shotlab-authority-combined.css',
    restructure: true,
    comments: false,
  }).css
  const split = chooseSafeInitialSplit(optimized, maxBytes)
  if (!split) {
    return { sources: originalSources, changed: false, skipped: 'no-safe-split', originalGzipBytes, optimizedGzipBytes: originalGzipBytes, savedGzipBytes: 0 }
  }

  const provisional = [optimized.slice(0, split), optimized.slice(split)]
  const rebalanced = rebalanceAuthorityBundles(provisional, { maxBytes })
  const optimizedGzipBytes = rebalanced.sources.reduce((sum, source) => sum + gzipBytes(source), 0)

  // Keep this optimization strictly monotonic. If cross-bundle restructuring
  // does not improve the exact gzip metric used by the production budget,
  // retain the already-certified input byte-for-byte.
  if (optimizedGzipBytes >= originalGzipBytes) {
    return { sources: originalSources, changed: false, skipped: 'no-gzip-win', originalGzipBytes, optimizedGzipBytes: originalGzipBytes, savedGzipBytes: 0 }
  }

  return {
    sources: rebalanced.sources,
    changed: true,
    skipped: null,
    originalGzipBytes,
    optimizedGzipBytes,
    savedGzipBytes: originalGzipBytes - optimizedGzipBytes,
    rawBytesSaved: Buffer.byteLength(combined) - rebalanced.sources.reduce((sum, source) => sum + Buffer.byteLength(source), 0),
    bundleBytes: rebalanced.sources.map((source) => Buffer.byteLength(source)),
  }
}

async function main() {
  const entries = await readdir(DIST_DIR, { withFileTypes: true })
  const bundles = entries
    .filter((entry) => entry.isFile() && AUTHORITY_BUNDLE.test(entry.name))
    .map((entry) => ({ name: entry.name, index: Number(entry.name.match(AUTHORITY_BUNDLE)[1]) }))
    .sort((a, b) => a.index - b.index)

  if (bundles.length !== 2) {
    console.log(`Expected exactly two ShotLab authority bundles; found ${bundles.length}. Cross-bundle restructure skipped.`)
    return
  }

  const sources = await Promise.all(bundles.map(({ name }) => readFile(path.join(DIST_DIR, name), 'utf8')))
  const result = restructureAuthorityBundles(sources)

  if (result.changed) {
    await Promise.all(result.sources.map((source, index) => writeFile(path.join(DIST_DIR, bundles[index].name), source)))
  }

  console.log(`Authority cascade restructure: ${result.changed ? `${result.bundleBytes.join(' / ')} raw bytes; gzip ${result.originalGzipBytes} -> ${result.optimizedGzipBytes} (${result.savedGzipBytes} B saved)` : `skipped (${result.skipped || 'unchanged'})`}.`)
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (entryPath && entryPath === path.resolve(fileURLToPath(import.meta.url))) {
  await main()
}
