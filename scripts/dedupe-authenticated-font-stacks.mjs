import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DIST_ASSETS = path.resolve(process.cwd(), 'dist', 'assets')
const AUTHORITY_ASSET = /^AuthenticatedVisualAuthority2026-.*\.css$/
const STARTUP_ASSET = /^index-.*\.css$/

const FONT_STACKS = [
  {
    variable: '--sl-font-system',
    variants: [
      'system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Noto Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif',
    ],
  },
  {
    variable: '--sl-font-text',
    variants: [
      '-apple-system,BlinkMacSystemFont,SF Pro Text,Segoe UI,sans-serif',
      '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif',
    ],
  },
  {
    variable: '--sl-font-display',
    variants: [
      '-apple-system,BlinkMacSystemFont,SF Pro Display,Segoe UI,sans-serif',
      '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif',
    ],
  },
]

function countOccurrences(source, needle) {
  if (!needle) return 0
  let count = 0
  let index = 0
  while ((index = source.indexOf(needle, index)) >= 0) {
    count += 1
    index += needle.length
  }
  return count
}

export function dedupeAuthenticatedFontStacks(source) {
  let css = source
  let replacements = 0
  for (const stack of FONT_STACKS) {
    for (const variant of stack.variants) {
      const occurrences = countOccurrences(css, variant)
      if (!occurrences) continue
      css = css.split(variant).join(`var(${stack.variable})`)
      replacements += occurrences
    }
  }
  return {
    css,
    replacements,
    rawBytesSaved: Buffer.byteLength(source) - Buffer.byteLength(css),
  }
}

async function main() {
  const entries = await readdir(DIST_ASSETS, { withFileTypes: true })
  const cssNames = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.css')).map((entry) => entry.name)
  const authorityName = cssNames.find((name) => AUTHORITY_ASSET.test(name))
  if (!authorityName) throw new Error('Authenticated visual authority CSS asset not found; font tokens cannot be guaranteed.')

  const authoritySource = await readFile(path.join(DIST_ASSETS, authorityName), 'utf8')
  for (const { variable } of FONT_STACKS) {
    if (!authoritySource.includes(`${variable}:`)) {
      throw new Error(`Authenticated visual authority is missing required font token ${variable}`)
    }
  }

  let replacements = 0
  let rawBytesSaved = 0
  let touchedFiles = 0

  for (const name of cssNames) {
    // The startup stylesheet is available before the authenticated visual authority.
    // Keep its literal stacks self-contained. The authority asset owns the token definitions.
    if (STARTUP_ASSET.test(name) || AUTHORITY_ASSET.test(name)) continue
    const file = path.join(DIST_ASSETS, name)
    const source = await readFile(file, 'utf8')
    const result = dedupeAuthenticatedFontStacks(source)
    if (result.css === source) continue
    await writeFile(file, result.css)
    replacements += result.replacements
    rawBytesSaved += result.rawBytesSaved
    touchedFiles += 1
  }

  console.log(`Deduplicated ${replacements} authenticated font-stack references across ${touchedFiles} CSS assets; saved ${(rawBytesSaved / 1024).toFixed(1)} KiB raw.`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  await main()
}
