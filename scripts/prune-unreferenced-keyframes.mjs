import { readFile, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const DIST_ASSETS = path.join(DIST_DIR, 'assets')
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/
const TEXT_ASSET = /\.(?:css|js|mjs|cjs|html)$/i

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findMatchingBrace(source, openIndex) {
  let depth = 1
  let quote = ''
  let comment = false
  for (let index = openIndex + 1; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]
    if (comment) {
      if (char === '*' && next === '/') { comment = false; index += 1 }
      continue
    }
    if (quote) {
      if (char === '\\') index += 1
      else if (char === quote) quote = ''
      continue
    }
    if (char === '/' && next === '*') { comment = true; index += 1; continue }
    if (char === '"' || char === "'") { quote = char; continue }
    if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

export function collectKeyframeDefinitions(source) {
  const definitions = []
  const pattern = /@(?:-webkit-)?keyframes\s+([A-Za-z_][\w-]*)\s*\{/gi
  for (const match of source.matchAll(pattern)) {
    const openIndex = match.index + match[0].lastIndexOf('{')
    const closeIndex = findMatchingBrace(source, openIndex)
    if (closeIndex < 0) continue
    definitions.push({
      name: match[1],
      start: match.index,
      end: closeIndex + 1,
    })
  }
  return definitions
}

function blankRanges(source, ranges) {
  if (!ranges.length) return source
  const sorted = [...ranges].sort((a, b) => b.start - a.start)
  let output = source
  for (const range of sorted) {
    output = `${output.slice(0, range.start)}${' '.repeat(range.end - range.start)}${output.slice(range.end)}`
  }
  return output
}

export function findUnreferencedKeyframeNames(source, externalCorpus = '') {
  const definitions = collectKeyframeDefinitions(source)
  if (!definitions.length) return { definitions, unreferencedNames: new Set() }

  const sourceWithoutDefinitions = blankRanges(source, definitions)
  const corpus = `${sourceWithoutDefinitions}\n${externalCorpus}`
  const names = new Set(definitions.map((definition) => definition.name))
  const unreferencedNames = new Set()

  for (const name of names) {
    const referencePattern = new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegExp(name)}([^A-Za-z0-9_-]|$)`)
    if (!referencePattern.test(corpus)) unreferencedNames.add(name)
  }

  return { definitions, unreferencedNames }
}

export function pruneUnreferencedKeyframes(source, externalCorpus = '') {
  const { definitions, unreferencedNames } = findUnreferencedKeyframeNames(source, externalCorpus)
  const removals = definitions.filter((definition) => unreferencedNames.has(definition.name))
  if (!removals.length) {
    return { css: source, removedNames: [], removedBlocks: 0, rawBytesRemoved: 0 }
  }

  const removedNames = [...new Set(removals.map((definition) => definition.name))].sort()
  const rawBytesRemoved = removals.reduce((total, range) => total + range.end - range.start, 0)
  let css = source
  for (const range of removals.sort((a, b) => b.start - a.start)) {
    css = `${css.slice(0, range.start)}${css.slice(range.end)}`
  }
  return { css, removedNames, removedBlocks: removals.length, rawBytesRemoved }
}

async function listTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await listTextFiles(fullPath))
    else if (entry.isFile() && TEXT_ASSET.test(entry.name)) files.push(fullPath)
  }
  return files
}

async function main() {
  const assetEntries = await readdir(DIST_ASSETS, { withFileTypes: true })
  const coachName = assetEntries.find((entry) => entry.isFile() && COACH_WORKSPACE_ASSET.test(entry.name))?.name
  if (!coachName) {
    console.log('CoachWorkspaces CSS asset not found; no keyframes pruned.')
    return
  }

  const coachPath = path.join(DIST_ASSETS, coachName)
  const textFiles = await listTextFiles(DIST_DIR)
  const externalChunks = []
  for (const file of textFiles) {
    if (path.resolve(file) === path.resolve(coachPath)) continue
    externalChunks.push(await readFile(file, 'utf8'))
  }

  const source = await readFile(coachPath, 'utf8')
  const result = pruneUnreferencedKeyframes(source, externalChunks.join('\n'))
  if (result.css !== source) await writeFile(coachPath, result.css)

  console.log(
    `Pruned ${result.removedBlocks} unreferenced Coach keyframe blocks (${result.removedNames.join(', ') || 'none'}); saved ${(result.rawBytesRemoved / 1024).toFixed(1)} KiB raw.`,
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  await main()
}
