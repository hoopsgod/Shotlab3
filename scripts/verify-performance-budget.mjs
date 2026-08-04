import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const budgetPath = path.join(rootDir, 'performance-budget.json')
const reportDir = path.join(rootDir, 'artifacts', 'performance')
const reportPath = path.join(reportDir, 'build-metrics.json')

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(absolutePath))
    else if (entry.isFile()) files.push(absolutePath)
  }

  return files
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`
  return `${(value / (1024 * 1024)).toFixed(2)} MiB`
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0)
}

function buildTarget({ key, label, actual, target }) {
  if (!Number.isFinite(target)) return null
  return {
    key,
    label,
    actual,
    target,
    met: actual <= target,
    deltaBytes: actual - target,
  }
}

function normalizeRelativePath(value) {
  return path.posix.normalize(String(value || '').replaceAll('\\', '/')).replace(/^\.\//, '')
}

function cleanAssetReference(value) {
  const reference = String(value || '').trim()
  if (!reference || reference.startsWith('#') || /^(?:data:|https?:|\/\/)/i.test(reference)) return ''
  const clean = reference.split(/[?#]/, 1)[0]
  try {
    return decodeURIComponent(clean)
  } catch {
    return clean
  }
}

function collectCssReferenceStrings(source) {
  const references = []
  const patterns = [
    /["']([^"']+\.css(?:[?#][^"']*)?)["']/gi,
    /@import\s+(?:url\(\s*)?["']?([^"')\s;]+\.css(?:[?#][^"')\s;]*)?)/gi,
  ]

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) references.push(match[1])
  }

  return references
}

async function resolveCssReference(reference, sourceRelativePath, availableFiles) {
  const cleanReference = cleanAssetReference(reference)
  if (!cleanReference) return null

  const rootCandidate = normalizeRelativePath(cleanReference.replace(/^\/+/, ''))
  const sourceDirectory = path.posix.dirname(sourceRelativePath)
  const relativeCandidate = normalizeRelativePath(path.posix.join(sourceDirectory, cleanReference))
  const candidates = cleanReference.startsWith('.')
    ? [relativeCandidate, rootCandidate]
    : [rootCandidate, relativeCandidate]

  for (const candidate of candidates) {
    if (candidate.toLowerCase().endsWith('.css') && availableFiles.has(candidate)) return candidate
  }

  return null
}

async function getReachableCssFiles(allFiles) {
  const relativeFiles = allFiles.map((absolutePath) => normalizeRelativePath(path.relative(distDir, absolutePath)))
  const availableFiles = new Set(relativeFiles)
  const sourceFiles = relativeFiles.filter((file) => /\.(?:html|js)$/i.test(file))
  const reachableCss = new Set()
  const queue = []

  for (const sourceRelativePath of sourceFiles) {
    const source = await readFile(path.join(distDir, sourceRelativePath), 'utf8')
    for (const reference of collectCssReferenceStrings(source)) {
      const resolved = await resolveCssReference(reference, sourceRelativePath, availableFiles)
      if (resolved && !reachableCss.has(resolved)) {
        reachableCss.add(resolved)
        queue.push(resolved)
      }
    }
  }

  while (queue.length) {
    const cssRelativePath = queue.shift()
    const cssSource = await readFile(path.join(distDir, cssRelativePath), 'utf8')
    for (const reference of collectCssReferenceStrings(cssSource)) {
      const resolved = await resolveCssReference(reference, cssRelativePath, availableFiles)
      if (resolved && !reachableCss.has(resolved)) {
        reachableCss.add(resolved)
        queue.push(resolved)
      }
    }
  }

  return reachableCss
}

const budget = JSON.parse(await readFile(budgetPath, 'utf8'))
const distStats = await stat(distDir).catch(() => null)
if (!distStats?.isDirectory()) {
  throw new Error('Missing dist directory. Run npm run build before verifying the performance budget.')
}

const assetPaths = await walk(distDir)
const reachableCssFiles = await getReachableCssFiles(assetPaths)
const allCssFiles = assetPaths
  .map((absolutePath) => normalizeRelativePath(path.relative(distDir, absolutePath)))
  .filter((file) => file.toLowerCase().endsWith('.css'))
const ignoredCssFiles = allCssFiles.filter((file) => !reachableCssFiles.has(file)).sort()
const assets = []

for (const absolutePath of assetPaths) {
  const relativePath = normalizeRelativePath(path.relative(distDir, absolutePath))
  const extension = path.extname(absolutePath).toLowerCase()
  if (extension === '.css' && !reachableCssFiles.has(relativePath)) continue
  if (!['.js', '.css'].includes(extension)) continue

  const buffer = await readFile(absolutePath)
  assets.push({
    file: relativePath,
    type: extension.slice(1),
    bytes: buffer.byteLength,
    gzipBytes: gzipSync(buffer, { level: 9 }).byteLength,
  })
}

assets.sort((left, right) => right.bytes - left.bytes)
const javaScript = assets.filter((asset) => asset.type === 'js')
const css = assets.filter((asset) => asset.type === 'css')
const largestJavaScript = javaScript[0] || { file: 'none', bytes: 0, gzipBytes: 0 }
const totals = {
  javaScriptFiles: javaScript.length,
  javaScriptBytes: sum(javaScript, 'bytes'),
  javaScriptGzipBytes: sum(javaScript, 'gzipBytes'),
  cssFiles: css.length,
  cssBytes: sum(css, 'bytes'),
  cssGzipBytes: sum(css, 'gzipBytes'),
}
const targets = [
  buildTarget({
    key: 'largestJavaScript',
    label: 'Largest JavaScript chunk',
    actual: largestJavaScript.bytes,
    target: budget.targetLargestJavaScriptBytes,
  }),
  buildTarget({
    key: 'totalJavaScriptGzip',
    label: 'Total JavaScript gzip',
    actual: totals.javaScriptGzipBytes,
    target: budget.targetTotalJavaScriptGzipBytes,
  }),
  buildTarget({
    key: 'totalCssGzip',
    label: 'Reachable CSS gzip',
    actual: totals.cssGzipBytes,
    target: budget.targetTotalCssGzipBytes,
  }),
].filter(Boolean)

const failures = []
if (largestJavaScript.bytes > budget.maxLargestJavaScriptBytes) {
  failures.push(`Largest JavaScript chunk ${largestJavaScript.file} is ${formatBytes(largestJavaScript.bytes)}; budget is ${formatBytes(budget.maxLargestJavaScriptBytes)}.`)
}
if (totals.javaScriptGzipBytes > budget.maxTotalJavaScriptGzipBytes) {
  failures.push(`Total JavaScript gzip is ${formatBytes(totals.javaScriptGzipBytes)}; budget is ${formatBytes(budget.maxTotalJavaScriptGzipBytes)}.`)
}
if (totals.cssGzipBytes > budget.maxTotalCssGzipBytes) {
  failures.push(`Reachable CSS gzip is ${formatBytes(totals.cssGzipBytes)}; budget is ${formatBytes(budget.maxTotalCssGzipBytes)}.`)
}
if (totals.javaScriptFiles > budget.maxJavaScriptFileCount) {
  failures.push(`JavaScript file count is ${totals.javaScriptFiles}; budget is ${budget.maxJavaScriptFileCount}.`)
}

const metrics = {
  generatedAt: new Date().toISOString(),
  budget,
  totals,
  largestJavaScript,
  targets,
  ignoredCssFiles,
  failures,
  assets,
}

await mkdir(reportDir, { recursive: true })
await writeFile(reportPath, `${JSON.stringify(metrics, null, 2)}\n`)

console.log('\nShotLab production bundle')
console.table(assets.map((asset) => ({
  file: asset.file,
  type: asset.type,
  raw: formatBytes(asset.bytes),
  gzip: formatBytes(asset.gzipBytes),
})))
console.log(`Largest JS: ${largestJavaScript.file} (${formatBytes(largestJavaScript.bytes)} raw, ${formatBytes(largestJavaScript.gzipBytes)} gzip)`)
console.log(`Total JS: ${formatBytes(totals.javaScriptBytes)} raw, ${formatBytes(totals.javaScriptGzipBytes)} gzip`)
console.log(`Reachable CSS: ${formatBytes(totals.cssBytes)} raw, ${formatBytes(totals.cssGzipBytes)} gzip across ${totals.cssFiles} files`)
console.log(`Ignored CSS: ${ignoredCssFiles.length ? ignoredCssFiles.join(', ') : 'none'}`)

if (targets.length) {
  console.log('\nImprovement targets')
  console.table(targets.map((target) => ({
    metric: target.label,
    actual: formatBytes(target.actual),
    target: formatBytes(target.target),
    status: target.met ? 'met' : `over by ${formatBytes(target.deltaBytes)}`,
  })))
}

console.log(`Report: ${path.relative(rootDir, reportPath)}`)

if (failures.length) {
  console.error('\nPerformance budget failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exitCode = 1
} else {
  console.log('\nPerformance budget passed.')
}
