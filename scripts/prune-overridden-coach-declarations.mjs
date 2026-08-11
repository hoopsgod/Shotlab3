import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DIST_ASSETS = path.resolve(process.cwd(), 'dist', 'assets')
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/

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

function findTopLevelToken(source, start, end) {
  let quote = ''
  let comment = false
  let paren = 0
  let bracket = 0
  for (let index = start; index < end; index += 1) {
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
    if (char === '(') paren += 1
    else if (char === ')') paren = Math.max(0, paren - 1)
    else if (char === '[') bracket += 1
    else if (char === ']') bracket = Math.max(0, bracket - 1)
    else if (paren === 0 && bracket === 0 && (char === '{' || char === ';')) return { index, char }
  }
  return null
}

function parseDeclarations(source, start, end) {
  const declarations = []
  let tokenStart = start
  let quote = ''
  let comment = false
  let paren = 0
  let bracket = 0
  const push = (tokenEnd, rangeEnd) => {
    const raw = source.slice(tokenStart, tokenEnd).trim()
    if (!raw) { tokenStart = rangeEnd; return }
    let colon = -1
    let q = ''
    let p = 0
    let b = 0
    for (let i = 0; i < raw.length; i += 1) {
      const c = raw[i]
      if (q) {
        if (c === '\\') i += 1
        else if (c === q) q = ''
        continue
      }
      if (c === '"' || c === "'") { q = c; continue }
      if (c === '(') p += 1
      else if (c === ')') p = Math.max(0, p - 1)
      else if (c === '[') b += 1
      else if (c === ']') b = Math.max(0, b - 1)
      else if (c === ':' && p === 0 && b === 0) { colon = i; break }
    }
    if (colon > 0) {
      const property = raw.slice(0, colon).trim().toLowerCase()
      let value = raw.slice(colon + 1).trim()
      const important = /!important\s*$/i.test(value)
      if (important) value = value.replace(/!important\s*$/i, '').trim()
      if (property && value) declarations.push({ property, value, important, start: tokenStart, end: rangeEnd })
    }
    tokenStart = rangeEnd
  }

  for (let index = start; index <= end; index += 1) {
    const char = index === end ? ';' : source[index]
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
    if (char === '(') paren += 1
    else if (char === ')') paren = Math.max(0, paren - 1)
    else if (char === '[') bracket += 1
    else if (char === ']') bracket = Math.max(0, bracket - 1)
    else if (char === ';' && paren === 0 && bracket === 0) push(index, Math.min(index + 1, end))
  }
  return declarations
}

function isNestedRuleAtRule(prelude) {
  return /^@(media|supports|container|layer|scope|starting-style)\b/i.test(prelude)
}

function analyzeContext(source, start, end, removals, stats) {
  const rules = []
  let cursor = start
  while (cursor < end) {
    while (cursor < end && /\s/.test(source[cursor])) cursor += 1
    if (cursor >= end) break
    const token = findTopLevelToken(source, cursor, end)
    if (!token) break
    if (token.char === ';') { cursor = token.index + 1; continue }
    const prelude = source.slice(cursor, token.index).trim()
    const close = findMatchingBrace(source, token.index)
    if (close < 0 || close > end) break
    const bodyStart = token.index + 1
    if (isNestedRuleAtRule(prelude)) {
      analyzeContext(source, bodyStart, close, removals, stats)
    } else if (!prelude.startsWith('@')) {
      const declarations = parseDeclarations(source, bodyStart, close)
      if (declarations.length) rules.push({ selector: prelude, declarations })
    }
    cursor = close + 1
  }

  const laterBySelector = new Map()
  for (let ruleIndex = rules.length - 1; ruleIndex >= 0; ruleIndex -= 1) {
    const rule = rules[ruleIndex]
    let seen = laterBySelector.get(rule.selector)
    if (!seen) { seen = new Map(); laterBySelector.set(rule.selector, seen) }
    for (let declIndex = rule.declarations.length - 1; declIndex >= 0; declIndex -= 1) {
      const declaration = rule.declarations[declIndex]
      const later = seen.get(declaration.property)
      const laterWins = later && (later.important || !declaration.important)
      if (laterWins) {
        removals.push({ start: declaration.start, end: declaration.end })
        stats.removedDeclarations += 1
        stats.rawBytesRemoved += declaration.end - declaration.start
      } else if (!later || declaration.important) {
        seen.set(declaration.property, declaration)
      }
    }
  }
}

export function pruneOverriddenCoachDeclarations(source) {
  const removals = []
  const stats = { removedDeclarations: 0, rawBytesRemoved: 0 }
  analyzeContext(source, 0, source.length, removals, stats)
  if (!removals.length) return { css: source, ...stats }
  removals.sort((a, b) => b.start - a.start)
  let output = source
  for (const removal of removals) output = `${output.slice(0, removal.start)}${output.slice(removal.end)}`
  return { css: output, ...stats }
}

async function main() {
  const entries = await readdir(DIST_ASSETS, { withFileTypes: true })
  const name = entries.find((entry) => entry.isFile() && COACH_WORKSPACE_ASSET.test(entry.name))?.name
  if (!name) {
    console.log('CoachWorkspaces CSS asset not found; no overridden declarations pruned.')
    return
  }
  const file = path.join(DIST_ASSETS, name)
  const source = await readFile(file, 'utf8')
  const result = pruneOverriddenCoachDeclarations(source)
  if (result.css !== source) await writeFile(file, result.css)
  console.log(`Pruned ${result.removedDeclarations} overridden Coach declarations; saved ${(result.rawBytesRemoved / 1024).toFixed(1)} KiB raw before final selector pruning.`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  await main()
}
