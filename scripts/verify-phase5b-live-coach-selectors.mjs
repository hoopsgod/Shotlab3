import fs from 'node:fs'
import path from 'node:path'

const assetsDir = path.resolve('dist/assets')

if (!fs.existsSync(assetsDir)) {
  throw new Error(`Missing production assets directory: ${assetsDir}`)
}

const css = fs.readdirSync(assetsDir)
  .filter((name) => name.endsWith('.css'))
  .map((name) => fs.readFileSync(path.join(assetsDir, name), 'utf8'))
  .join('\n')

const requiredSelectors = [
  '.mcRafters',
  '.mcRafters span:nth-child(4)',
  '.mcRailBrand',
  '.mcRailBrand .mcRailLogo',
  '.mcDrawerLogo',
  '.mcDrawerLogo img',
]

const missing = requiredSelectors.filter((selector) => !css.includes(selector))

if (missing.length) {
  throw new Error(`Phase 5B removed live Coach Mission Control selectors: ${missing.join(', ')}`)
}

console.log(`Phase 5B live Coach selector preservation: PASS (${requiredSelectors.length}/${requiredSelectors.length})`)
