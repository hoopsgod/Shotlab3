import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const finalMobileCss = fs.readFileSync(new URL("../public/shotlab-v3-mobile-corrections.css", import.meta.url), "utf8");
const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const routeRunner = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");
const secondaryPageSystem = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const secondaryPageCss = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.css", import.meta.url), "utf8");
const titleStage = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.jsx", import.meta.url), "utf8");
const titleStageCss = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.css", import.meta.url), "utf8");
const brandHierarchyCss = fs.readFileSync(new URL("../src/components/TeamIdentityBrandHierarchy.css", import.meta.url), "utf8");
const playerOperationalWorkspace = fs.readFileSync(new URL("../src/components/PlayerOperationalWorkspace.jsx", import.meta.url), "utf8");
const playerCommitmentCenter = fs.readFileSync(new URL("../src/components/PlayerCommitmentCenter.jsx", import.meta.url), "utf8");
const playerHeader = fs.readFileSync(new URL("../src/components/PlayerDashboardHeader.jsx", import.meta.url), "utf8");
const coachHeader = fs.readFileSync(new URL("../src/components/CoachDashboardHeader.jsx", import.meta.url), "utf8");
const coachCommand = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const coachTitleCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");
const progressStory = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");
const brandingCss = fs.readFileSync(new URL("../src/screens/CoachTeamBrandingScreen.css", import.meta.url), "utf8");
const metricCss = fs.readFileSync(new URL("../src/components/Phase2PremiumMetricLayer.css", import.meta.url), "utf8");
const scheduleDisclosure = fs.readFileSync(new URL("../src/components/SecondaryPageDisclosure.jsx", import.meta.url), "utf8");
const scheduleCss = fs.readFileSync(new URL("../src/components/SecondaryPageDisclosure.module.css", import.meta.url), "utf8");

test("secondary routes use one explicit TeamIdentityTitleStage owner instead of deleted route-stage mutators", () => {
  assert.match(secondaryPageSystem, /TeamIdentityTitleStage/);
  assert.match(secondaryPageSystem, /dataMobileStage="editorial"/);
  assert.match(secondaryPageSystem, /brandTreatment=\{brandTreatment\}/);
  assert.match(secondaryPageSystem, /data-mobile-stage="performance"/);
  assert.doesNotMatch(secondaryPageSystem, /SecondaryPageFirstViewport\.css|secondaryPageIntro appHeader|appHeaderTitle/);
  assert.equal(fs.existsSync(new URL("../src/components/SecondaryPageFirstViewport.css", import.meta.url)), false);
  assert.doesNotMatch(routeRunner, /apply-mobile-centered-route-stage\.mjs|apply-mobile-route-signature-promotion\.mjs/);
  assert.doesNotMatch(enhancer, /writeFileSync/);
});

test("team branding keeps semantic metadata while restoring one full custom crest on every title stage", () => {
  assert.match(titleStage, /useTeamBranding/);
  assert.match(titleStage, /useCleanTeamLogo/);
  assert.match(titleStage, /BRAND_TREATMENTS = new Set\(\["hero", "compact", "signature", "watermark", "none"\]\)/);
  assert.match(titleStage, /data-brand-treatment=\{resolvedBrandTreatment\}/);
  assert.match(titleStage, /const fullCrestBrand =/);
  assert.match(titleStage, /className="teamIdentityTitleStage__crestSlot"/);
  assert.match(titleStage, /className="teamIdentityTitleStage__crest"[\s\S]*src=\{cleanedLogo\}/);
  assert.match(titleStageCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(titleStageCss, /object-fit:\s*contain/);
  assert.match(brandHierarchyCss, /grid-template-columns:\s*minmax\(0, 1fr\) var\(--identity-crest\)/);
  assert.match(brandHierarchyCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(brandHierarchyCss, /@media \(max-width: 390px\)[\s\S]*--identity-crest:\s*84px/);
  assert.match(brandHierarchyCss, /teamIdentityTitleStage__signatureRule/);
  assert.doesNotMatch(brandHierarchyCss, /teamIdentityTitleStage__microBrand|teamIdentityTitleStage__watermarkBrand/);
  assert.match(secondaryPageSystem, /training:"signature"/);
  assert.match(secondaryPageSystem, /calendar:"compact"/);
  assert.match(secondaryPageSystem, /strength:"watermark"/);
  assert.match(secondaryPageSystem, /trophy:"none"/);
  assert.match(playerOperationalWorkspace, /<TeamIdentityTitleStage/);
  assert.match(playerCommitmentCenter, /<TeamIdentityTitleStage/);
  assert.doesNotMatch(playerOperationalWorkspace, /SecondaryTeamBrandMark/);
});

test("mobile secondary title stages keep editorial hierarchy while the enhancer only verifies ownership", () => {
  assert.match(titleStageCss, /--identity-title:\s*clamp\(42px, 10\.2vw, 44px\)/);
  assert.match(titleStageCss, /teamIdentityTitleStage--longTitle\.teamIdentityTitleStage--multiWord[\s\S]*clamp\(38px, 9\.8vw, 44px\)/);
  assert.match(titleStageCss, /teamIdentityTitleStage--longSingleWord[\s\S]*clamp\(36px, 9\.6vw, 40px\)/);
  assert.match(secondaryPageSystem, /TITLE_LABELS=new Map/);
  assert.match(secondaryPageSystem, /\["Drills Dashboard","Drills"\]/);
  assert.match(secondaryPageSystem, /\["Strength & Conditioning Dashboard","S&C"\]/);
  assert.doesNotMatch(secondaryPageCss, /\.secondaryPageIntro\b|\.secondaryPageAction\b/);
  assert.match(enhancer, /Verified source-owned secondary title architecture/);
  assert.doesNotMatch(enhancer, /writeFileSync/);
});

test("primary decision moment remains a full-bleed dark performance stage in owned component CSS", () => {
  assert.match(secondaryPageCss, /\.secondaryPageDecision \{[\s\S]*border-radius: var\(--radius-xl, 24px\)/);
  assert.match(secondaryPageCss, /linear-gradient\(145deg, #171b18, #0c0f0d 72%\)/);
  assert.match(secondaryPageCss, /@media \(max-width: 760px\)[\s\S]*\.secondaryPageDecision \{[\s\S]*grid-template-columns: 40px minmax\(0, 1fr\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision h2 \{[\s\S]*font: 770 clamp\(27px, 5vw, 38px\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision button \{[\s\S]*min-height: var\(--touch-target, 44px\)/);
});

test("first-impression controls and labels respect the product readability floor", () => {
  assert.match(titleStageCss, /teamIdentityTitleStage__action \{[\s\S]*min-height: 44px;[\s\S]*font: 720 13px/);
  assert.match(titleStageCss, /teamIdentityTitleStage__identityLine \{[\s\S]*font: 780 11px/);
  assert.match(titleStageCss, /@media \(max-width: 390px\)[\s\S]*teamIdentityTitleStage__identityLine \{[^}]*font-size:\s*11px;[^}]*\}/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision__eyebrow \{[\s\S]*font: 760 var\(--type-micro, 11px\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision button \{[\s\S]*font: 720 13px/);
  assert.match(titleStage, /showLogoSetupPrompt = isCoachStage && \(!cleanedLogo \|\| logoFailed\)/);
  assert.match(titleStage, /aria-label="Add your custom team logo in Program Branding"/);
});

test("Coach secondary metrics use a readable 2x2 scoreboard rather than a clipped or compressed strip", () => {
  assert.match(metricCss, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(metricCss, /nth-child\(even\)\{border-left:1px solid/);
  assert.match(metricCss, /nth-child\(n\+3\)\{border-top:1px solid/);
  assert.match(metricCss, /font-size:31px!important/);
  assert.match(metricCss, /font-size:11px!important/);
  assert.match(metricCss, /\[data-premium-metric-evidence\]\{display:none!important\}/);
  assert.doesNotMatch(metricCss, /flex-basis:82vw!important/);
});

test("Schedule disclosure is structurally limited to two non-overlapping information lines", () => {
  assert.match(scheduleDisclosure, /data-visual-role="disclosure-title"/);
  assert.match(scheduleDisclosure, /data-visual-role="disclosure-meta"/);
  assert.match(scheduleCss, /min-height:\s*60px/);
  assert.match(scheduleCss, /\.copy \{[\s\S]*display:\s*grid;[\s\S]*gap:\s*4px/);
  assert.match(scheduleCss, /font:\s*760 11px\/1\.15/);
  assert.match(scheduleCss, /font:\s*760 14px\/1\.2/);
  assert.doesNotMatch(scheduleCss, /!important/);
});

test("Player Home is the immersive Hero variant while Coach Home integrates compact identity into Mission Control", () => {
  assert.match(playerHeader, /variant="hero"/);
  assert.match(playerHeader, /surface="dark"/);
  assert.match(playerHeader, /role="Player Mode"/);
  assert.match(coachHeader, /TeamIdentityTitleStage/);
  assert.match(coachCommand, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coachCommand, /mcHeroIdentity/);
  assert.match(coachCommand, /CoachMissionControlTitleStage\.css/);
  assert.doesNotMatch(coachCommand, /MOBILE_PRODUCT_RESET_CSS|<style>/);
  assert.match(coachTitleCss, /--coach-hero-crest:\s*clamp\(104px,\s*27vw,\s*112px\)/);
  assert.match(coachTitleCss, /font-size:\s*clamp\(44px,\s*11\.3vw,\s*48px\)/);
  assert.match(coachTitleCss, /min-height:\s*428px/);
  assert.match(coachTitleCss, /object-fit:\s*contain/);
  assert.match(coachTitleCss, /\.mcHeroContent[\s\S]*width:\s*100%/);
  assert.doesNotMatch(coachTitleCss, /!important/);
  assert.doesNotMatch(playerHeader, /!important|data-mobile-chrome="native-identity"/);
});

test("legacy final-mobile compatibility cannot override title or team-identity composition", () => {
  assert.match(finalMobileCss, /Title and team-identity composition are intentionally excluded/);
  assert.doesNotMatch(finalMobileCss, /\.mcHero h1|\.secondaryPageIntro|player-dashboard-identity-header/);
  assert.doesNotMatch(enhancer, /opacity:\s*\.17|mcHeroTeamMark/);
});

test("Program Branding keeps intentional dark identity contrast against later global surface authorities", () => {
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview\{[^}]*background:linear-gradient\(145deg,#0a2633,#102f39\)!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__panel-header h2\{color:#f8faf6!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__kicker\{color:#c8ff1a!important/);
});

test("Player Progress carries the shared program title before its purposeful command-story surface", () => {
  assert.match(progressStory, /TeamIdentityTitleStage/);
  assert.match(progressStory, /title="Progress"/);
  assert.match(progressStory, /data-page-hierarchy="command-story"/);
  assert.match(progressStory, /data-layout-role="command-story-header"/);
  assert.match(progressStory, /data-testid="player-progress-metrics"/);
});
