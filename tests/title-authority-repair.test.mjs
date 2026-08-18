import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DEV_ROUTE_ENHANCERS, BUILD_ROUTE_ENHANCERS } from '../scripts/run-route-enhancers.mjs';

const read = (path) => readFileSync(path, 'utf8');
const stage = read('src/components/TeamIdentityTitleStage.jsx');
const stageCss = read('src/components/TeamIdentityTitleStage.css');
const coach = read('src/components/CoachCommandCenter.jsx');
const coachHeader = read('src/components/CoachDashboardHeader.jsx');
const playerHeader = read('src/components/PlayerDashboardHeader.jsx');
const secondary = read('src/components/SecondaryPageSystem.jsx');
const playerWorkspace = read('src/components/PlayerOperationalWorkspace.jsx');
const playerCommitment = read('src/components/PlayerCommitmentCenter.jsx');
const playerCommitmentCss = read('src/components/PlayerCommitmentCenter.module.css');
const progress = read('src/components/PlayerProgressStory.jsx');
const brandingPreview = read('src/components/team/TeamBrandingPreview.jsx');
const signatureEnhancer = read('scripts/apply-mobile-coach-signature-stage.mjs');
const secondaryEnhancer = read('scripts/apply-mobile-premium-secondary-page-system.mjs');
const playerCompositionEnhancer = read('scripts/apply-mobile-player-composition-reconciliation.mjs');

test('one shared semantic title primitive owns Coach, Player, secondary, commitment, progress and branding preview surfaces', () => {
  assert.match(stage, /data-team-identity-stage="true"/);
  for (const source of [coachHeader, playerHeader, secondary, playerWorkspace, playerCommitment, progress, brandingPreview]) {
    assert.match(source, /TeamIdentityTitleStage/);
  }
  assert.doesNotMatch(stage, /appHeaderTitle|secondaryPageIntro|coach-dashboard-identity-header\s+appHeader/);
  assert.doesNotMatch(playerCommitment, /className=\{styles\.routeHeader\}/);
});

test('obsolete Player commitment title CSS is deleted rather than left as dormant parallel authority', () => {
  assert.doesNotMatch(playerCommitmentCss, /\.routeHeader\b/);
  assert.doesNotMatch(playerCommitmentCss, /\.routeEyebrow\b/);
  assert.doesNotMatch(playerCommitmentCss, /\.routeTitleRow\b/);
});

test('Player optical reconciliation cannot mutate the shared commitment title surface', () => {
  assert.doesNotMatch(playerCompositionEnhancer, /PlayerCommitmentCenter/);
  assert.doesNotMatch(playerCompositionEnhancer, /MOBILE_COMMITMENT_COMPOSITION_CSS|commitment runtime style anchor/);
});

test('Coach Home source owns one integrated Mission Control identity and no title enhancer restores it', () => {
  assert.match(coach, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coach, /mcHeroIdentity/);
  assert.match(coach, /mcProgramIdentity/);
  assert.match(coach, /--coach-hero-crest:clamp\(108px,30vw,124px\)/);
  assert.match(coach, /font-size:clamp\(46px,12vw,58px\)/);
  assert.match(coach, /object-fit:contain/);
  assert.doesNotMatch(signatureEnhancer, /mcHeroTeamMark|mcProgramIdentity|mcHero h1|Coach mobile hero mark/);
});

test('secondary enhancer verifies title ownership instead of redesigning titles during builds', () => {
  assert.match(secondaryEnhancer, /Verified source-owned secondary title architecture/);
  assert.doesNotMatch(secondaryEnhancer, /writeFileSync\(.*SecondaryPageSystem\.css/);
  assert.doesNotMatch(secondaryEnhancer, /writeFileSync\(.*App\.jsx/);
  assert.doesNotMatch(secondaryEnhancer, /writeFileSync\(.*PlayerCommitmentCenter\.jsx/);
  assert.doesNotMatch(secondaryEnhancer, /secondaryPageIntro__title|routeTitleRow h1|Drills Dashboard.*replace/);
});

test('title-only mutation scripts, temporary migrations and emergency late authority are absent', () => {
  const all = [...DEV_ROUTE_ENHANCERS, ...BUILD_ROUTE_ENHANCERS].join('\n');
  assert.doesNotMatch(all, /apply-mobile-route-signature-promotion\.mjs/);
  assert.doesNotMatch(all, /apply-mobile-centered-route-stage\.mjs/);
  assert.doesNotMatch(all, /apply-team-identity-coach-hero-mark\.mjs/);
  assert.equal(existsSync('scripts/apply-mobile-route-signature-promotion.mjs'), false);
  assert.equal(existsSync('scripts/apply-mobile-centered-route-stage.mjs'), false);
  assert.equal(existsSync('scripts/apply-team-identity-coach-hero-mark.mjs'), false);
  assert.equal(existsSync('scripts/title-authority-secondary-source-migration.mjs'), false);
  assert.equal(existsSync('.github/workflows/title-authority-secondary-source-migration.yml'), false);
  assert.equal(existsSync('.github/workflows/final-title-css-cleanup-v2-once.yml'), false);
  assert.equal(existsSync('public/shotlab-team-identity-title-authority.css'), false);
});

test('shared title geometry preserves premium crest scale, containment and difficult-title floor', () => {
  assert.match(stageCss, /--identity-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.match(stageCss, /object-fit:\s*contain/);
  assert.match(stageCss, /teamIdentityTitleStage--hero\.teamIdentityTitleStage--longTitle[\s\S]*clamp\(44px,\s*11vw,\s*52px\)/);
  assert.doesNotMatch(stageCss, /html\s+body\s+#root/);
});

test('no-logo fallback is explicit while the canonical Titans demo identity can retain its real mark', () => {
  assert.match(stage, /isDefaultTitansLogo/);
  assert.match(stage, /teamOwnsDefaultTitansIdentity/);
  assert.match(stage, /teamIdentityTitleStage__fallbackCrest/);
  assert.match(coach, /mcTeamFallback/);
});
