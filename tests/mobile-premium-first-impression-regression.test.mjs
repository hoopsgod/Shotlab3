import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mediaBlock } from "./helpers/css-contract.mjs";

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
const coachShellCss = fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css", import.meta.url), "utf8");
const progressStory = fs.readFileSync(new URL("../src/components/PlayerProgressStory.jsx", import.meta.url), "utf8");
const brandingCss = fs.readFileSync(new URL("../src/screens/CoachTeamBrandingScreen.css", import.meta.url), "utf8");
const metricCss = fs.readFileSync(new URL("../src/components/Phase2PremiumMetricLayer.css", import.meta.url), "utf8");
const scheduleDisclosure = fs.readFileSync(new URL("../src/components/SecondaryPageDisclosure.jsx", import.meta.url), "utf8");
const scheduleCss = fs.readFileSync(new URL("../src/components/SecondaryPageDisclosure.module.css", import.meta.url), "utf8");

test("secondary routes use one explicit TeamIdentityTitleStage owner instead of deleted route-stage mutators", () => {
  assert.match(secondaryPageSystem, /TeamIdentityTitleStage/);
  assert.match(secondaryPageSystem, /variant="standard"/);
  assert.match(secondaryPageSystem, /dataMobileStage="editorial"/);
  assert.match(secondaryPageSystem, /brandTreatment="compact"/);
  assert.match(secondaryPageSystem, /data-mobile-stage="performance"/);
  assert.doesNotMatch(secondaryPageSystem, /BRAND_TREATMENT_BY_ICON|brandTreatmentFor|SecondaryPageFirstViewport\.css|secondaryPageIntro appHeader|appHeaderTitle/);
  assert.equal(fs.existsSync(new URL("../src/components/SecondaryPageFirstViewport.css", import.meta.url)), false);
  assert.doesNotMatch(routeRunner, /apply-mobile-centered-route-stage\.mjs|apply-mobile-route-signature-promotion\.mjs/);
  assert.doesNotMatch(enhancer, /writeFileSync/);
});

test("team branding keeps semantic metadata while restoring one full but subordinate custom crest on editorial stages", () => {
  assert.match(titleStage, /useTeamBranding/);
  assert.match(titleStage, /useCleanTeamLogo/);
  assert.match(titleStage, /BRAND_TREATMENTS = new Set\(\["hero", "compact"\]\)/);
  assert.match(titleStage, /fallbackBrandTreatment = titleFamily === "identity" \? "hero" : "compact"/);
  assert.doesNotMatch(titleStage, /AUTO_BRAND_TREATMENT_BY_PAGE_KIND|signature|watermark|brandTreatment="none"/);
  assert.match(titleStage, /data-brand-treatment=\{resolvedBrandTreatment\}/);
  assert.match(titleStage, /const fullCrestBrand =/);
  assert.match(titleStage, /className="teamIdentityTitleStage__crestSlot"/);
  assert.match(titleStage, /className="teamIdentityTitleStage__crest"[\s\S]*src=\{cleanedLogo\}/);
  assert.match(titleStageCss, /--identity-crest:\s*clamp\(96px,\s*25vw,\s*108px\)/);
  assert.match(titleStageCss, /object-fit:\s*contain/);
  assert.match(brandHierarchyCss, /data-title-stage-family="editorial"/);
  assert.match(brandHierarchyCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+var\(--identity-crest\)/);
  assert.match(brandHierarchyCss, /@media\s*\(max-width:\s*760px\)[\s\S]*--identity-crest:\s*clamp\(64px,\s*17vw,\s*74px\)/);
  assert.match(brandHierarchyCss, /@media\s*\(max-width:\s*390px\)[\s\S]*--identity-crest:\s*64px/);
  assert.doesNotMatch(brandHierarchyCss, /teamIdentityTitleStage__signatureRule|teamIdentityTitleStage__microBrand|teamIdentityTitleStage__watermarkBrand|data-brand-treatment="none"/);
  assert.match(secondaryPageSystem, /brandTreatment="compact"/);
  assert.match(playerOperationalWorkspace, /<TeamIdentityTitleStage/);
  assert.match(playerOperationalWorkspace, /brandTreatment="compact"/);
  assert.doesNotMatch(playerOperationalWorkspace, /PLAYER_BRAND_TREATMENT|resolveWorkspaceBrandTreatment|signature|watermark|brandTreatment="none"|SecondaryTeamBrandMark/);
  assert.match(playerCommitmentCenter, /<TeamIdentityTitleStage/);
});

test("mobile secondary title stages keep editorial hierarchy while the enhancer only verifies ownership", () => {
  assert.match(titleStageCss, /--identity-title:\s*clamp\(42px,\s*10\.2vw,\s*44px\)/);
  assert.match(titleStageCss, /teamIdentityTitleStage--longTitle\.teamIdentityTitleStage--multiWord[\s\S]*clamp\(40px,\s*9\.8vw,\s*44px\)/);
  assert.match(titleStageCss, /teamIdentityTitleStage--longSingleWord[\s\S]*clamp\(38px,\s*9\.6vw,\s*40px\)/);
  assert.match(brandHierarchyCss, /\.teamIdentityTitleStage--standard\s*\{[\s\S]*--identity-crest:\s*clamp\(64px,\s*17vw,\s*74px\)/);
  assert.match(secondaryPageSystem, /TITLE_LABELS=new Map/);
  assert.match(secondaryPageSystem, /\["Drills Dashboard","Drills"\]/);
  assert.match(secondaryPageSystem, /\["Strength & Conditioning Dashboard","S&C"\]/);
  assert.doesNotMatch(secondaryPageCss, /\.secondaryPageIntro\b|\.secondaryPageAction\b/);
  assert.match(enhancer, /Verified source-owned secondary title architecture/);
  assert.doesNotMatch(enhancer, /writeFileSync/);
});

test("primary decision moment remains a full-bleed dark performance stage in owned component CSS", () => {
  assert.match(secondaryPageCss, /\.secondaryPageDecision\s*\{[\s\S]*border-radius:\s*var\(--radius-xl,\s*24px\)/);
  assert.match(secondaryPageCss, /linear-gradient\(145deg,\s*var\(--team-brand-surface-elevated,\s*#171b18\),\s*var\(--team-brand-surface-deep,\s*#0c0f0d\)\s*72%\)/);
  assert.match(secondaryPageCss, /@media\s*\(max-width:\s*760px\)[\s\S]*\.secondaryPageDecision\s*\{[\s\S]*grid-template-columns:\s*40px\s+minmax\(0,\s*1fr\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision h2\s*\{[\s\S]*font:\s*770\s+clamp\(27px,\s*5vw,\s*38px\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision button\s*\{[\s\S]*min-height:\s*var\(--touch-target,\s*44px\)/);
});

test("first-impression controls and labels respect the product readability floor", () => {
  assert.match(titleStageCss, /teamIdentityTitleStage__action\s*\{[\s\S]*min-height:\s*44px;[\s\S]*font:\s*720\s+13px/);
  assert.match(titleStageCss, /teamIdentityTitleStage__identityLine\s*\{[\s\S]*font:\s*780\s+11px/);
  assert.match(titleStageCss, /@media\s*\(max-width:\s*390px\)[\s\S]*teamIdentityTitleStage__identityLine\s*\{[^}]*font-size:\s*11px;[^}]*\}/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision__eyebrow\s*\{[\s\S]*font:\s*760\s+var\(--type-micro,\s*11px\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision button\s*\{[\s\S]*font:\s*720\s+13px/);
  assert.match(titleStage, /showLogoSetupAction = isCoachStage && \(!cleanedLogo \|\| logoFailed\)/);
  assert.match(titleStage, /aria-label=\{`Add a logo for \$\{teamName\} in Program Branding`\}/);
  assert.match(titleStage, /teamIdentityTitleStage__fallbackAction/);
  assert.match(brandHierarchyCss, /teamIdentityTitleStage__fallbackAction[\s\S]*min-width:\s*44px/);
  assert.doesNotMatch(titleStage, /Click here to add your custom team logo/);
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
  assert.match(scheduleCss, /\.copy\s*\{[\s\S]*display:\s*grid;[\s\S]*gap:\s*4px/);
  assert.match(scheduleCss, /font:\s*760\s+11px\/1\.15/);
  assert.match(scheduleCss, /font:\s*760\s+14px\/1\.2/);
  assert.doesNotMatch(scheduleCss, /!important/);
});

test("Player Home remains immersive while Coach Home uses one verified brand-first mobile hierarchy", () => {
  assert.match(playerHeader, /variant="hero"/);
  assert.match(playerHeader, /surface="dark"/);
  assert.match(playerHeader, /role="Player Mode"/);
  assert.match(coachHeader, /TeamIdentityTitleStage/);
  assert.match(coachCommand, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coachCommand, /mcHeroIdentity/);
  assert.match(coachCommand, /is-mobile-shell/);
  assert.match(coachCommand, /CoachMissionControlTitleStage\.css/);
  assert.match(coachCommand, /CoachMissionControlShell\.css/);
  assert.doesNotMatch(coachCommand, /MOBILE_PRODUCT_RESET_CSS|<style>/);

  const tablet = mediaBlock(coachTitleCss, "(min-width:701px) and (max-width:980px)");
  assert.match(tablet, /min-height:354px/);
  assert.match(tablet, /clamp\(36px,5\.5vw,49px\)\/\.88 "Barlow Condensed"/);
  assert.match(tablet, /clamp\(112px,17vw,142px\)/);

  assert.match(coachShellCss, /@media\(max-width:700px\)/);
  assert.match(coachShellCss, /\.mcHeader\[data-testid="mission-control-team-header"\]\{display:none!important\}/);
  assert.match(coachShellCss, /\.mcHero\[data-team-identity-stage="coach-mission-control"\]\{min-height:334px!important\}/);
  assert.match(coachShellCss, /--coach-hero-crest:clamp\(80px,21vw,92px\)!important/);
  assert.match(coachShellCss, /\.mcProgramIdentity\{font:780 11px\/1\.2/);
  assert.match(coachShellCss, /h1\{[^}]*clamp\(40px,10\.2vw,44px\)[^}]*"Barlow Condensed"/);
  assert.match(coachShellCss, /\.mcHeroContent>p\{[^}]*font:520 14px\/1\.42/);
  assert.match(coachTitleCss, /object-fit:contain/);
  assert.match(coachTitleCss, /\.mcHeroContent[\s\S]*width:100%/);
  assert.doesNotMatch(playerHeader, /!important|data-mobile-chrome="native-identity"/);
});

test("legacy final-mobile compatibility cannot override title or team-identity composition", () => {
  assert.doesNotMatch(finalMobileCss, /\.mcHero h1|\.secondaryPageIntro|player-dashboard-identity-header/);
  assert.doesNotMatch(enhancer, /opacity:\s*\.17|mcHeroTeamMark/);
});

test("Program Branding keeps intentional brand-derived identity contrast against later global surface authorities", () => {
  assert.match(brandingCss, /\.branding-industrial__preview\{[^}]*background:linear-gradient\(145deg,var\(--team-brand-surface-deep,#0a2633\),var\(--team-brand-surface-elevated,#102f39\)\)!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__panel-header h2\{color:#f8faf6!important/);
  assert.match(brandingCss, /\.branding-industrial \.branding-industrial__preview \.branding-industrial__kicker\{color:var\(--team-brand-primary,#c8ff1a\)!important/);
});

test("Player Progress carries the shared program title before its purposeful command-story surface", () => {
  assert.match(progressStory, /TeamIdentityTitleStage/);
  assert.match(progressStory, /title="Progress"/);
  assert.match(progressStory, /data-page-hierarchy="command-story"/);
  assert.match(progressStory, /data-layout-role="command-story-header"/);
  assert.match(progressStory, /data-testid="player-progress-metrics"/);
});
