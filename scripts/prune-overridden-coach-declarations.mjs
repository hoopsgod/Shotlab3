import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const DIST_ASSETS = path.resolve(ROOT, 'dist', 'assets')
const SRC_DIR = path.resolve(ROOT, 'src')
const COACH_WORKSPACE_ASSET = /^CoachWorkspaces-.*\.css$/
const COACH_COMMAND_CENTER = path.resolve(SRC_DIR, 'components', 'CoachCommandCenter.jsx')
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx'])
const MISSION_CONTROL_BODY_SCOPE = 'body.mission-control-active .mcShellV3'
const MISSION_CONTROL_SHELL_SCOPE = '.mcShellV3'
const MISSION_CONTROL_CLASS = /^(?:mc[A-Z0-9_-]|mcShellV3$|missionControl$)/
const MERGEABLE_CONTEXT_AT_RULE = /^@(media|supports|container)\b/i

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

function normalizedContextPart(prelude, openIndex) {
  const normalized = prelude.replace(/\s+/g, ' ').trim()
  return MERGEABLE_CONTEXT_AT_RULE.test(normalized) ? normalized : `${normalized}#${openIndex}`
}

function extractClassNames(selector) {
  return [...selector.matchAll(/\.([_a-zA-Z][\w-]*)/g)].map((match) => match[1])
}

function describeMissionControlSelector(selector, exclusiveMissionControlClasses) {
  if (!exclusiveMissionControlClasses?.size || selector.includes(',') || selector.includes(':has(')) return null

  let inner = selector.trim()
  let scopeRank = 0
  if (inner === MISSION_CONTROL_BODY_SCOPE) {
    inner = MISSION_CONTROL_SHELL_SCOPE
    scopeRank = 2
  } else if (inner.startsWith(`${MISSION_CONTROL_BODY_SCOPE} `)) {
    inner = inner.slice(MISSION_CONTROL_BODY_SCOPE.length + 1)
    scopeRank = 2
  } else if (inner === MISSION_CONTROL_SHELL_SCOPE) {
    scopeRank = 1
  } else if (inner.startsWith(`${MISSION_CONTROL_SHELL_SCOPE} `)) {
    inner = inner.slice(MISSION_CONTROL_SHELL_SCOPE.length + 1)
    scopeRank = 1
  }

  const classNames = extractClassNames(inner)
  const missionControlClasses = classNames.filter((name) => MISSION_CONTROL_CLASS.test(name))
  if (!missionControlClasses.length) return null
  if (missionControlClasses.some((name) => !exclusiveMissionControlClasses.has(name))) return null

  return { key: inner, scopeRank }
}

function declarationCanBeOverridden(current, later) {
  return Boolean(later && (later.important || !current.important))
}

function findWinningScopedDeclaration(candidates, current, scopeRank) {
  if (!candidates?.length) return null
  return candidates.find((candidate) => candidate.scopeRank >= scopeRank && declarationCanBeOverridden(current, candidate.declaration)) || null
}

function collectRulesByContext(source, start, end, contexts, contextPath, options) {
  const contextKey = JSON.stringify(contextPath)
  let rules = contexts.get(contextKey)
  if (!rules) { rules = []; contexts.set(contextKey, rules) }

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
      collectRulesByContext(
        source,
        bodyStart,
        close,
        contexts,
        [...contextPath, normalizedContextPart(prelude, token.index)],
        options,
      )
    } else if (!prelude.startsWith('@')) {
      const declarations = parseDeclarations(source, bodyStart, close)
      if (declarations.length) {
        rules.push({
          selector: prelude,
          declarations,
          missionControl: options.allowMissionControlScope
            ? describeMissionControlSelector(prelude, options.exclusiveMissionControlClasses)
            : null,
        })
      }
    }
    cursor = close + 1
  }
}

function analyzeRules(rules, removals, stats) {
  const laterBySelector = new Map()
  const laterByMissionControlKey = new Map()
  for (let ruleIndex = rules.length - 1; ruleIndex >= 0; ruleIndex -= 1) {
    const rule = rules[ruleIndex]
    let seen = laterBySelector.get(rule.selector)
    if (!seen) { seen = new Map(); laterBySelector.set(rule.selector, seen) }

    let scopedSeen = null
    if (rule.missionControl) {
      scopedSeen = laterByMissionControlKey.get(rule.missionControl.key)
      if (!scopedSeen) { scopedSeen = new Map(); laterByMissionControlKey.set(rule.missionControl.key, scopedSeen) }
    }

    for (let declIndex = rule.declarations.length - 1; declIndex >= 0; declIndex -= 1) {
      const declaration = rule.declarations[declIndex]
      const exactLater = seen.get(declaration.property)
      const scopedLater = rule.missionControl
        ? findWinningScopedDeclaration(scopedSeen?.get(declaration.property), declaration, rule.missionControl.scopeRank)
        : null
      const exactWins = declarationCanBeOverridden(declaration, exactLater)
      const laterWins = exactWins || Boolean(scopedLater)

      if (laterWins) {
        removals.push({ start: declaration.start, end: declaration.end })
        stats.removedDeclarations += 1
        stats.rawBytesRemoved += declaration.end - declaration.start
        if (!exactWins && scopedLater) stats.scopedDeclarationsRemoved += 1
      } else if (!exactLater || declaration.important) {
        seen.set(declaration.property, declaration)
      }

      if (rule.missionControl) {
        const propertyCandidates = scopedSeen.get(declaration.property) || []
        propertyCandidates.push({ scopeRank: rule.missionControl.scopeRank, declaration })
        scopedSeen.set(declaration.property, propertyCandidates)
      }
    }
  }
}

export function pruneOverriddenCoachDeclarations(source, {
  allowMissionControlScope = false,
  exclusiveMissionControlClasses = new Set(),
} = {}) {
  const removals = []
  const stats = { removedDeclarations: 0, scopedDeclarationsRemoved: 0, rawBytesRemoved: 0 }
  const contexts = new Map()
  collectRulesByContext(source, 0, source.length, contexts, [], { allowMissionControlScope, exclusiveMissionControlClasses })
  for (const rules of contexts.values()) analyzeRules(rules, removals, stats)
  if (!removals.length) return { css: source, ...stats }
  removals.sort((a, b) => b.start - a.start)
  let output = source
  for (const removal of removals) output = `${output.slice(0, removal.start)}${output.slice(removal.end)}`
  return { css: output, ...stats }
}

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await listSourceFiles(fullPath))
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath)
  }
  return files
}

async function collectExclusiveMissionControlClasses() {
  const commandCenterSource = await readFile(COACH_COMMAND_CENTER, 'utf8')
  if (!commandCenterSource.includes('document.body.classList.add("mission-control-active")')) {
    throw new Error('Phase 5C requires CoachCommandCenter to own the mission-control-active body scope')
  }
  if (!commandCenterSource.includes('mcShell mcShellV3')) {
    throw new Error('Phase 5C requires CoachCommandCenter full mode to render the mcShellV3 root')
  }

  const commandCenterClasses = new Set(
    [...commandCenterSource.matchAll(/\b(?:mc[A-Z][\w-]*|mcShellV3|missionControl)\b/g)].map((match) => match[0]),
  )
  const owners = new Map([...commandCenterClasses].map((className) => [className, new Set()]))
  const files = await listSourceFiles(SRC_DIR)

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const relative = path.relative(SRC_DIR, file).replaceAll('\\', '/')
    for (const className of commandCenterClasses) {
      if (source.includes(className)) owners.get(className).add(relative)
    }
  }

  const commandCenterRelative = path.relative(SRC_DIR, COACH_COMMAND_CENTER).replaceAll('\\', '/')
  return new Set(
    [...owners]
      .filter(([, classOwners]) => classOwners.size === 1 && classOwners.has(commandCenterRelative))
      .map(([className]) => className),
  )
}

async function main() {
  const entries = await readdir(DIST_ASSETS, { withFileTypes: true })
  const name = entries.find((entry) => entry.isFile() && COACH_WORKSPACE_ASSET.test(entry.name))?.name
  if (!name) {
    console.log('CoachWorkspaces CSS asset not found; no overridden declarations pruned.')
    return
  }

  const exclusiveMissionControlClasses = await collectExclusiveMissionControlClasses()
  const file = path.join(DIST_ASSETS, name)
  const source = await readFile(file, 'utf8')
  const result = pruneOverriddenCoachDeclarations(source, {
    allowMissionControlScope: true,
    exclusiveMissionControlClasses,
  })
  if (result.css !== source) await writeFile(file, result.css)
  console.log(`Pruned ${result.removedDeclarations} overridden Coach declarations (${result.scopedDeclarationsRemoved} scoped Mission Control); saved ${(result.rawBytesRemoved / 1024).toFixed(1)} KiB raw before final selector pruning.`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  await main()
}
