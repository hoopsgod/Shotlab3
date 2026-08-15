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
  '.mcCourtArtwork',
  '.mcCourtFloor',
  '.mcRailBrand',
  '.mcRailBrand .mcRailLogo',
  '.mcDrawerLogo',
  '.mcDrawerLogo img',
]

const missing = requiredSelectors.filter((selector) => !builtCss.includes(selector))
if (missing.length) {
  throw new Error(`Phase 5B removed live Coach Mission Control selectors: ${missing.join(', ')}`)
}

const coachSource = fs.readFileSync(coachSourcePath, 'utf8')
if (!/className="mcTacticalCourt"/.test(coachSource) || !/<svg\b/.test(coachSource)) {
  throw new Error('Phase 5B could not verify the live tactical Coach court artwork contract')
}

const brandLockup = coachSource.match(/<div className="mcBrandLockup">([\s\S]*?)<\/div>/)?.[1]
if (!brandLockup) {
  throw new Error('Phase 5B could not verify the Coach brand-lockup DOM contract')
}

if (/<img\b/.test(brandLockup)) {
  for (const imageSafetyContract of [
    /style=\{\{[^}]*width:\s*48[^}]*height:\s*48/,
    /objectFit:\s*"contain"/,
    /display:\s*"block"/,
    /src=\{cleanMarkLogoUrl\}/,
  ]) {
    if (!imageSafetyContract.test(brandLockup)) {
      throw new Error(`Coach brand lockup image is missing production-safe sizing contract: ${imageSafetyContract}`)
    }
  }
}

console.log(`Phase 5B Coach CSS preservation: PASS (${requiredSelectors.length}/${requiredSelectors.length}); tactical court and live Coach brand-image sizing contracts verified`)
