#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import zlib from 'node:zlib'

const repoRoot = process.cwd()
const assetsDir = path.join(repoRoot, 'dist', 'assets')
const largestCssLimitBytes = 128000
const totalCssGzipLimitBytes = 89000

if (!fs.existsSync(assetsDir)) {
  console.error('Phase 5C CSS headroom gate failed: dist/assets is missing. Run the production build first.')
  process.exit(1)
}

const cssFiles = fs.readdirSync(assetsDir).filter((file) => file.endsWith('.css'))
if (cssFiles.length === 0) {
  console.error('Phase 5C CSS headroom gate failed: no CSS assets were generated.')
  process.exit(1)
}

const largestCssBytes = cssFiles.reduce((largest, file) => {
  const sizeBytes = fs.statSync(path.join(assetsDir, file)).size
  return Math.max(largest, sizeBytes)
}, 0)

const totalCssGzipBytes = cssFiles.reduce((total, file) => {
  const buffer = fs.readFileSync(path.join(assetsDir, file))
  return total + zlib.gzipSync(buffer).length
}, 0)

if (largestCssBytes > largestCssLimitBytes) {
  console.error(
    `Phase 5C CSS headroom gate failed: largest CSS asset is ${largestCssBytes} bytes (limit ${largestCssLimitBytes}).`,
  )
  process.exit(1)
}

if (totalCssGzipBytes > totalCssGzipLimitBytes) {
  console.error(
    `Phase 5C CSS headroom gate failed: total CSS gzip is ${totalCssGzipBytes} bytes (limit ${totalCssGzipLimitBytes}).`,
  )
  process.exit(1)
}

console.log(
  `Phase 5C CSS headroom gate passed (largest ${largestCssBytes}/${largestCssLimitBytes}, gzip ${totalCssGzipBytes}/${totalCssGzipLimitBytes}).`,
)
