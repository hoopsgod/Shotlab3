import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const stage = read('src/components/TeamIdentityTitleStage.jsx');
const stageCss = read('src/components/TeamIdentityTitleStage.css');
const brandCss = read('src/components/TeamIdentityBrandHierarchy.css');
const secondary = read('src/components/SecondaryPageSystem.jsx');
const playerWorkspace = read('src/components/PlayerOperationalWorkspace.jsx');
const playerHome = read('src/components/PlayerDashboardHeader.jsx');
const coachHome = read('src/components/CoachCommandCenter.jsx');
const brandingPreview = read('src/components/team/TeamBrandingPreview.jsx');
const geometry = read('src/styles/AuthenticatedVisualAuthority2026.css');

const titleRule = stageCss.match(/\.teamIdentityTitleStage__title\s*\{([\s\S]*?)\}/)?.[1] || '';
const longMultiRule = stageCss.match(/\.teamIdentityTitleStage--longTitle\.teamIdentityTitleStage--multiWord \.teamIdentityTitleStage__title\s*\{([\s\S]*?)\}/)?.[1] || '';

test('authenticated mobile title authority exposes exactly identity and editorial families', () => {
  assert.match(stage, /data-title-stage-family=\{titleFamily\}/);
  assert.match(stage, /titleFamily = heroClass === "teamIdentityTitleStage--hero" \? "identity" : "editorial"/);
  assert.match(stage, /titleFamily === "editorial" && requestedMobileStage === "team-identity"[\s\S]*\? "editorial"/);
  assert.match(playerHome, /variant="hero"/);
  assert.match(playerHome, /surface="dark"/);
  assert.match(coachHome, /data-team-identity-stage="coach-mission-control"/);
  assert.match(secondary, /variant="editorial"/);
  assert.match(playerWorkspace, /variant="editorial"/);
});

test('editorial page titles cannot opt into partial-word wrapping', () => {
  assert.match(titleRule, /overflow-wrap:\s*normal/);
  assert.match(titleRule, /word-break:\s*normal/);
  assert.match(titleRule, /hyphens:\s*none/);
  assert.doesNotMatch(titleRule, /anywhere|break-all/);
  assert.doesNotMatch(longMultiRule, /anywhere|break-all/);
  assert.match(stageCss, /teamIdentityTitleStage--singleWord[\s\S]*white-space:\s*nowrap/);
  assert.match(stageCss, /teamIdentityTitleStage--longSingleWord[\s\S]*clamp\(36px,\s*9\.6vw,\s*40px\)/);
});

test('secondary destinations use semantic team-brand treatments instead of one repeated crest template', () => {
  assert.match(stage, /BRAND_TREATMENTS = new Set\(\["hero", "compact", "signature", "watermark", "none"\]\)/);
  assert.match(stage, /AUTO_BRAND_TREATMENT_BY_PAGE_KIND/);
  assert.match(stage, /events: "compact"/);
  assert.match(stage, /strength: "watermark"/);
  assert.match(stage, /leaderboards: "none"/);
  assert.match(stage, /data-brand-treatment=\{resolvedBrandTreatment\}/);
  assert.match(stage, /resolvedBrandTreatment === "hero"/);
  assert.match(brandCss, /data-brand-treatment="compact"/);
  assert.match(stage, /resolvedBrandTreatment === "watermark"/);
  assert.match(brandCss, /not\(\[data-brand-treatment="hero"\]\)[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(brandCss, /teamIdentityTitleStage__microBrand/);
  assert.match(brandCss, /teamIdentityTitleStage__signatureRule/);
  assert.match(brandCss, /teamIdentityTitleStage__watermarkBrand/);
  assert.match(secondary, /training:"signature"/);
  assert.match(secondary, /calendar:"compact"/);
  assert.match(secondary, /strength:"watermark"/);
  assert.match(secondary, /trophy:"none"/);
  assert.match(secondary, /team:"signature"/);
  assert.match(playerWorkspace, /"at-home": "signature"/);
  assert.match(playerWorkspace, /events: "compact"/);
  assert.match(playerWorkspace, /strength: "watermark"/);
  assert.match(playerWorkspace, /leaderboards: "none"/);
});

test('Home and Program Branding preserve an intentional identity-heavy hero treatment', () => {
  assert.match(stage, /requestedBrandTreatment === "auto"[\s\S]*titleFamily === "identity" \? "hero" : automaticEditorialTreatment/);
  assert.match(playerHome, /variant="hero"/);
  assert.match(coachHome, /mcHeroIdentity/);
  assert.match(brandingPreview, /variant="hero" brandTreatment="hero"/);
  assert.match(brandingPreview, /variant="editorial" brandTreatment="compact"/);
});

test('custom team logos remain data-driven and visibly present across every title treatment', () => {
  assert.match(stage, /branding\?\.logoUrl \|\| branding\?\.logoMarkUrl/);
  assert.match(stage, /useCleanTeamLogo\(rawLogo\)/);
  assert.match(stage, /const supportingBrand = resolvedBrandTreatment !== "hero"/);
  assert.match(stage, /className="teamIdentityTitleStage__crest"[\s\S]*src=\{cleanedLogo\}/);
  assert.match(stage, /className="teamIdentityTitleStage__microBrandImage"[\s\S]*src=\{cleanedLogo\}/);
  assert.match(stage, /className="teamIdentityTitleStage__watermarkBrand"[\s\S]*src=\{cleanedLogo\}/);
  assert.doesNotMatch(stage, /titans-exact-logo|titans-default-mark/);
});

test('compact editorial stages preserve typography authority while keeping team identity obvious', () => {
  assert.match(stageCss, /teamIdentityTitleStage--standard[\s\S]*--identity-crest:\s*clamp\(60px,\s*16vw,\s*68px\)/);
  assert.match(stageCss, /teamIdentityTitleStage--standard[\s\S]*--identity-title:\s*clamp\(39px,\s*10\.35vw,\s*44px\)/);
  assert.match(brandCss, /teamIdentityTitleStage__microBrand[\s\S]*width:\s*30px[\s\S]*height:\s*30px/);
  assert.match(brandCss, /@media \(max-width: 760px\)[\s\S]*data-brand-treatment="signature"[\s\S]*padding-top:\s*5px[\s\S]*padding-bottom:\s*6px/);
  assert.match(brandCss, /@media \(max-width: 760px\)[\s\S]*teamIdentityTitleStage__microBrand[\s\S]*width:\s*28px[\s\S]*height:\s*28px/);
  assert.doesNotMatch(brandCss, /teamIdentityTitleStage__microBrand[\s\S]*drop-shadow/);
});

test('Back is a first-class title-stage affordance with accessible semantics and touch target', () => {
  assert.match(stage, /backAction = null/);
  assert.match(stage, /className="teamIdentityTitleStage__back"/);
  assert.match(stage, /aria-label=\{backAction\.ariaLabel \|\| backAction\.label \|\| "Back"\}/);
  assert.match(stageCss, /\.teamIdentityTitleStage__back\s*\{[\s\S]*min-width:\s*44px[\s\S]*min-height:\s*44px/);
  assert.match(secondary, /backAction=null/);
  assert.match(playerWorkspace, /backAction = null/);
});

test('page-level status and actions are integrated into the editorial title composition', () => {
  assert.doesNotMatch(secondary, /TeamIdentitySupportRail/);
  assert.match(secondary, /status=\{status\}/);
  assert.match(secondary, /actions=\{actions\}/);
  assert.doesNotMatch(playerWorkspace, /TeamIdentitySupportRail/);
  assert.match(playerWorkspace, /status=\{model\.status\}/);
  assert.match(playerWorkspace, /actions=\{primaryAction\}/);
});

test('existing 20px meaningful-content rail and bottom safe-area landing remain authoritative', () => {
  assert.match(geometry, /--shotlab-mobile-content-rail:\s*var\(--space-5,\s*20px\)/);
  assert.match(geometry, /padding-inline:\s*var\(--shotlab-mobile-content-rail\)\s*!important/);
  assert.match(geometry, /--shotlab-mobile-content-landing:\s*var\(--space-6,\s*24px\)/);
  assert.match(geometry, /env\(safe-area-inset-bottom,\s*0px\)/);
});

test('page title remains a real level-one heading with discoverable identity metadata', () => {
  assert.match(stage, /<h1 className="teamIdentityTitleStage__title" data-identity-role="page-title">/);
  assert.match(stage, /data-title-word-count=\{titleWords\.length\}/);
  assert.match(stage, /data-title-size=\{titleSize\}/);
  assert.match(stage, /data-brand-treatment=\{resolvedBrandTreatment\}/);
  assert.match(stage, /data-mobile-stage=\{resolvedMobileStage\}/);
});
