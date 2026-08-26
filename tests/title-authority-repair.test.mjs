import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DEV_ROUTE_ENHANCERS, BUILD_ROUTE_ENHANCERS } from '../scripts/run-route-enhancers.mjs';
import { assertDeclaration, declaration, mediaBlock, ruleBlock } from './helpers/css-contract.mjs';

const read = (path) => readFileSync(path, 'utf8');
const stage = read('src/components/TeamIdentityTitleStage.jsx');
const stageCss = read('src/components/TeamIdentityTitleStage.css');
const stageBrandCss = read('src/components/TeamIdentityBrandHierarchy.css');
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

const mobileCoachTitle = mediaBlock(coachTitleCss, '(max-width:700px)');
const baseCoachHeroLogo = ruleBlock(coachTitleCss, '.mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark img');
const baseCoachPrimary = ruleBlock(coachTitleCss, '.mcHero[data-team-identity-stage="coach-mission-control"] .mcPrimary');

test('one shared semantic title primitive owns Coach, Player, secondary, commitment, progress and branding preview surfaces', () => {
  assert.match(stage, /data-team-identity-stage="true"/);
  for (const source of [coachHeader, playerHeader, secondary, playerWorkspace, playerCommitment, progress, brandingPreview]) {
    assert.match(source, /TeamIdentityTitleStage/);
  }
  assert.doesNotMatch(stage, /appHeaderTitle|secondaryPageIntro|coach-dashboard-identity-header\s+appHeader/);
  assert.doesNotMatch(playerCommitment, /className=\{styles\.routeHeader\}/);
});

test('obsolete parallel title authorities remain deleted', () => {
  assert.match(secondaryCss, /Secondary title presentation is owned exclusively by TeamIdentityTitleStage/);
  assert.doesNotMatch(secondaryCss, /\.secondaryPageIntro\b|\.secondaryPageIntro__|\.secondaryPageAction\b/);
  assert.doesNotMatch(playerCommitmentCss, /\.routeHeader\b|\.routeEyebrow\b|\.routeTitleRow\b/);
  assert.equal(existsSync('src/components/SecondaryPageFirstViewport.css'), false);
  assert.doesNotMatch(playerCompositionEnhancer, /PlayerCommitmentCenter|MOBILE_COMMITMENT_COMPOSITION_CSS|commitment runtime style anchor/);
});

test('Coach Home loads consolidated responsibilities with one final source-owned title authority', () => {
  assert.match(coach, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coach, /mcHeroIdentity/);
  assert.match(coach, /mcProgramIdentity/);
  assert.doesNotMatch(coach, /MOBILE_PRODUCT_RESET_CSS|<style>/);

  const imports = [...coach.matchAll(/import ['"]\.\/(CoachMissionControl[^'"]+\.css)['"]/g)].map((match) => match[1]);
  assert.deepEqual(imports, [
    'CoachMissionControlInteractions.css',
    'CoachMissionControlShell.css',
    'CoachMissionControlFinal.css',
    'CoachMissionControlTitleStage.css',
  ]);
  assert.equal(imports.at(-1), 'CoachMissionControlTitleStage.css', 'TitleStage must remain the final Coach Home visual authority');
  assert.equal(imports.filter((name) => name === 'CoachMissionControlTitleStage.css').length, 1);

  const header = ruleBlock(mobileCoachTitle, '.mcHeader[data-testid="mission-control-team-header"]');
  const hero = ruleBlock(mobileCoachTitle, '.mcHero[data-team-identity-stage="coach-mission-control"]');
  const identity = ruleBlock(mobileCoachTitle, '.mcHeroIdentity');
  const crest = ruleBlock(mobileCoachTitle, '.mcHeroTeamMark');
  const programIdentity = ruleBlock(mobileCoachTitle, '.mcProgramIdentity');
  const heading = ruleBlock(mobileCoachTitle, ' h1');

  assertDeclaration(header, 'min-height', '56px');
  assertDeclaration(header, 'grid-template-columns', '44px minmax(0,1fr) 44px');
  assert.ok(header.includes('safe-area-inset-top'), 'header must retain safe-area geometry');
  assertDeclaration(hero, 'min-height', '382px');
  assertDeclaration(identity, '--coach-hero-crest', /^clamp\(96px,\s*26vw,\s*108px\)$/);
  for (const property of ['width','height','min-width','min-height','max-width','max-height']) {
    assertDeclaration(crest, property, 'var(--coach-hero-crest)');
  }
  assertDeclaration(baseCoachHeroLogo, 'object-fit', 'contain');
  assertDeclaration(baseCoachHeroLogo, 'width', '100%');
  assertDeclaration(baseCoachHeroLogo, 'height', '100%');
  assert.match(declaration(programIdentity, 'font') ?? '', /clamp\(36px,\s*10\.2vw,\s*45px\)/);
  assert.match(declaration(heading, 'font') ?? '', /clamp\(28px,\s*7\.6vw,\s*33px\)/);
  assert.match(declaration(heading, 'font') ?? '', /var\(--mc-native\)/);
  assertDeclaration(heading, 'text-transform', 'none');
  assert.doesNotMatch(declaration(heading, 'font') ?? '', /Barlow Condensed/);
  assert.doesNotMatch(coachTitleCss, /!important|html\s+body\s+#root/);
  assert.doesNotMatch(signatureEnhancer, /mcHeroTeamMark|mcProgramIdentity|mcHero h1|Coach mobile hero mark/);
});

test('historical Coach layers retain support/artwork responsibilities without claiming scoped title ownership', () => {
  const historicalLayers = [coachV2Css, coachHeaderCss, coachPolishCss, coach2026Css, coachShellCss, coachFinalCss];
  for (const legacyCss of historicalLayers) {
    assert.doesNotMatch(legacyCss, /\[data-team-identity-stage=["']coach-mission-control["']\]/);
  }
  assert.doesNotMatch(coachShellCss, /Rebalance the signature hero/);
  assert.doesNotMatch(coachFinalCss, /--mc-title-size|--mc-radius-hero/);
});

test('Coach decision ledger and primary CTA remain owned by TitleStage', () => {
  const obsoleteComponentOwners = [coachV2Css, coachHeaderCss, coachPolishCss, coach2026Css, coachShellCss, coachFinalCss];
  const lateOwners = [coachHierarchyCss, coachCascadeLockCss, coachCriticalCss, coachV5IntegrityCss, visualReboot, visualReleaseFixes];
  for (const obsoleteCss of [...obsoleteComponentOwners, ...lateOwners]) {
    assert.doesNotMatch(obsoleteCss, /\.mcRealityStrip\b|\.mcPrimary\b/);
  }

  const ledger = ruleBlock(mobileCoachTitle, '.mcRealityStrip');
  const primary = ruleBlock(mobileCoachTitle, '.mcPrimary');
  assert.match(declaration(ledger, 'background') ?? '', /rgba\(2,\s*13,\s*19,\s*\.18\)/);
  assert.match(declaration(baseCoachPrimary, 'background') ?? '', /color-mix/);
  assert.match(declaration(baseCoachPrimary, 'color') ?? '', /--team-brand-on-primary/);
  assertDeclaration(primary, 'min-height', '50px');

  const reduced = mediaBlock(coachTitleCss, '(prefers-reduced-motion:reduce)');
  const reducedAction = ruleBlock(reduced, '.mcRealityStrip button');
  assertDeclaration(reducedAction, 'transition', 'none');
  assert.ok(reduced.includes('.mcPrimary'), 'primary action must be covered by reduced-motion contract');

  assert.doesNotMatch(signatureEnhancer, /mcRealityStrip|mcPrimary|Coach final metric ledger|Coach final metric label/);
  assert.match(sessionIntegrityCss, /:not\(\[data-testid="coach-primary-objective"\]\) :is\(h1,h2,h3,h4,strong\)/);
  assert.match(sessionIntegrityCss, /:not\(\[data-testid="coach-primary-objective"\]\) :is\(p,small\)/);
  assert.match(industrialDesignFoundation, /button:not\(\.mcPrimary\)/);
  assert.doesNotMatch(industrialDesignFoundation, /performance-shell\.performance-shell button\s*,/);
});

test('late static and runtime cascade layers cannot claim the scoped Coach title stage', () => {
  for (const lateCss of [coachHierarchyCss, coachCascadeLockCss, coachCriticalCss, visualReboot, visualReleaseFixes]) {
    assert.doesNotMatch(lateCss, /\[data-team-identity-stage=["']coach-mission-control["']\]/);
    assert.doesNotMatch(lateCss, /\.mcHeroTeamMark\s*\{[^}]*display:\s*none/s);
  }
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
  assert.doesNotMatch(all, /apply-mobile-route-signature-promotion\.mjs|apply-mobile-centered-route-stage\.mjs|apply-team-identity-coach-hero-mark\.mjs/);
  for (const path of [
    'scripts/apply-mobile-route-signature-promotion.mjs',
    'scripts/apply-mobile-centered-route-stage.mjs',
    'scripts/apply-team-identity-coach-hero-mark.mjs',
    'scripts/title-authority-secondary-source-migration.mjs',
    '.github/workflows/title-authority-secondary-source-migration.yml',
    '.github/workflows/final-title-css-cleanup-v2-once.yml',
    'public/shotlab-team-identity-title-authority.css',
  ]) assert.equal(existsSync(path), false, `${path} must remain retired`);
});

test('shared title geometry preserves premium crest containment and difficult-title floor', () => {
  const rootRule = ruleBlock(stageCss, '.teamIdentityTitleStage');
  const heroRule = ruleBlock(stageCss, '.teamIdentityTitleStage--hero');
  assertDeclaration(rootRule, '--identity-crest', /^clamp\(96px,\s*25vw,\s*108px\)$/);
  assertDeclaration(heroRule, '--identity-crest', /^clamp\(104px,\s*29vw,\s*120px\)$/);
  const image = ruleBlock(stageCss, '.teamIdentityTitleStage__logo');
  assertDeclaration(image, 'object-fit', 'contain');
  assert.match(stageCss, /teamIdentityTitleStage--hero\.teamIdentityTitleStage--longTitle[\s\S]*clamp\(44px,\s*11vw,\s*52px\)/);
  assert.doesNotMatch(stageCss, /html\s+body\s+#root/);
});

test('no-logo handling is explicit, premium and Demo Titans branding is seeded directly by source data', () => {
  assert.match(stage, /showLogoSetupAction/);
  assert.match(stage, /teamIdentityTitleStage__fallbackAction/);
  assert.match(stage, /data-team-logo-fallback=\{fallbackInitials\}/);
  assert.match(stage, /teamIdentityTitleStage__fallbackCrest/);
  assert.match(stage, />Add logo</);
  assert.doesNotMatch(stage, /Click here to add your custom team logo/);
  assert.match(stageBrandCss, /\.teamIdentityTitleStage__fallbackAction/);
  assert.match(stageBrandCss, /min-width:\s*44px/);
  assert.match(coach, /mcHeroLogoSetup/);
  assert.match(coach, /mcTeamFallback/);
  assert.match(coach, /data-team-logo-fallback=\{mark\}/);
  assert.match(coach, /<small>Add logo<\/small>/);
  assert.doesNotMatch(coach, /Click here to add your custom team logo/);
  assert.match(demoData, /const DEMO_TEAM_BRANDING = Object\.freeze\(\{/);
  assert.match(demoData, /teamName:\s*"Demo Titans"/);
  assert.match(demoData, /logoUrl:\s*"\/branding\/titans-exact-logo\.png\.PNG"/);
  assert.match(demoData, /logoMarkUrl:\s*"\/branding\/titans-default-mark\.svg"/);
  assert.doesNotMatch(demoBrandingEnhancer, /writeFileSync|source\.replace|source\.slice/);
  assert.match(demoBrandingEnhancer, /no build-time identity mutation performed/);
  assert.ok(DEV_ROUTE_ENHANCERS.includes('scripts/apply-demo-team-branding.mjs'));
  assert.ok(BUILD_ROUTE_ENHANCERS.includes('scripts/apply-demo-team-branding.mjs'));
});
