import fs from 'node:fs'
import path from 'node:path'

const assetsDir = path.resolve('dist/assets')
const coachSourcePath = path.resolve('src/components/CoachCommandCenter.jsx')

if (!fs.existsSync(assetsDir)) {
  throw new Error(`Missing production assets directory: ${assetsDir}`)
}

const builtCss = fs.readdirSync(assetsDir)
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
  '.mcHeaderTeamMark',
  '.mcHeaderTeamMark img',
]

const missing = requiredSelectors.filter((selector) => !builtCss.includes(selector))
if (missing.length) {
  throw new Error(`Phase 5B removed live Coach Mission Control selectors: ${missing.join(', ')}`)
}

const coachSource = fs.readFileSync(coachSourcePath, 'utf8')
const brandLockup = coachSource.match(/<div className="mcBrandLockup">([\s\S]*?)<\/div>/)?.[1]
if (!brandLockup) {
  throw new Error('Phase 5B could not verify the Coach brand-lockup DOM contract')
}
if (/<img\b/.test(brandLockup) && !/mcHeaderTeamMark/.test(brandLockup)) {
  throw new Error('Coach brand lockup renders an image without the protected mcHeaderTeamMark contract')
}

console.log(`Phase 5B Coach CSS preservation: PASS (${requiredSelectors.length}/${requiredSelectors.length}); branded header image contract protected`)
