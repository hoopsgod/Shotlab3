import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pruneOverriddenCoachDeclarations } from './prune-overridden-coach-declarations.mjs'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const AUTHORITY_BUNDLE = /^shotlab-authority-(\d+)\.css$/
const BOUNDARY = '\n@__shotlab_bundle_boundary;\n'

export function pruneOverriddenAuthorityBundles(sources) {
  if (!Array.isArray(sources) || sources.length < 2) {
    return { sources: Array.isArray(sources) ? [...sources] : [], removedDeclarations: 0, rawBytesRemoved: 0 }
  }

  for (const source of sources) {
    if (source.includes(BOUNDARY.trim())) {
      throw new Error('Authority bundle contains the reserved cross-bundle pruning boundary marker')
    }
  }

  // The authority bundles are emitted as one ordered, always-loaded cascade and
  // are split only to stay below the per-file CSS ceiling. Recombine them only
  // for cascade analysis so an exact selector/property override that crosses
  // that artificial file boundary can be removed from the earlier bundle.
  // A temporary semicolon-terminated at-rule marks the file boundary because
  // the existing parser skips standalone at-rules without contaminating the
  // following selector. The marker is split back out before any CSS is written.
  // The existing conservative declaration pruner preserves media/supports/
  // container context, !important behavior, and does not perform reachability
  // guesses or shorthand/property inference.
  const combined = sources.join(BOUNDARY)
  const result = pruneOverriddenCoachDeclarations(combined)
  const nextSources = result.css.split(BOUNDARY)

  if (nextSources.length !== sources.length) {
    throw new Error(`Authority bundle boundary count changed during pruning (${nextSources.length} != ${sources.length})`)
  }

  return {
    sources: nextSources,
    removedDeclarations: result.removedDeclarations,
    rawBytesRemoved: result.rawBytesRemoved,
  }
}

async function main() {
  const entries = await readdir(DIST_DIR, { withFileTypes: true })
  const bundles = entries
    .filter((entry) => entry.isFile() && AUTHORITY_BUNDLE.test(entry.name))
    .map((entry) => ({ name: entry.name, index: Number(entry.name.match(AUTHORITY_BUNDLE)[1]) }))
    .sort((a, b) => a.index - b.index)

  if (bundles.length < 2) {
    console.log('Fewer than two ShotLab authority bundles found; no cross-bundle override pruning required.')
    return
  }

  const sources = await Promise.all(bundles.map(({ name }) => readFile(path.join(DIST_DIR, name), 'utf8')))
  const result = pruneOverriddenAuthorityBundles(sources)

  await Promise.all(result.sources.map((source, index) => {
    if (source === sources[index]) return Promise.resolve()
    return writeFile(path.join(DIST_DIR, bundles[index].name), source)
  }))

  console.log(`Pruned ${result.removedDeclarations} exact cross-bundle authority declarations; saved ${(result.rawBytesRemoved / 1024).toFixed(1)} KiB raw before final CSS compaction.`)
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (entryPath && entryPath === path.resolve(fileURLToPath(import.meta.url))) {
  await main()
}
