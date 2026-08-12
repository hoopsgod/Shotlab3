import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const METRICS = Object.freeze([
  ['totals.javaScriptFiles', 'JavaScript file count'],
  ['totals.javaScriptBytes', 'total JavaScript raw bytes'],
  ['totals.javaScriptGzipBytes', 'total JavaScript gzip bytes'],
  ['totals.cssFiles', 'CSS file count'],
  ['totals.cssBytes', 'total CSS raw bytes'],
  ['totals.cssGzipBytes', 'total CSS gzip bytes'],
  ['startupAppJavaScript.bytes', 'startup App JavaScript raw bytes'],
  ['startupAppJavaScript.gzipBytes', 'startup App JavaScript gzip bytes'],
  ['startupAppCss.bytes', 'startup App CSS raw bytes'],
  ['startupAppCss.gzipBytes', 'startup App CSS gzip bytes'],
  ['largestJavaScript.bytes', 'largest JavaScript raw bytes'],
  ['largestJavaScript.gzipBytes', 'largest JavaScript gzip bytes'],
  ['largestCss.bytes', 'largest CSS raw bytes'],
  ['largestCss.gzipBytes', 'largest CSS gzip bytes'],
])

function readMetric(metrics, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], metrics)
}

export function findBuildRegressions(baseMetrics, headMetrics) {
  const failures = []

  for (const [metricPath, label] of METRICS) {
    const baseValue = readMetric(baseMetrics, metricPath)
    const headValue = readMetric(headMetrics, metricPath)

    if (!Number.isFinite(baseValue)) {
      failures.push(`Baseline is missing numeric ${label} (${metricPath}).`)
      continue
    }
    if (!Number.isFinite(headValue)) {
      failures.push(`Candidate is missing numeric ${label} (${metricPath}).`)
      continue
    }
    if (headValue > baseValue) {
      failures.push(`${label} regressed from ${baseValue} to ${headValue} (+${headValue - baseValue}).`)
    }
  }

  return failures
}

export function inheritedBudgetDebt(metrics) {
  const budget = metrics?.budget || {}
  const debt = []
  const checks = [
    ['largestCss.bytes', budget.maxLargestCssBytes, 'largest CSS raw bytes'],
    ['totals.cssGzipBytes', budget.maxTotalCssGzipBytes, 'total CSS gzip bytes'],
  ]

  for (const [metricPath, limit, label] of checks) {
    const value = readMetric(metrics, metricPath)
    if (Number.isFinite(value) && Number.isFinite(limit) && value > limit) {
      debt.push(`${label}: ${value} > ${limit} (${value - limit} bytes over).`)
    }
  }
  return debt
}

async function main([basePath, headPath]) {
  if (!basePath || !headPath) {
    throw new Error('Usage: node scripts/verify-phase5a-build-equivalence.mjs <base-metrics.json> <head-metrics.json>')
  }

  const [baseMetrics, headMetrics] = await Promise.all([
    readFile(path.resolve(basePath), 'utf8').then(JSON.parse),
    readFile(path.resolve(headPath), 'utf8').then(JSON.parse),
  ])

  const regressions = findBuildRegressions(baseMetrics, headMetrics)
  if (regressions.length) {
    console.error('\nPhase 5A build equivalence failed:')
    for (const failure of regressions) console.error(`- ${failure}`)
    process.exitCode = 1
    return
  }

  console.log('Phase 5A build equivalence passed: candidate bundle metrics do not exceed the exact cumulative base.')
  const debt = inheritedBudgetDebt(headMetrics)
  if (debt.length) {
    console.log('Inherited CSS budget debt (recorded, not waived):')
    for (const item of debt) console.log(`- ${item}`)
  }
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null

if (invokedFile === currentFile) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
