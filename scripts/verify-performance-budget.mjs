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

const budget = JSON.parse(await readFile(budgetPath, 'utf8'))
const distStats = await stat(distDir).catch(() => null)
if (!distStats?.isDirectory()) {
  throw new Error('Missing dist directory. Run npm run build before verifying the performance budget.')
}

const assetPaths = await walk(distDir)
const assets = []

for (const absolutePath of assetPaths) {
  const extension = path.extname(absolutePath).toLowerCase()
  if (!['.js', '.css'].includes(extension)) continue

  const buffer = await readFile(absolutePath)
  assets.push({
    file: path.relative(distDir, absolutePath).replaceAll('\\', '/'),
    type: extension.slice(1),
    bytes: buffer.byteLength,
    gzipBytes: gzipSync(buffer, { level: 9 }).byteLength,
  })
}

assets.sort((left, right) => right.bytes - left.bytes)
const javaScript = assets.filter((asset) => asset.type === 'js')
const css = assets.filter((asset) => asset.type === 'css')
const largestJavaScript = javaScript[0] || { file: 'none', bytes: 0, gzipBytes: 0 }
const largestCss = css[0] || { file: 'none', bytes: 0, gzipBytes: 0 }

const metrics = {
  generatedAt: new Date().toISOString(),
  budget,
  totals: {
    javaScriptFiles: javaScript.length,
    javaScriptBytes: sum(javaScript, 'bytes'),
    javaScriptGzipBytes: sum(javaScript, 'gzipBytes'),
    cssFiles: css.length,
    cssBytes: sum(css, 'bytes'),
    cssGzipBytes: sum(css, 'gzipBytes'),
  },
  largestJavaScript,
  largestCss,
  assets,
}

const failures = []
if (largestJavaScript.bytes > budget.maxLargestJavaScriptBytes) {
  failures.push(`Largest JavaScript chunk ${largestJavaScript.file} is ${formatBytes(largestJavaScript.bytes)}; budget is ${formatBytes(budget.maxLargestJavaScriptBytes)}.`)
}
if (metrics.totals.javaScriptGzipBytes > budget.maxTotalJavaScriptGzipBytes) {
  failures.push(`Total JavaScript gzip is ${formatBytes(metrics.totals.javaScriptGzipBytes)}; budget is ${formatBytes(budget.maxTotalJavaScriptGzipBytes)}.`)
}
if (largestCss.bytes > budget.maxLargestCssBytes) {
  failures.push(`Largest CSS chunk ${largestCss.file} is ${formatBytes(largestCss.bytes)}; budget is ${formatBytes(budget.maxLargestCssBytes)}.`)
}
if (metrics.totals.cssGzipBytes > budget.maxTotalCssGzipBytes) {
  failures.push(`Total CSS gzip is ${formatBytes(metrics.totals.cssGzipBytes)}; budget is ${formatBytes(budget.maxTotalCssGzipBytes)}.`)
}
if (metrics.totals.javaScriptFiles > budget.maxJavaScriptFileCount) {
  failures.push(`JavaScript file count is ${metrics.totals.javaScriptFiles}; budget is ${budget.maxJavaScriptFileCount}.`)
}

await mkdir(reportDir, { recursive: true })
await writeFile(reportPath, `${JSON.stringify({ ...metrics, failures }, null, 2)}\n`)

console.log('\nShotLab production bundle')
console.table(assets.map((asset) => ({
  file: asset.file,
  type: asset.type,
  raw: formatBytes(asset.bytes),
  gzip: formatBytes(asset.gzipBytes),
})))
console.log(`Largest JS: ${largestJavaScript.file} (${formatBytes(largestJavaScript.bytes)} raw, ${formatBytes(largestJavaScript.gzipBytes)} gzip)`)
console.log(`Largest CSS: ${largestCss.file} (${formatBytes(largestCss.bytes)} raw, ${formatBytes(largestCss.gzipBytes)} gzip)`)
console.log(`Total JS: ${formatBytes(metrics.totals.javaScriptBytes)} raw, ${formatBytes(metrics.totals.javaScriptGzipBytes)} gzip`)
console.log(`Total CSS: ${formatBytes(metrics.totals.cssBytes)} raw, ${formatBytes(metrics.totals.cssGzipBytes)} gzip`)
console.log(`Report: ${path.relative(rootDir, reportPath)}`)

if (failures.length) {
  console.error('\nPerformance budget failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exitCode = 1
} else {
  console.log('\nPerformance budget passed.')
}
