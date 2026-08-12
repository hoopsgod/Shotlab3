import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DIST_ASSETS = path.resolve(process.cwd(), 'dist', 'assets')
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/

const FONT_STACKS = [
  {
    variable: '--sl5c-sys',
    canonical: 'system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Noto Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif',
    variants: [
      'system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Noto Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif',
    ],
  },
  {
    variable: '--sl5c-text',
    canonical: '-apple-system,BlinkMacSystemFont,SF Pro Text,Segoe UI,sans-serif',
    variants: [
      '-apple-system,BlinkMacSystemFont,SF Pro Text,Segoe UI,sans-serif',
      '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif',
    ],
  },
  {
    variable: '--sl5c-display',
    canonical: '-apple-system,BlinkMacSystemFont,SF Pro Display,Segoe UI,sans-serif',
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

export function dedupeCoachFontStacks(source) {
  for (const { variable } of FONT_STACKS) {
    if (source.includes(variable)) throw new Error(`Phase 5C font variable collision: ${variable}`)
  }

  let css = source
  const definitions = []
  let replacements = 0

  for (const stack of FONT_STACKS) {
    const occurrences = stack.variants.reduce((sum, variant) => sum + countOccurrences(css, variant), 0)
    if (occurrences < 2) continue
    for (const variant of stack.variants) css = css.split(variant).join(`var(${stack.variable})`)
    definitions.push(`${stack.variable}:${stack.canonical}`)
    replacements += occurrences
  }

  if (!definitions.length) return { css: source, replacements: 0, rawBytesSaved: 0 }
  css = `:root{${definitions.join(';')}}${css}`
  return {
    css,
    replacements,
    rawBytesSaved: Buffer.byteLength(source) - Buffer.byteLength(css),
  }
}

async function main() {
  const entries = await readdir(DIST_ASSETS, { withFileTypes: true })
  const name = entries.find((entry) => entry.isFile() && COACH_WORKSPACE_ASSET.test(entry.name))?.name
  if (!name) {
    console.log('CoachWorkspaces CSS asset not found; no font-stack deduplication applied.')
    return
  }

  const file = path.join(DIST_ASSETS, name)
  const source = await readFile(file, 'utf8')
  const result = dedupeCoachFontStacks(source)
  if (result.css !== source) await writeFile(file, result.css)
  console.log(`Deduplicated ${result.replacements} Coach font-stack references; saved ${(result.rawBytesSaved / 1024).toFixed(1)} KiB raw before final CSS compaction.`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  await main()
}
