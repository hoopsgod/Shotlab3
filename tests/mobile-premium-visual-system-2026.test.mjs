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
  assert.match(titleStageCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(titleStageCss, /--identity-title:\s*clamp\(42px, 10\.2vw, 44px\)/);
  assert.match(titleStageCss, /clamp\(40px, 9\.8vw, 44px\)/);
  assert.match(titleStageCss, /object-fit:\s*contain/);
  assert.match(brandHierarchyCss, /data-title-stage-family="editorial"/);
  assert.match(brandHierarchyCss, /grid-template-columns:\s*minmax\(0, 1fr\) var\(--identity-crest\)/);
  assert.match(brandHierarchyCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(brandHierarchyCss, /@media \(max-width: 390px\)[\s\S]*--identity-crest:\s*84px/);
  assert.doesNotMatch(brandHierarchyCss, /signatureRule|data-brand-treatment="none"|teamIdentityTitleStage__microBrand|teamIdentityTitleStage__watermarkBrand/);
  assert.doesNotMatch(secondaryPageSystem, /secondaryPageIntro/);
  assert.doesNotMatch(secondaryPageCss, /\.secondaryPageIntro\b/);
});

test("primary decisions are dark performance bands owned by SecondaryPageSystem CSS", () => {
  assert.match(secondaryPageCss, /\.secondaryPageDecision\s*\{[\s\S]*grid-template-columns: 44px minmax\(0, 1fr\) minmax\(180px, 30%\)/);
  assert.match(secondaryPageCss, /linear-gradient\(145deg, #171b18, #0c0f0d 72%\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision__icon\s*\{[\s\S]*display: grid/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision__visual\s*\{[\s\S]*display: block/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision h2\s*\{[\s\S]*font: 770 clamp\(27px, 5vw, 38px\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision button\s*\{[\s\S]*min-height: var\(--touch-target, 44px\)/);
});

test("mobile metrics and supporting evidence use flat ledger geometry rather than card stacking", () => {
  assert.match(secondaryPageCss, /\.secondaryPageToolbar \[data-visual-role="metric-strip"\]\s*\{[\s\S]*border-block: 1px solid/);
  assert.match(secondaryPageCss, /\.secondaryPageToolbar \[data-visual-role="metric-strip"\] > button\s*\{[\s\S]*border-radius: 0 !important;[\s\S]*background: transparent !important/);
  assert.match(secondaryPageCss, /\.secondaryPageEvidence > \*\s*\{[\s\S]*border-radius: 0 !important;[\s\S]*background: transparent !important/);
  assert.match(playerMetricHierarchyCss, /\.metricPrimary\{[\s\S]*grid-column:1 \/ -1!important;[\s\S]*linear-gradient\(124deg,#061923 0%,#082430 62%,#0b2d37 100%\)!important;[\s\S]*box-shadow:none!important/);
  assert.match(playerMetricHierarchyCss, /\.metricPrimary \[class\*="metricValue"\]\{[\s\S]*font-size:46px!important/);
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
  assert.match(secondaryPageCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(secondaryPageCss, /\.secondaryPageDecision button:active:not\(:disabled\) \{ transform: none; \}/);
});

test("Coach detail surfaces retain the same dark performance language below the shared title", () => {
  assert.match(secondaryPageCss, /\.coachPlayerProfileHero\s*\{[\s\S]*linear-gradient\(145deg, #171b18, #0c0f0d 72%\)/);
  assert.match(secondaryPageCss, /\.coachPlayerProfileHero h2\s*\{[\s\S]*font: 780 clamp\(28px, 5vw, 40px\)/);
  assert.match(secondaryPageCss, /\.coachPlayerProfileMetrics\s*\{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(secondaryPageCss, /@media \(max-width: 760px\)[\s\S]*\.coachPlayerProfileMetrics \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
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
  assert.doesNotMatch(coachCommand, /MOBILE_PRODUCT_RESET_CSS|<style>/);
  assert.match(coachTitleCss, /--coach-hero-crest:\s*clamp\(104px,\s*27vw,\s*112px\)/);
  assert.match(coachTitleCss, /font-size:\s*clamp\(44px,\s*11\.3vw,\s*48px\)/);
  assert.match(coachTitleCss, /min-height:\s*420px/);
  assert.match(coachTitleCss, /object-fit:\s*contain/);
  assert.match(coachTitleCss, /\.mcHeroContent[\s\S]*width:\s*100%/);
  assert.doesNotMatch(coachTitleCss, /!important/);
  assert.doesNotMatch(secondaryCohesionCss, /background:rgba\(255,255,255,\.92\)!important/);
});

test("mobile navigation is a ShotLab dark edge rail, safe-area aware, and touch compliant", () => {
  assert.match(mobileNav, /--mobile-tab-bar-height:\s*56px/);
  assert.match(mobileNav, /--bottom-nav-content-padding:\s*82px/);
  assert.match(mobileNav, /left:\s*0;[\s\S]*right:\s*0;[\s\S]*bottom:\s*0;/);
  assert.match(mobileNav, /width:\s*100%/);
  assert.match(mobileNav, /border-radius:\s*0/);
  assert.match(mobileNav, /min-height:\s*48px/);
  assert.match(mobileNav, /background:\s*rgba\(7, 26, 34, \.975\)/);
  assert.match(mobileNav, /dockItem\.active \.dockIcon \{ background: rgba\(200, 255, 26, \.08\); \}/);
  assert.match(navArchitecture, /background:\s*rgba\(7, 26, 34, \.975\) !important/);
  assert.match(navArchitecture, /button\[data-active="true"\] \{[\s\S]*color: #c8ff1a/);
  assert.match(navArchitecture, /transform: translateY\(4px\) scale\(\.995\) !important/);
  assert.match(navArchitecture, /prefers-reduced-transparency/);
  assert.doesNotMatch(navArchitecture, /translateX\(-50%\)/);
});
