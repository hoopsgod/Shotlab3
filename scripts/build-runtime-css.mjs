import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

export const RUNTIME_CSS_OUTPUT = 'shotlab-runtime.css'
export const RUNTIME_CSS_MANIFEST = 'shotlab-runtime-manifest.json'
export const RUNTIME_CSS_ENTRIES = [
  'shotlab-v3-foundation.css',
  'shotlab-v3-mobile-corrections.css',
  'shotlab-v4-reference.css',
  'shotlab-v5-coach-integrity.css',
  'shotlab-v6-decision-workspaces.css',
  'shotlab-v7-page-authority.css',
  'shotlab-v8-demo-parity.css',
  'shotlab-v9-secondary-polish.css',
  'shotlab-v11-decision-first.css',
  'shotlab-v12-auth-demo-entry.css',
  'shotlab-v13-visual-hierarchy.css',
  'shotlab-v15-session-integrity.css',
]

const rootDir = process.cwd()
const publicDir = path.join(rootDir, 'public')
const outputPath = path.join(publicDir, RUNTIME_CSS_OUTPUT)
const manifestPath = path.join(publicDir, RUNTIME_CSS_MANIFEST)
const localImportPattern = /@import\s+(?:url\(\s*)?(?:"([^"]+)"|'([^']+)'|([^'"\)\s]+))\s*\)?\s*([^;]*);/gi

function normalizePublicPath(value) {
  return path.posix.normalize(String(value || '').replaceAll('\\', '/').replace(/^\/+/, ''))
}

function cleanReference(value) {
  const reference = String(value || '').trim()
  const clean = reference.split(/[?#]/, 1)[0]
  try {
    return decodeURIComponent(clean)
  } catch {
    return clean
  }
}

function isExternalReference(reference) {
  return /^(?:data:|https?:|\/\/)/i.test(String(reference || '').trim())
}

async function inlineCssFile(relativeFile, state, stack = []) {
  const normalizedFile = normalizePublicPath(relativeFile)
  if (stack.includes(normalizedFile)) {
    throw new Error(`Circular CSS import: ${[...stack, normalizedFile].join(' -> ')}`)
  }

  const absoluteFile = path.join(publicDir, normalizedFile)
  const source = (await readFile(absoluteFile, 'utf8'))
    .replace(/^\uFEFF/, '')
    .replace(/@charset\s+[^;]+;/gi, '')
  state.sources.add(normalizedFile)
  state.sourceContents.push(`${normalizedFile}\n${source}`)

  let output = ''
  let cursor = 0
  localImportPattern.lastIndex = 0

  for (const match of source.matchAll(localImportPattern)) {
    output += source.slice(cursor, match.index)
    const reference = match[1] || match[2] || match[3] || ''
    const qualifier = String(match[4] || '').trim()

    if (isExternalReference(reference) || !cleanReference(reference).toLowerCase().endsWith('.css')) {
      output += match[0]
      cursor = match.index + match[0].length
      continue
    }

    if (qualifier) {
      throw new Error(`Unsupported qualified local CSS import in ${normalizedFile}: ${match[0]}`)
    }

    const importedFile = reference.startsWith('/')
      ? normalizePublicPath(cleanReference(reference))
      : normalizePublicPath(path.posix.join(path.posix.dirname(normalizedFile), cleanReference(reference)))
    const importedCss = await inlineCssFile(importedFile, state, [...stack, normalizedFile])

    output += `\n/* BEGIN INLINE IMPORT: ${importedFile} */\n${importedCss}\n/* END INLINE IMPORT: ${importedFile} */\n`
    cursor = match.index + match[0].length
  }

  output += source.slice(cursor)
  return output.trim()
}

export async function buildRuntimeCss() {
  const state = { sources: new Set(), sourceContents: [] }
  const sections = []

  for (const entry of RUNTIME_CSS_ENTRIES) {
    const css = await inlineCssFile(entry, state)
    sections.push(`/* ===== RUNTIME ENTRY: ${entry} ===== */\n${css}`)
  }

  const digest = createHash('sha256')
    .update(state.sourceContents.join('\n\n'))
    .digest('hex')
    .slice(0, 16)
  const output = [
    '/* ShotLab generated runtime stylesheet.',
    '   Source order is a release contract; edit the source files, not this output.',
    `   Source digest: ${digest} */`,
    '',
    ...sections,
    '',
  ].join('\n\n')
  const manifest = {
    version: 1,
    output: RUNTIME_CSS_OUTPUT,
    digest,
    entries: RUNTIME_CSS_ENTRIES,
    sources: [...state.sources],
  }

  await mkdir(publicDir, { recursive: true })
  const temporaryOutputPath = `${outputPath}.tmp`
  const temporaryManifestPath = `${manifestPath}.tmp`
  await writeFile(temporaryOutputPath, output)
  await writeFile(temporaryManifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  await rename(temporaryOutputPath, outputPath)
  await rename(temporaryManifestPath, manifestPath)

  console.log(`Built ${RUNTIME_CSS_OUTPUT} from ${manifest.sources.length} ordered source files (${digest}).`)
  return manifest
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  buildRuntimeCss().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
