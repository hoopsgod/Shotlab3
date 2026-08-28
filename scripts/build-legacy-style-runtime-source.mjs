import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { transform as transformWithLightningCss } from 'lightningcss'

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.html'])
const DYNAMIC_CLASS = /^(?:is|has|tone|status|state|role|mode|rank|theme|size|variant)(?:-|_|$)|^(?:active|selected|disabled|open|closed|expanded|collapsed|loading|success|error|warning|danger)$/i
const COMPLEX_PSEUDO = /:(?:not|is|where|has)\s*\(/i

async function listFiles(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await listFiles(full, predicate))
    else if (entry.isFile() && predicate(full)) files.push(full)
  }
  return files
}

async function buildRuntimeCorpus(rootDir) {
  const srcDir = path.resolve(rootDir, 'src')
  const files = await listFiles(srcDir, (file) => SOURCE_EXTENSIONS.has(path.extname(file)))
  files.push(path.resolve(rootDir, 'index.html'))
  return (await Promise.all(files.map((file) => readFile(file, 'utf8').catch(() => '')))).join('\n')
}

function splitSelectorList(selectorText) {
  const parts = []
  let start = 0
  let paren = 0
  let bracket = 0
  let quote = ''
  for (let index = 0; index <= selectorText.length; index += 1) {
    const char = selectorText[index] || ','
    if (quote) {
      if (char === '\\') index += 1
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") { quote = char; continue }
    if (char === '(') paren += 1
    else if (char === ')') paren = Math.max(0, paren - 1)
    else if (char === '[') bracket += 1
    else if (char === ']') bracket = Math.max(0, bracket - 1)
    else if (char === ',' && paren === 0 && bracket === 0) {
      const part = selectorText.slice(start, index).trim()
      if (part) parts.push(part)
      start = index + 1
    }
  }
  return parts
}

function classNames(selector) {
  return [...selector.matchAll(/\.(-?[_A-Za-z][_A-Za-z0-9-]*)/g)].map((match) => match[1])
}

function classIsReachable(name, corpus) {
  if (!name || name.startsWith('_')) return true
  if (DYNAMIC_CLASS.test(name)) return true
  return corpus.includes(name)
}

function armIsReachable(selector, corpus) {
  if (COMPLEX_PSEUDO.test(selector)) return true
  const classes = classNames(selector)
  if (!classes.length) return true
  return classes.every((name) => classIsReachable(name, corpus))
}

export function pruneUnreachableLegacyStyleRules(css, corpus) {
  let removedArms = 0
  let removedRules = 0
  const output = css.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selectorText, declarations) => {
    const selector = selectorText.trim()
    if (!selector || selector.startsWith('@')) return whole
    const arms = splitSelectorList(selector)
    if (!arms.length) return whole
    const kept = arms.filter((arm) => armIsReachable(arm, corpus))
    removedArms += arms.length - kept.length
    if (!kept.length) {
      removedRules += 1
      return ''
    }
    if (kept.length === arms.length) return whole
    return `${kept.join(',')}{${declarations}}`
  })
  return { css: output, removedArms, removedRules }
}

function minifyTemplate(template, exportName) {
  const buildTokens = new Map()
  const tokenized = template.replace(/\$\{([A-Z_]+)\}/g, (_match, tokenName) => {
    const cssVariable = `--slbt-${tokenName.toLowerCase().replaceAll('_', '-')}`
    buildTokens.set(cssVariable, '${' + tokenName + '}')
    return `var(${cssVariable})`
  })
  const transformed = transformWithLightningCss({
    filename: `${exportName}.css`,
    code: Buffer.from(tokenized),
    minify: true,
  })
  let css = Buffer.from(transformed.code).toString('utf8')
  for (const [cssVariable, runtimeToken] of buildTokens) css = css.replaceAll(`var(${cssVariable})`, runtimeToken)
  return css
}

export async function buildMinifiedLegacyStyleRuntimeSource({ rootDir = process.cwd(), sourceFile, exportNames }) {
  const [source, corpus] = await Promise.all([
    readFile(sourceFile, 'utf8'),
    buildRuntimeCorpus(rootDir),
  ])
  const compactExports = []
  let removedArms = 0
  let removedRules = 0
  let rawBytesBefore = 0
  let rawBytesAfterPruning = 0

  for (const exportName of exportNames) {
    const openingMarker = `export const ${exportName}=\``
    const openingIndex = source.indexOf(openingMarker)
    if (openingIndex === -1) throw new Error(`Legacy style export ${exportName} was not found during build.`)
    const valueStart = openingIndex + openingMarker.length
    const valueEnd = source.indexOf('`;', valueStart)
    if (valueEnd === -1) throw new Error(`Legacy style export ${exportName} is not terminated during build.`)
    const template = source.slice(valueStart, valueEnd)
    const pruned = pruneUnreachableLegacyStyleRules(template, corpus)
    const compactCss = minifyTemplate(pruned.css, exportName)
    rawBytesBefore += Buffer.byteLength(template)
    rawBytesAfterPruning += Buffer.byteLength(pruned.css)
    removedArms += pruned.removedArms
    removedRules += pruned.removedRules
    compactExports.push(`export const ${exportName}=\`${compactCss}\`;`)
  }

  console.log(`Legacy style reachability pruned ${removedArms} selector arms across ${removedRules} rules; saved ${((rawBytesBefore - rawBytesAfterPruning) / 1024).toFixed(1)} KiB raw before build-time minification.`)
  return compactExports.join('\n')
}
