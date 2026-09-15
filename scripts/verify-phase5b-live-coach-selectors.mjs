import fs from 'node:fs'
import path from 'node:path'
import { assertDeclaration, ruleBlock } from '../tests/helpers/css-contract.mjs'

const assetsDir = path.resolve('dist/assets')
const coachSourcePath = path.resolve('src/components/CoachCommandCenter.jsx')
const coachTitleCssPath = path.resolve('src/components/CoachMissionControlTitleStage.css')

if (!fs.existsSync(assetsDir)) {
  throw new Error(`Missing production assets directory: ${assetsDir}`)
}

const builtCss = fs.readdirSync(assetsDir)
  .filter((name) => name.endsWith('.css'))
  .map((name) => fs.readFileSync(path.join(assetsDir, name), 'utf8'))
  .join('\n')

const requiredSelectors = [
  '.mcCourtArtwork',
  '.mcRailBrand',
  '.mcRailBrand img',
  '.mcDrawerLogo',
  '.mcDrawerLogo img',
]

const missing = requiredSelectors.filter((selector) => !builtCss.includes(selector))
if (missing.length) {
  throw new Error(`Phase 5B removed live Coach Mission Control selectors: ${missing.join(', ')}`)
}

const coachSource = fs.readFileSync(coachSourcePath, 'utf8')
if (!/function CourtArtwork\(/.test(coachSource) || !/className="mcCourtArtwork"/.test(coachSource)) {
  throw new Error('Phase 5B could not verify the live Coach court artwork component contract')
}
if (!/className="mcRailLogo"/.test(coachSource)) {
  throw new Error('Phase 5B could not verify the live Coach rail logo DOM contract')
}

for (const sourceOwnedIdentityContract of [
  /data-team-identity-stage="coach-mission-control"/,
  /className="mcHeroIdentity"/,
  /className="mcHeroTeamMark"/,
  /const\s+heroTeamLogoUrl\s*=\s*fullTeamLogoUrl/,
  /heroTeamLogoUrl\s*\?\s*<img[^>]*src=\{heroTeamLogoUrl\}[^>]*>\s*:\s*<LogoSetupPrompt[^>]*className="mcHeroLogoSetup"/s,
]) {
  if (!sourceOwnedIdentityContract.test(coachSource)) {
    throw new Error(`Coach Hero identity is missing source-owned DOM contract: ${sourceOwnedIdentityContract}`)
  }
}

const coachTitleCss = fs.readFileSync(coachTitleCssPath, 'utf8')
const crestImage = ruleBlock(coachTitleCss, '.mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark img')

// Phase 6E intentionally removes the duplicate mobile utility header and moves the
// certified 390px hero geometry into the higher-specificity source-owned authority.
// The file contains an earlier <=700px compatibility block whose header is still
// display:grid; the exact Phase 6E selector below is the later winning rule. Verify
// that winning source contract directly instead of reading only the first media block.
for (const contract of [
  /Phase 6E mobile Coach Home composition authority/,
  /body\.mission-control-active \.mcShellV3\.is-mobile-shell \.mcHeader\[data-testid="mission-control-team-header"\]\{display:none\}/,
  /body\.mission-control-active \.mcShellV3\.is-mobile-shell \.mcHero\[data-team-identity-stage="coach-mission-control"\]\{min-height:334px\}/,
  /body\.mission-control-active \.mcShellV3\.is-mobile-shell \.mcHero\[data-team-identity-stage="coach-mission-control"\] \.mcHeroIdentity\{--coach-hero-crest:clamp\(104px,29vw,120px\);gap:12px\}/,
  /body\.mission-control-active \.mcShellV3\.is-mobile-shell \.mcHero\[data-team-identity-stage="coach-mission-control"\] \.mcPrimary\{margin-top:11px\}/,
]) {
  if (!contract.test(coachTitleCss)) {
    throw new Error(`Phase 5B could not verify canonical Phase 6E Coach mobile authority: ${contract}`)
  }
}
assertDeclaration(crestImage, 'width', '100%')
assertDeclaration(crestImage, 'height', '100%')
assertDeclaration(crestImage, 'object-fit', 'contain')

for (const productionContract of [
  '.mcShellV3.is-mobile-shell',
  'min-height:334px',
  '--coach-hero-crest:clamp(104px,29vw,120px)',
]) {
  if (!builtCss.includes(productionContract)) {
    throw new Error(`Phase 5B production CSS lost canonical Coach mobile authority: ${productionContract}`)
  }
}

console.log(`Phase 5B Coach CSS preservation: PASS (${requiredSelectors.length}/${requiredSelectors.length}); live Coach artwork, rail logo, hidden mobile utility header, certified 390px hero geometry, and crest containment verified`)
