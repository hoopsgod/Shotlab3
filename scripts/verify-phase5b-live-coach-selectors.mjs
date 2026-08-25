import fs from 'node:fs'
import path from 'node:path'

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
  '.mcRailBrand .mcRailLogo',
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

for (const sourceOwnedIdentityContract of [
  /data-team-identity-stage="coach-mission-control"/,
  /className="mcHeroIdentity"/,
  /className="mcHeroTeamMark"/,
  /const heroTeamLogoUrl = fullTeamLogoUrl;/,
  /heroTeamLogoUrl \? <img src=\{heroTeamLogoUrl\} alt=\{`\$\{teamName\} logo`\} \/> : <LogoSetupPrompt teamName=\{teamName\} className="mcHeroLogoSetup" \/>/,
]) {
  if (!sourceOwnedIdentityContract.test(coachSource)) {
    throw new Error(`Coach Hero identity is missing source-owned DOM contract: ${sourceOwnedIdentityContract}`)
  }
}

const coachTitleCss = fs.readFileSync(coachTitleCssPath, 'utf8')
for (const sourceOwnedGeometryContract of [
  /--coach-hero-crest:\s*clamp\(104px,\s*27vw,\s*112px\)/,
  /\.mcHeroTeamMark\s*\{[\s\S]*width:\s*var\(--coach-hero-crest\);[\s\S]*height:\s*var\(--coach-hero-crest\)/,
  /\.mcHeroTeamMark img\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*object-fit:\s*contain/,
]) {
  if (!sourceOwnedGeometryContract.test(coachTitleCss)) {
    throw new Error(`Coach Hero identity is missing source-owned geometry contract: ${sourceOwnedGeometryContract}`)
  }
}

console.log(`Phase 5B Coach CSS preservation: PASS (${requiredSelectors.length}/${requiredSelectors.length}); live Coach artwork and source-owned Hero identity contracts verified`)
