import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DEV_ROUTE_ENHANCERS, BUILD_ROUTE_ENHANCERS } from '../scripts/run-route-enhancers.mjs';

const read = (path) => readFileSync(path, 'utf8');
const stage = read('src/components/TeamIdentityTitleStage.jsx');
const stageCss = read('src/components/TeamIdentityTitleStage.css');
const coach = read('src/components/CoachCommandCenter.jsx');
const coachTitleCss = read('src/components/CoachMissionControlTitleStage.css');
const coachHeader = read('src/components/CoachDashboardHeader.jsx');
const playerHeader = read('src/components/PlayerDashboardHeader.jsx');
const secondary = read('src/components/SecondaryPageSystem.jsx');
const secondaryCss = read('src/components/SecondaryPageSystem.css');
const playerWorkspace = read('src/components/PlayerOperationalWorkspace.jsx');
const playerCommitment = read('src/components/PlayerCommitmentCenter.jsx');
const playerCommitmentCss = read('src/components/PlayerCommitmentCenter.module.css');
const progress = read('src/components/PlayerProgressStory.jsx');
const brandingPreview = read('src/components/team/TeamBrandingPreview.jsx');
const signatureEnhancer = read('scripts/apply-mobile-coach-signature-stage.mjs');
const secondaryEnhancer = read('scripts/apply-mobile-premium-secondary-page-system.mjs');
const playerCompositionEnhancer = read('scripts/apply-mobile-player-composition-reconciliation.mjs');
const demoBrandingEnhancer = read('scripts/apply-demo-team-branding.mjs');
const demoData = read('src/lib/demoData.js');
const coachV2Css = read('src/components/CoachMissionControlV2.css');
const coachHeaderCss = read('src/components/CoachMissionControlHeader.css');
const coachPolishCss = read('src/components/CoachMissionControlPolish.css');
const coach2026Css = read('src/components/CoachMissionControl2026.css');
const coachShellCss = read('src/components/CoachMissionControlShell.css');
const coachFinalCss = read('src/components/CoachMissionControlFinal.css');
const coachHierarchyCss = read('src/styles/MissionControlHierarchy2026.css');
const coachCascadeLockCss = read('src/styles/MissionControlCascadeLock2026.css');
const coachCriticalCss = read('public/shotlab-phase2-critical.css');
const coachV5IntegrityCss = read('public/shotlab-v5-coach-integrity.css');
const visualReboot = read('src/lib/visualSystemReboot.js');
const visualReleaseFixes = read('src/lib/visualSystemRebootReleaseFixes.js');
const sessionIntegrityCss = read('public/shotlab-v15-session-integrity.css');
const industrialDesignFoundation = read('src/lib/industrialDesignFoundation.js');

test('one shared semantic title primitive owns Coach, Player, secondary, commitment, progress and branding preview surfaces', () => {
  assert.match(stage, /data-team-identity-stage="true"/);
  for (const source of [coachHeader, playerHeader, secondary, playerWorkspace, playerCommitment, progress, brandingPreview]) {
    assert.match(source, /TeamIdentityTitleStage/);
  }
  assert.doesNotMatch(stage, /appHeaderTitle|secondaryPageIntro|coach-dashboard-identity-header\s+appHeader/);
  assert.doesNotMatch(playerCommitment, /className=\{styles\.routeHeader\}/);
});

test('obsolete secondary intro and action CSS is deleted rather than kept as dormant title authority', () => {
  assert.match(secondaryCss, /Secondary title presentation is owned exclusively by TeamIdentityTitleStage/);
  assert.doesNotMatch(secondaryCss, /\.secondaryPageIntro\b/);
  assert.doesNotMatch(secondaryCss, /\.secondaryPageIntro__/);
  assert.doesNotMatch(secondaryCss, /\.secondaryPageAction\b/);
  assert.equal(existsSync('src/components/SecondaryPageFirstViewport.css'), false);
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

test('Coach Home markup and owned component CSS form one tactical decision-first Mission Control title authority', () => {
  assert.match(coach, /import "\.\/CoachMissionControlTitleStage\.css"/);
  assert.match(coach, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coach, /mcHeroIdentity/);
  assert.match(coach, /mcProgramIdentity/);
  assert.doesNotMatch(coach, /MOBILE_PRODUCT_RESET_CSS|<style>/);
  assert.match(coachTitleCss, /--coach-hero-crest:\s*clamp\(104px,\s*27vw,\s*112px\)/);
  assert.match(coachTitleCss, /font-size:\s*clamp\(44px,\s*11\.3vw,\s*48px\)/);
  assert.match(coachTitleCss, /\.mcHeroContent[\s\S]*width:\s*100%/);
  assert.match(coachTitleCss, /object-fit:\s*contain/);
  assert.match(coachTitleCss, /\.mcTeamSelect\s*\{\s*display:\s*none/);
  assert.match(coachTitleCss, /\.mcBrandLockup\s*\{[\s\S]*display:\s*flex/);
  assert.doesNotMatch(coachTitleCss, /!important|html\s+body\s+#root/);
  assert.doesNotMatch(signatureEnhancer, /mcHeroTeamMark|mcProgramIdentity|mcHero h1|Coach mobile hero mark/);
});

test('legacy Coach component CSS no longer owns mobile Hero, crest, title, or summary geometry', () => {
  const legacyLayers = [coachV2Css, coachHeaderCss, coachPolishCss, coach2026Css, coachShellCss, coachFinalCss];
  for (const legacyCss of legacyLayers) {
    assert.doesNotMatch(legacyCss, /\.mcHero\s*\{[^}]*min-height\s*:\s*(?:286|292|300|302|304|306|318|322|330|370|382)px/s);
    assert.doesNotMatch(legacyCss, /\.mcHeroTeamMark\s*\{[^}]*width\s*:\s*(?:68|72|74|80|82|84|86|88|92|118)px/s);
    assert.doesNotMatch(legacyCss, /\.mcHero\s+h1\s*\{[^}]*font-size\s*:\s*(?:27|28|29|30|31|33|34|36|39\.375|43)px/s);
  }
  assert.doesNotMatch(coachHeaderCss, /\.mcHeroTeamMark\s*\{|\.mcHero\s+h1\s*\{/);
  assert.doesNotMatch(coachPolishCss, /\.mcHeroTeamMark\s*\{|\.mcHero\s+h1\s*\{/);
  assert.doesNotMatch(coachShellCss, /Rebalance the signature hero/);
  assert.doesNotMatch(coachFinalCss, /--mc-title-size|--mc-radius-hero/);
});

test('Coach Home decision, metrics and CTA have one source owner', () => {
  const obsoleteComponentOwners = [coachV2Css, coachHeaderCss, coachPolishCss, coach2026Css, coachShellCss, coachFinalCss];
  const lateOwners = [coachHierarchyCss, coachCascadeLockCss, coachCriticalCss, coachV5IntegrityCss, visualReboot, visualReleaseFixes];
  for (const obsoleteCss of [...obsoleteComponentOwners, ...lateOwners]) {
    assert.doesNotMatch(obsoleteCss, /\.mcRealityStrip\b|\.mcPrimary\b/);
  }
  assert.match(coachTitleCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][\s\S]*\.mcRealityStrip\s*\{/);
  assert.match(coachTitleCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\][\s\S]*\.mcPrimary\s*\{/);
  assert.match(coachTitleCss, /\.mcRealityStrip\s*\{[\s\S]*background:\s*color-mix\(in srgb,\s*var\(--team-brand-surface-deep/);
  assert.match(coachTitleCss, /\.mcRealityStrip strong\s*\{[\s\S]*color:\s*#f5f8f9/);
  assert.match(coachTitleCss, /\.mcRealityStrip small\s*\{[\s\S]*color:\s*#9ba7ae/);
  assert.doesNotMatch(coachTitleCss, /!important|html\s+body\s+#root/);
  assert.doesNotMatch(signatureEnhancer, /mcRealityStrip|mcPrimary|Coach final metric ledger|Coach final metric label/);
  assert.match(sessionIntegrityCss, /:not\(\[data-testid="coach-primary-objective"\]\) :is\(h1,h2,h3,h4,strong\)/);
  assert.match(sessionIntegrityCss, /:not\(\[data-testid="coach-primary-objective"\]\) :is\(p,small\)/);
  assert.match(industrialDesignFoundation, /button:not\(\.mcPrimary\)/);
  assert.doesNotMatch(industrialDesignFoundation, /performance-shell\.performance-shell button\s*,/);
});

test('late static and runtime Coach cascade layers cannot hide or redesign the owned title stage', () => {
  for (const lateCss of [coachHierarchyCss, coachCascadeLockCss, coachCriticalCss, visualReboot, visualReleaseFixes]) {
    assert.doesNotMatch(lateCss, /\.mcHeroTeamMark\s*\{[^}]*display:\s*none/s);
    assert.doesNotMatch(lateCss, /\.mcHeroTeamMark\s*\{[^}]*width\s*:/s);
    assert.doesNotMatch(lateCss, /\.mcHero\s+h1\s*\{[^}]*font-size\s*:/s);
    assert.doesNotMatch(lateCss, /\.mcHeroContent\s*\{[^}]*grid-template-columns\s*:/s);
  }
  assert.doesNotMatch(coachHierarchyCss, /\.mcHeader\s*\{/);
  assert.doesNotMatch(coachCascadeLockCss, /\.mcHeader\s*\{/);
  assert.doesNotMatch(visualReboot, /\.mcHero\b|\.mcHeroContent\b|\.mcHeroLogo\b|\.mcEyebrow\b/);
  assert.doesNotMatch(visualReleaseFixes, /\.mcHero\b|\.mcHeroContent\b|\.mcHeroLogo\b|\.mcEyebrow\b/);
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

test('no-logo handling is explicit and Demo Titans branding is seeded directly by source data', () => {
  assert.match(stage, /showLogoSetupPrompt/);
  assert.match(stage, /teamIdentityTitleStage__logoSetup/);
  assert.match(stage, /teamIdentityTitleStage__fallbackCrest/);
  assert.match(stage, /Click here to add your custom team logo/);
  assert.match(coach, /mcHeroLogoSetup/);
  assert.match(coach, /Click here to add your custom team logo/);
  assert.match(demoData, /const DEMO_TEAM_BRANDING = Object\.freeze\(\{/);
  assert.match(demoData, /teamName:\s*"Demo Titans"/);
  assert.match(demoData, /logoUrl:\s*"\/branding\/titans-exact-logo\.png\.PNG"/);
  assert.match(demoData, /logoMarkUrl:\s*"\/branding\/titans-default-mark\.svg"/);
  assert.match(demoData, /teamName:\s*DEMO_TEAM_BRANDING\.teamName/);
  assert.match(demoData, /logoUrl:\s*DEMO_TEAM_BRANDING\.logoUrl/);
  assert.match(demoData, /logoMarkUrl:\s*DEMO_TEAM_BRANDING\.logoMarkUrl/);
  assert.doesNotMatch(demoBrandingEnhancer, /writeFileSync|source\.replace|source\.slice/);
  assert.match(demoBrandingEnhancer, /no build-time identity mutation performed/);
  assert.ok(DEV_ROUTE_ENHANCERS.includes('scripts/apply-demo-team-branding.mjs'));
  assert.ok(BUILD_ROUTE_ENHANCERS.includes('scripts/apply-demo-team-branding.mjs'));
});
