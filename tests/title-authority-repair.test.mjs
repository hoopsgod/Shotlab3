import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DEV_ROUTE_ENHANCERS, BUILD_ROUTE_ENHANCERS } from '../scripts/run-route-enhancers.mjs';

const read = (path) => readFileSync(path, 'utf8');
const stage = read('src/components/TeamIdentityTitleStage.jsx');
const stageCss = read('src/components/TeamIdentityTitleStage.css');
const stageBrandCss = read('src/components/TeamIdentityBrandHierarchy.css');
const coach = read('src/components/CoachCommandCenter.jsx');
const coachTitleCss = read('src/components/CoachMissionControlTitleStage.css');
const coachShellCss = read('src/components/CoachMissionControlShell.css');
const coachHeader = read('src/components/CoachDashboardHeader.jsx');
const playerHeader = read('src/components/PlayerDashboardHeader.jsx');
const secondary = read('src/components/SecondaryPageSystem.jsx');
const secondaryCss = read('src/components/SecondaryPageSystem.css');
const playerWorkspace = read('src/components/PlayerOperationalWorkspace.jsx');
const playerCommitment = read('src/components/PlayerCommitmentCenter.jsx');
const playerCommitmentCss = read('src/components/PlayerCommitmentCenter.module.css');
const progress = read('src/components/PlayerProgressStory.jsx');
const brandingPreview = read('src/components/team/TeamBrandingPreview.jsx');
const secondaryEnhancer = read('scripts/apply-mobile-premium-secondary-page-system.mjs');
const playerCompositionEnhancer = read('scripts/apply-mobile-player-composition-reconciliation.mjs');
const demoBrandingEnhancer = read('scripts/apply-demo-team-branding.mjs');
const demoData = read('src/lib/demoData.js');

const mobileShellBlock = coachShellCss.match(/@media\(max-width:700px\)\{([\s\S]*)\}\s*$/)?.[1] || '';

test('shared semantic title primitive remains authoritative for reusable authenticated page titles', () => {
  assert.match(stage, /data-team-identity-stage="true"/);
  for (const source of [coachHeader, playerHeader, secondary, playerWorkspace, playerCommitment, progress, brandingPreview]) assert.match(source, /TeamIdentityTitleStage/);
  assert.doesNotMatch(stage, /appHeaderTitle|secondaryPageIntro|coach-dashboard-identity-header\s+appHeader/);
  assert.doesNotMatch(playerCommitment, /className=\{styles\.routeHeader\}/);
});

test('obsolete parallel secondary-page title authorities remain deleted', () => {
  assert.match(secondaryCss, /Secondary title presentation is owned exclusively by TeamIdentityTitleStage/);
  assert.doesNotMatch(secondaryCss, /\.secondaryPageIntro\b|\.secondaryPageIntro__|\.secondaryPageAction\b/);
  assert.doesNotMatch(playerCommitmentCss, /\.routeHeader\b|\.routeEyebrow\b|\.routeTitleRow\b/);
  assert.equal(existsSync('src/components/SecondaryPageFirstViewport.css'), false);
  assert.doesNotMatch(playerCompositionEnhancer, /PlayerCommitmentCenter|MOBILE_COMMITMENT_COMPOSITION_CSS|commitment runtime style anchor/);
});

test('Coach Home keeps one source-owned hero while runtime shell bridge owns device containment and final mobile parity', () => {
  assert.match(coach, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coach, /mcHeroIdentity/);
  assert.match(coach, /mcProgramIdentity/);
  assert.match(coach, /is-mobile-shell/);
  assert.doesNotMatch(coach, /MOBILE_PRODUCT_RESET_CSS|<style>/);
  const imports = [...coach.matchAll(/import ['"]\.\/(CoachMissionControl[^'"]+\.css)['"]/g)].map((match) => match[1]);
  assert.deepEqual(imports, ['CoachMissionControlInteractions.css','CoachMissionControlShell.css','CoachMissionControlFinal.css','CoachMissionControlTitleStage.css']);
  assert.equal(imports.filter((name) => name === 'CoachMissionControlTitleStage.css').length, 1);
  assert.match(coachTitleCss, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coachShellCss, /\.mcShellV3\.is-mobile-shell/);
  assert.match(coachShellCss, /\.mcShellV3\.is-mobile-shell > \.mcRail\{display:none!important\}/);
  assert.match(coachShellCss, /\.mcShellV3\.is-mobile-shell\{[^}]*text-size-adjust:100%!important/);
  assert.match(mobileShellBlock, /\.mcHeader\[data-testid="mission-control-team-header"\]\{display:none!important\}/);
  assert.match(mobileShellBlock, /\.mcHero\[data-team-identity-stage="coach-mission-control"\]\{min-height:334px!important\}/);
  assert.match(mobileShellBlock, /\.mcProgramIdentity\{font:780 11px\/1\.2/);
  assert.match(mobileShellBlock, /h1\{[^}]*clamp\(40px,10\.2vw,44px\)[^}]*"Barlow Condensed"/);
  assert.match(mobileShellBlock, /\.mcHeroContent>p\{[^}]*font:520 14px\/1\.42/);
});

test('Coach mobile hierarchy intentionally uses one visible introduction instead of the retired utility-header-plus-hero stack', () => {
  assert.match(mobileShellBlock, /Coach Home had two competing introduction systems on iPhone/);
  assert.match(mobileShellBlock, /Remove the duplicate mobile header/);
  assert.match(mobileShellBlock, /Match the shared mobile editorial language used by Players and Events/);
  assert.doesNotMatch(mobileShellBlock, /\.mcProgramIdentity\{[^}]*clamp\(36px,\s*10\.2vw,\s*45px\)/);
  assert.doesNotMatch(mobileShellBlock, /h1\{[^}]*clamp\(28px,\s*7\.6vw,\s*33px\)/);
});

test('secondary enhancer verifies title ownership instead of redesigning titles during builds', () => {
  assert.match(secondaryEnhancer, /Verified source-owned secondary title architecture/);
  assert.doesNotMatch(secondaryEnhancer, /writeFileSync\(.*SecondaryPageSystem\.css/);
  assert.doesNotMatch(secondaryEnhancer, /writeFileSync\(.*App\.jsx/);
  assert.doesNotMatch(secondaryEnhancer, /writeFileSync\(.*PlayerCommitmentCenter\.jsx/);
  assert.doesNotMatch(secondaryEnhancer, /secondaryPageIntro__title|routeTitleRow h1|Drills Dashboard.*replace/);
});

test('title-only mutation scripts and emergency late authority remain retired', () => {
  const all = [...DEV_ROUTE_ENHANCERS, ...BUILD_ROUTE_ENHANCERS].join('\n');
  assert.doesNotMatch(all, /apply-mobile-route-signature-promotion\.mjs|apply-mobile-centered-route-stage\.mjs|apply-team-identity-coach-hero-mark\.mjs/);
  for (const path of ['scripts/apply-mobile-route-signature-promotion.mjs','scripts/apply-mobile-centered-route-stage.mjs','scripts/apply-team-identity-coach-hero-mark.mjs','scripts/title-authority-secondary-source-migration.mjs','.github/workflows/title-authority-secondary-source-migration.yml','.github/workflows/final-title-css-cleanup-v2-once.yml','public/shotlab-team-identity-title-authority.css']) assert.equal(existsSync(path), false, `${path} must remain retired`);
});

test('shared title geometry preserves premium crest containment and difficult-title floor', () => {
  assert.match(stageCss, /\.teamIdentityTitleStage/);
  assert.match(stageCss, /--identity-crest:\s*clamp\(96px,\s*25vw,\s*108px\)/);
  assert.match(stageCss, /teamIdentityTitleStage--hero[\s\S]*--identity-crest:\s*clamp\(104px,\s*29vw,\s*120px\)/);
  assert.match(stageCss, /\.teamIdentityTitleStage__crest\s*\{[\s\S]*object-fit:\s*contain/);
  assert.match(stageCss, /teamIdentityTitleStage--hero\.teamIdentityTitleStage--longTitle[\s\S]*clamp\(44px,\s*11vw,\s*52px\)/);
  assert.doesNotMatch(stageCss, /html\s+body\s+#root/);
});

test('no-logo handling is explicit and Demo Titans branding is seeded directly by source data', () => {
  assert.match(stage, /showLogoSetupAction/);
  assert.match(stage, /teamIdentityTitleStage__fallbackAction/);
  assert.match(stage, /data-team-logo-fallback=\{fallbackInitials\}/);
  assert.match(stageBrandCss, /\.teamIdentityTitleStage__fallbackAction/);
  assert.match(coach, /mcHeroLogoSetup/);
  assert.match(coach, /mcTeamFallback/);
  assert.match(demoData, /teamName:\s*"Demo Titans"/);
  assert.match(demoData, /logoUrl:\s*"\/branding\/titans-exact-logo\.png\.PNG"/);
  assert.match(demoData, /logoMarkUrl:\s*"\/branding\/titans-default-mark\.svg"/);
  assert.doesNotMatch(demoBrandingEnhancer, /writeFileSync|source\.replace|source\.slice/);
  assert.match(demoBrandingEnhancer, /no build-time identity mutation performed/);
  assert.ok(DEV_ROUTE_ENHANCERS.includes('scripts/apply-demo-team-branding.mjs'));
  assert.ok(BUILD_ROUTE_ENHANCERS.includes('scripts/apply-demo-team-branding.mjs'));
});
