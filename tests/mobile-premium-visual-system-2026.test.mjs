import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const routeRunner = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");
const secondaryPageSystem = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const secondaryPageCss = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.css", import.meta.url), "utf8");
const titleStage = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.jsx", import.meta.url), "utf8");
const titleStageCss = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.css", import.meta.url), "utf8");
const brandHierarchyCss = fs.readFileSync(new URL("../src/components/TeamIdentityBrandHierarchy.css", import.meta.url), "utf8");
const playerHeader = fs.readFileSync(new URL("../src/components/PlayerDashboardHeader.jsx", import.meta.url), "utf8");
const coachHeader = fs.readFileSync(new URL("../src/components/CoachDashboardHeader.jsx", import.meta.url), "utf8");
const coachCommand = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const coachTitleCss = fs.readFileSync(new URL("../src/components/CoachMissionControlTitleStage.css", import.meta.url), "utf8");
const coachShellCss = fs.readFileSync(new URL("../src/components/CoachMissionControlShell.css", import.meta.url), "utf8");
const playerCommitment = fs.readFileSync(new URL("../src/components/PlayerCommitmentCenter.jsx", import.meta.url), "utf8");
const playerMetricHierarchyCss = fs.readFileSync(new URL("../src/components/PlayerMetricHierarchy.module.css", import.meta.url), "utf8");
const secondaryCohesionCss = fs.readFileSync(new URL("../public/shotlab-phase3-secondary-cohesion.css", import.meta.url), "utf8");
const mobileNav = fs.readFileSync(new URL("../src/components/MobileNavigation.module.css", import.meta.url), "utf8");
const navArchitecture = fs.readFileSync(new URL("../src/components/MobileNavigationArchitecture.css", import.meta.url), "utf8");
const retiredAuthority = fs.readFileSync(new URL("../src/styles/MobilePremiumVisualSystem2026.css", import.meta.url), "utf8");
const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("premium mobile hierarchy is source-owned instead of a second additive title authority", () => {
  assert.match(routeRunner, /apply-mobile-premium-secondary-page-system\.mjs/);
  assert.ok(retiredAuthority.length < 160, "retired mobile authority must remain declaration-free");
  assert.doesNotMatch(retiredAuthority, /\{[^}]*:[^}]*\}/);
  assert.match(secondaryPageSystem, /TeamIdentityTitleStage/);
  assert.doesNotMatch(secondaryPageSystem, /SecondaryPageFirstViewport\.css|secondaryPageIntro appHeader|appHeaderTitle/);
  assert.match(enhancer, /Verified source-owned secondary title architecture/);
  assert.doesNotMatch(enhancer, /writeFileSync/);
});

test("retired Coach dashboard authorities cannot override the current production visual system", () => {
  assert.doesNotMatch(indexHtml, /shotlab-v6-decision-workspaces\.css/);
  assert.doesNotMatch(indexHtml, /shotlab-v7-page-authority\.css/);
  assert.doesNotMatch(indexHtml, /shotlab-v9-secondary-polish\.css/);
  assert.match(indexHtml, /shotlab-v11-decision-first\.css/);
  assert.match(indexHtml, /shotlab-phase3-secondary-cohesion\.css/);
});

test("secondary pages use one editorial title treatment while retaining the full custom crest column", () => {
  assert.match(secondaryPageSystem, /dataPageKind=\{iconName\}/);
  assert.match(secondaryPageSystem, /dataMobileStage="editorial"/);
  assert.match(secondaryPageSystem, /variant="standard"/);
  assert.match(secondaryPageSystem, /brandTreatment="compact"/);
  assert.doesNotMatch(secondaryPageSystem, /BRAND_TREATMENT_BY_ICON|brandTreatmentFor|signature|watermark|brandTreatment="none"/);
  assert.match(secondaryPageSystem, /data-mobile-stage="performance"/);
  assert.match(titleStage, /data-team-identity-stage="true"/);
  assert.match(titleStage, /BRAND_TREATMENTS = new Set\(\["hero", "compact"\]\)/);
  assert.match(titleStage, /fallbackBrandTreatment = titleFamily === "identity" \? "hero" : "compact"/);
  assert.match(titleStage, /data-brand-treatment=\{resolvedBrandTreatment\}/);
  assert.match(titleStage, /const fullCrestBrand =/);
  assert.match(titleStage, /className="teamIdentityTitleStage__crestSlot"/);
  assert.match(titleStageCss, /--identity-crest:\s*clamp\(96px,\s*25vw,\s*108px\)/);
  assert.match(titleStageCss, /--identity-title:\s*clamp\(42px,\s*10\.2vw,\s*44px\)/);
  assert.match(titleStageCss, /clamp\(40px,\s*9\.8vw,\s*44px\)/);
  assert.match(titleStageCss, /object-fit:\s*contain/);
  assert.match(brandHierarchyCss, /data-title-stage-family="editorial"/);
  assert.match(brandHierarchyCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+var\(--identity-crest\)/);
  assert.match(brandHierarchyCss, /@media\s*\(max-width:\s*760px\)[\s\S]*--identity-crest:\s*clamp\(64px,\s*17vw,\s*74px\)/);
  assert.match(brandHierarchyCss, /@media\s*\(max-width:\s*390px\)[\s\S]*--identity-crest:\s*64px/);
  assert.doesNotMatch(brandHierarchyCss, /signatureRule|data-brand-treatment="none"|teamIdentityTitleStage__microBrand|teamIdentityTitleStage__watermarkBrand/);
  assert.doesNotMatch(secondaryPageSystem, /secondaryPageIntro/);
  assert.doesNotMatch(secondaryPageCss, /\.secondaryPageIntro\b/);
});

test("primary decisions are dark performance bands owned by SecondaryPageSystem CSS", () => {
  assert.match(secondaryPageCss, /\.secondaryPageDecision\s*\{[\s\S]*grid-template-columns:\s*44px\s+minmax\(0,\s*1fr\)\s+minmax\(180px,\s*30%\)/);
  assert.match(secondaryPageCss, /linear-gradient\(145deg,\s*var\(--team-brand-surface-elevated,\s*#171b18\),\s*var\(--team-brand-surface-deep,\s*#0c0f0d\)\s*72%\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision__icon\s*\{[\s\S]*display:\s*grid/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision__visual\s*\{[\s\S]*display:\s*block/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision h2\s*\{[\s\S]*font:\s*770\s+clamp\(27px,\s*5vw,\s*38px\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision button\s*\{[\s\S]*min-height:\s*var\(--touch-target,\s*44px\)/);
});

test("mobile metrics and supporting evidence use flat ledger geometry rather than card stacking", () => {
  assert.match(secondaryPageCss, /\.secondaryPageToolbar \[data-visual-role="metric-strip"\]\s*\{[\s\S]*border-block:\s*1px\s+solid/);
  assert.match(secondaryPageCss, /\.secondaryPageToolbar \[data-visual-role="metric-strip"\]\s*>\s*button\s*\{[\s\S]*border-radius:\s*0\s*!important;[\s\S]*background:\s*transparent\s*!important/);
  assert.match(secondaryPageCss, /\.secondaryPageEvidence\s*>\s*\*\s*\{[\s\S]*border-radius:\s*0\s*!important;[\s\S]*background:\s*transparent\s*!important/);
  assert.match(playerMetricHierarchyCss, /\.metricPrimary\{[\s\S]*grid-column:1 \/ -1!important;[\s\S]*linear-gradient\(124deg,var\(--team-brand-surface-elevated,#0b2633\) 0%,var\(--team-brand-surface,#0a202b\) 62%,var\(--team-brand-surface-deep,#071820\) 100%\)!important;[\s\S]*box-shadow:none!important/);
  assert.match(playerMetricHierarchyCss, /\.metricPrimary>span:nth-child\(2\)\{[\s\S]*font-size:46px!important/);
  assert.match(playerMetricHierarchyCss, /\.metricSupporting\{[\s\S]*background:transparent!important;[\s\S]*box-shadow:none!important/);
});

test("Player event and lifting routes use the same semantic title primitive", () => {
  assert.match(playerCommitment, /TeamIdentityTitleStage/);
  assert.match(playerCommitment, /variant="standard"/);
  assert.match(playerCommitment, /dataMobileStage="team-identity"/);
  assert.match(playerCommitment, /dataVisualRole="player-team-workspace-title"/);
  assert.doesNotMatch(playerCommitment, /className=\{styles\.routeHeader\}/);
  assert.match(enhancer, /Verified source-owned secondary title architecture/);
  assert.doesNotMatch(enhancer, /writeFileSync/);
});

test("mobile metric interactions stay stable and reduced-motion safe", () => {
  assert.match(secondaryPageCss, /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision button:active:not\(:disabled\)\s*\{\s*transform:\s*none;?\s*\}/);
});

test("Coach detail surfaces retain the same brand-driven dark performance language below the shared title", () => {
  assert.match(secondaryPageCss, /\.coachPlayerProfileHero\s*\{[\s\S]*linear-gradient\(145deg,\s*var\(--team-brand-surface-elevated/);
  assert.match(secondaryPageCss, /\.coachPlayerProfileHero h2\s*\{[\s\S]*font:\s*780\s+clamp\(28px,\s*5vw,\s*40px\)/);
  assert.match(secondaryPageCss, /\.coachPlayerProfileMetrics\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(secondaryPageCss, /@media\s*\(max-width:\s*760px\)[\s\S]*\.coachPlayerProfileMetrics\s*\{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});

test("Player and Coach Home identity use intentional shared/source-owned variants instead of legacy native chrome", () => {
  assert.match(playerHeader, /TeamIdentityTitleStage/);
  assert.match(playerHeader, /variant="hero"/);
  assert.match(playerHeader, /surface="dark"/);
  assert.match(playerHeader, /role="Player Mode"/);
  assert.doesNotMatch(playerHeader, /data-mobile-chrome="native-identity"|!important/);
  assert.match(coachHeader, /TeamIdentityTitleStage/);
  assert.match(coachCommand, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coachCommand, /CoachMissionControlTitleStage\.css/);
  assert.match(coachCommand, /CoachMissionControlShell\.css/);
  assert.doesNotMatch(coachCommand, /MOBILE_PRODUCT_RESET_CSS|<style>/);
  assert.match(coachShellCss, /--coach-hero-crest:clamp\(80px,21vw,92px\)!important/);
  assert.match(coachShellCss, /\.mcProgramIdentity\{font:780 11px\/1\.2 var\(--mc-native/);
  assert.match(coachShellCss, /\sh1\{[^}]*clamp\(40px,10\.2vw,44px\)[^}]*"Barlow Condensed"/);
  assert.match(coachShellCss, /min-height:334px!important/);
  assert.match(coachTitleCss, /object-fit:\s*contain/);
  assert.match(coachTitleCss, /\.mcHeroContent[\s\S]*width:\s*100%/);
  assert.doesNotMatch(secondaryCohesionCss, /background:rgba\(255,255,255,\.92\)!important/);
});

test("mobile navigation is a ShotLab dark edge rail, safe-area aware, and touch compliant", () => {
  assert.match(mobileNav, /--mobile-tab-bar-height:\s*56px/);
  assert.match(mobileNav, /--bottom-nav-content-padding:\s*82px/);
  assert.match(mobileNav, /left:\s*0;[\s\S]*right:\s*0;[\s\S]*bottom:\s*0;/);
  assert.match(mobileNav, /width:\s*100%/);
  assert.match(mobileNav, /border-radius:\s*0/);
  assert.match(mobileNav, /min-height:\s*48px/);
  assert.match(mobileNav, /background:\s*color-mix\(in srgb, var\(--team-brand-surface-deep/);
  assert.match(mobileNav, /dockItem\.active \.dockIcon \{ background: color-mix\(in srgb, var\(--team-brand-primary/);
  assert.match(navArchitecture, /background:\s*color-mix\(in srgb, var\(--team-brand-surface-deep[\s\S]*!important/);
  assert.match(navArchitecture, /button\[data-active="true"\] \{[\s\S]*color: var\(--team-brand-nav-active/);
  assert.match(navArchitecture, /transform: translateY\(4px\) scale\(\.995\) !important/);
  assert.match(navArchitecture, /prefers-reduced-transparency/);
  assert.doesNotMatch(navArchitecture, /translateX\(-50%\)/);
});
