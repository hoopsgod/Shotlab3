import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx'])
const MODULE_CSS_RE = /\.module\.css$/i

async function walk(directory, predicate = () => true) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(absolutePath, predicate))
    else if (entry.isFile() && predicate(absolutePath)) files.push(absolutePath)
  }
  return files
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function blankRange(source, start, end) {
  return `${source.slice(0, start)}${' '.repeat(end - start)}${source.slice(end)}`
}

export function collectBindingUsage(source, binding, importStart = -1, importEnd = -1) {
  const escaped = escapeRegExp(binding)
  let working = importStart >= 0 && importEnd >= importStart ? blankRange(source, importStart, importEnd) : source
  const used = new Set()

  const dotPattern = new RegExp(`\\b${escaped}(?:\\?\\.)?\\.([A-Za-z_$][\\w$]*)`, 'g')
  working = working.replace(dotPattern, (match, name) => {
    used.add(name)
    return ' '.repeat(match.length)
  })

  const bracketPattern = new RegExp(`\\b${escaped}\\s*\\[\\s*(['\"])([^'\"]+)\\1\\s*\\]`, 'g')
  working = working.replace(bracketPattern, (match, _quote, name) => {
    used.add(name)
    return ' '.repeat(match.length)
  })

  const dynamic = new RegExp(`\\b${escaped}\\b`).test(working)
  return { used, dynamic }
}

function resolveCssModule(importer, source) {
  if (!source.startsWith('.')) return null
  const resolved = path.resolve(path.dirname(importer), source)
  return MODULE_CSS_RE.test(resolved) ? resolved : null
}

async function scanUsage(rootDir) {
  const srcDir = path.join(rootDir, 'src')
  const files = await walk(srcDir, (file) => SOURCE_EXTENSIONS.has(path.extname(file)))
  const usage = new Map()

  const getEntry = (modulePath) => {
    let entry = usage.get(modulePath)
    if (!entry) {
      entry = { used: new Set(), dynamic: false, importers: new Set(), reasons: new Set() }
      usage.set(modulePath, entry)
    }
    return entry
  }

  for (const importer of files) {
    const source = await readFile(importer, 'utf8')

    const defaultImport = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['\"]([^'\"]+\.module\.css)['\"]\s*;?/g
    for (const match of source.matchAll(defaultImport)) {
      const modulePath = resolveCssModule(importer, match[2])
      if (!modulePath) continue
      const entry = getEntry(modulePath)
      entry.importers.add(path.relative(rootDir, importer).replaceAll('\\', '/'))
      const bindingUsage = collectBindingUsage(source, match[1], match.index, match.index + match[0].length)
      for (const name of bindingUsage.used) entry.used.add(name)
      if (bindingUsage.dynamic) {
        entry.dynamic = true
        entry.reasons.add(`dynamic binding usage: ${match[1]}`)
      }
    }

    const sideEffectImport = /import\s+['\"]([^'\"]+\.module\.css)['\"]\s*;?/g
    for (const match of source.matchAll(sideEffectImport)) {
      const modulePath = resolveCssModule(importer, match[1])
      if (!modulePath) continue
      const entry = getEntry(modulePath)
      entry.importers.add(path.relative(rootDir, importer).replaceAll('\\', '/'))
      entry.dynamic = true
      entry.reasons.add('side-effect CSS module import')
    }

    const namedOrNamespaceImport = /import\s+(?:\*\s+as\s+\w+|\{[^}]+\})\s+from\s+['\"]([^'\"]+\.module\.css)['\"]\s*;?/g
    for (const match of source.matchAll(namedOrNamespaceImport)) {
      const modulePath = resolveCssModule(importer, match[1])
      if (!modulePath) continue
      const entry = getEntry(modulePath)
      entry.importers.add(path.relative(rootDir, importer).replaceAll('\\', '/'))
      entry.dynamic = true
      entry.reasons.add('named or namespace CSS module import')
    }

    const dynamicImport = /import\s*\(\s*['\"]([^'\"]+\.module\.css)['\"]\s*\)/g
    for (const match of source.matchAll(dynamicImport)) {
      const modulePath = resolveCssModule(importer, match[1])
      if (!modulePath) continue
      const entry = getEntry(modulePath)
      entry.importers.add(path.relative(rootDir, importer).replaceAll('\\', '/'))
      entry.dynamic = true
      entry.reasons.add('dynamic CSS module import')
    }
  }

  return usage
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

function localClassNames(selector) {
  return [...selector.matchAll(/\.(-?[_A-Za-z][_A-Za-z0-9-]*)/g)].map((match) => match[1])
}

export function pruneUnusedCssModuleCss(css, usedNames) {
  if (!usedNames || !(usedNames instanceof Set) || !usedNames.size) {
    return { css, removedArms: 0, removedRules: 0 }
  }
  if (/\bcomposes\s*:/i.test(css) || /:local\s*\(/i.test(css)) {
    return { css, removedArms: 0, removedRules: 0, skipped: 'composition-or-explicit-local' }
  }

  let removedArms = 0
  let removedRules = 0
  const output = css.replace(/([^{}]+)\{([^{}]*)\}/g, (whole, selectorText, declarations) => {
    const selector = selectorText.trim()
    if (!selector || selector.startsWith('@') || selector.includes(':global')) return whole
    const arms = splitSelectorList(selector)
    if (!arms.length) return whole
    const kept = arms.filter((arm) => {
      const classes = localClassNames(arm)
      if (!classes.length) return true
      return classes.every((name) => usedNames.has(name))
    })
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

export function createCssModuleDeadSelectorPruner({ rootDir = process.cwd() } = {}) {
  let usage = new Map()
  const report = { generatedAt: null, modules: [], totals: { transformedModules: 0, removedArms: 0, removedRules: 0, rawBytesSavedBeforeMinification: 0 } }

  return {
    name: 'shotlab-css-module-dead-selector-pruner',
    apply: 'build',
    enforce: 'pre',
    async buildStart() {
      usage = await scanUsage(rootDir)
    },
    transform(code, id) {
      const modulePath = path.resolve(String(id).split('?')[0])
      if (!MODULE_CSS_RE.test(modulePath)) return null
      const entry = usage.get(modulePath)
      if (!entry || entry.dynamic || !entry.used.size) return null

      const result = pruneUnusedCssModuleCss(code, entry.used)
      if (result.css === code) return null
      const before = Buffer.byteLength(code)
      const after = Buffer.byteLength(result.css)
      const row = {
        file: path.relative(rootDir, modulePath).replaceAll('\\', '/'),
        importers: [...entry.importers].sort(),
        usedClasses: [...entry.used].sort(),
        removedArms: result.removedArms,
        removedRules: result.removedRules,
        rawBytesSavedBeforeMinification: before - after,
      }
      report.modules.push(row)
      report.totals.transformedModules += 1
      report.totals.removedArms += result.removedArms
      report.totals.removedRules += result.removedRules
      report.totals.rawBytesSavedBeforeMinification += before - after
      return { code: result.css, map: null }
    },
    async closeBundle() {
      report.generatedAt = new Date().toISOString()
      report.modules.sort((a, b) => b.rawBytesSavedBeforeMinification - a.rawBytesSavedBeforeMinification)
      const dir = path.join(rootDir, 'artifacts', 'performance')
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, 'css-module-pruning.json'), `${JSON.stringify(report, null, 2)}\n`)
      console.log(`CSS module pruning removed ${report.totals.removedArms} selector arms across ${report.totals.transformedModules} modules; saved ${(report.totals.rawBytesSavedBeforeMinification / 1024).toFixed(1)} KiB before final CSS minification.`)
    },
  }
}
