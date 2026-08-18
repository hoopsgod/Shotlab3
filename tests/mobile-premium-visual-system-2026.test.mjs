import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const routeRunner = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");
const secondaryPageSystem = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const teamStage = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.jsx", import.meta.url), "utf8");
const teamStageCss = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.css", import.meta.url), "utf8");
const renderedTitleAuthority = fs.readFileSync(new URL("../public/shotlab-team-identity-title-authority.css", import.meta.url), "utf8");
const playerHeader = fs.readFileSync(new URL("../src/components/PlayerDashboardHeader.jsx", import.meta.url), "utf8");
const coachHeader = fs.readFileSync(new URL("../src/components/CoachDashboardHeader.jsx", import.meta.url), "utf8");
const playerOperational = fs.readFileSync(new URL("../src/components/PlayerOperationalWorkspace.jsx", import.meta.url), "utf8");
const playerMetricHierarchyCss = fs.readFileSync(new URL("../src/components/PlayerMetricHierarchy.module.css", import.meta.url), "utf8");
const secondaryCohesionCss = fs.readFileSync(new URL("../public/shotlab-phase3-secondary-cohesion.css", import.meta.url), "utf8");
const mobileNav = fs.readFileSync(new URL("../src/components/MobileNavigation.module.css", import.meta.url), "utf8");
const navArchitecture = fs.readFileSync(new URL("../src/components/MobileNavigationArchitecture.css", import.meta.url), "utf8");
const retiredAuthority = fs.readFileSync(new URL("../src/styles/MobilePremiumVisualSystem2026.css", import.meta.url), "utf8");
const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("premium mobile hierarchy is owner-level instead of a second additive visual authority", () => {
  assert.match(routeRunner, /apply-mobile-premium-secondary-page-system\.mjs/);
  assert.ok(retiredAuthority.length < 160, "retired mobile authority must remain declaration-free");
  assert.doesNotMatch(retiredAuthority, /\{[^}]*:[^}]*\}/);
  assert.match(secondaryPageSystem, /import "\.\/SecondaryPageSystem\.css"/);
  assert.doesNotMatch(secondaryPageSystem, /SecondaryPageFirstViewport\.css/);
  assert.match(teamStage, /import "\.\/TeamIdentityTitleStage\.css"/);
  assert.doesNotMatch(teamStage, /TeamIdentityTitleStageAuthority\.css/);
});

test("retired Coach dashboard authorities cannot override the current production visual system", () => {
  assert.doesNotMatch(indexHtml, /shotlab-v6-decision-workspaces\.css/);
  assert.doesNotMatch(indexHtml, /shotlab-v7-page-authority\.css/);
  assert.doesNotMatch(indexHtml, /shotlab-v9-secondary-polish\.css/);
  assert.match(indexHtml, /shotlab-v11-decision-first\.css/);
  assert.match(indexHtml, /shotlab-phase3-secondary-cohesion\.css/);
});

test("secondary pages use team-owned editorial stages instead of repeated icon-title cards", () => {
  assert.match(secondaryPageSystem, /TeamIdentityTitleStage/);
  assert.match(secondaryPageSystem, /dataPageKind=\{iconName\}/);
  assert.match(secondaryPageSystem, /dataMobileStage="team-identity"/);
  assert.match(teamStage, /data-team-identity-stage="true"/);
  assert.match(teamStageCss, /--identity-crest: clamp\(96px, 25vw, 108px\)/);
  assert.match(teamStageCss, /--identity-title: clamp\(42px, 11vw, 54px\)/);
  assert.match(teamStageCss, /teamIdentityTitleStage__tonalCrest/);
  assert.match(renderedTitleAuthority, /secondaryPageIntro\.teamIdentityTitleStage\[data-team-identity-stage="true"\]/);
  assert.match(renderedTitleAuthority, /grid-template-columns:\s*minmax\(0,1fr\)\s*var\(--identity-crest\)\s*!important/);
});

test("primary decisions are edge-to-edge performance bands rather than floating rounded cards", () => {
  assert.match(enhancer, /Performance band: one edge-to-edge decisive moment, not a floating dashboard card/);
  assert.match(enhancer, /\.secondaryPageDecision \{[\s\S]*margin-inline: calc\(var\(--layout-gutter, 16px\) \* -1\);[\s\S]*border-radius: 0;[\s\S]*box-shadow: none;/);
  assert.match(enhancer, /linear-gradient\(128deg, #071a22 0%, #0a222b 58%, #102e35 100%\)/);
  assert.match(enhancer, /\.secondaryPageDecision__icon \{[\s\S]*position: absolute;[\s\S]*display: grid;/);
  assert.match(enhancer, /\.secondaryPageDecision__visual \{ display: none; \}/);
  assert.match(enhancer, /font-size:\s*clamp\(26px, 7\.3vw, 31px\)/);
  assert.match(enhancer, /background: #c8ff1a;/);
});

test("mobile metrics use a signature hero score band followed by light supporting evidence", () => {
  assert.match(enhancer, /Score strips are allowed to reach the viewport rhythm instead of becoming more cards/);
  assert.match(enhancer, /\.secondaryPageToolbar \[data-visual-role="metric-strip"\] \{[\s\S]*margin-inline: calc\(var\(--layout-gutter, 16px\) \* -1\) !important/);
  assert.match(enhancer, /Supporting evidence reads as a ledger beneath the performance band/);
  assert.match(enhancer, /\.secondaryPageEvidence > \* \{ padding: 14px 0 !important; \}/);
  assert.match(playerMetricHierarchyCss, /\.metricPrimary\{[\s\S]*grid-column:1 \/ -1!important;[\s\S]*linear-gradient\(124deg,#061923 0%,#082430 62%,#0b2d37 100%\)!important;[\s\S]*box-shadow:none!important/);
  assert.match(playerMetricHierarchyCss, /\.metricPrimary \[class\*="metricValue"\]\{[\s\S]*font-size:46px!important/);
  assert.match(playerMetricHierarchyCss, /\.metricSupporting\{[\s\S]*background:transparent!important;[\s\S]*box-shadow:none!important/);
});

test("specialized Player operational headers share the same team identity primitive", () => {
  assert.match(playerOperational, /TeamIdentityTitleStage/);
  for (const marker of [
    '"at-home": "Player"',
    'program: "Program"',
    'events: "Schedule"',
    'strength: "Physical Development"',
    'leaderboards: "Compete"',
    'profile: "Development"',
  ]) assert.ok(playerOperational.includes(marker), `missing ${marker}`);
  assert.match(playerOperational, /variant="standard"/);
  assert.match(playerOperational, /dataMobileStage="team-identity"/);
});

test("Player event and lifting commitment headers retain their editorial action hierarchy", () => {
  assert.match(enhancer, /data-page-hierarchy="editorial"/);
  assert.match(enhancer, /data-layout-role="editorial-header" data-visual-role="page-intro"/);
  assert.match(enhancer, /Premium Level B commitment header/);
  assert.match(enhancer, /font-size:clamp\(38px,9\.4vw,44px\)!important/);
  assert.doesNotMatch(enhancer, /font-size:clamp\(31px,8\.8vw,36px\)!important/);
  assert.match(enhancer, /\.routeHeader>p\{display:none\}/);
});

test("mobile metric feedback cannot pull one item out of its score row", () => {
  assert.match(enhancer, /Premium mobile metrics keep a stable row while feedback remains tonal/);
  assert.match(enhancer, /@media \(max-width: 760px\), \(hover: none\)/);
  assert.match(enhancer, /\.metric:hover,[\s\S]*\.metric:focus-visible \{ transform: none; \}/);
});

test("Coach detail surfaces use the same edge performance language", () => {
  assert.match(enhancer, /\.coachPlayerDetailWorkspace \{ gap: 14px/);
  assert.match(enhancer, /\.coachPlayerProfileHero \{[\s\S]*margin-inline: calc\(var\(--layout-gutter, 16px\) \* -1\);[\s\S]*border-radius: 0;[\s\S]*box-shadow: none;/);
  assert.match(enhancer, /\.coachPlayerProfileHero h2 \{ font-size: 29px/);
  assert.match(enhancer, /\.coachPlayerProfileMetrics \{ grid-template-columns: repeat\(2/);
});

test("persistent Player and Coach identity chrome uses one shared team-owned hero architecture", () => {
  for (const header of [playerHeader, coachHeader]) {
    assert.match(header, /TeamIdentityTitleStage/);
    assert.match(header, /variant="hero"/);
    assert.match(header, /surface="dark"/);
  }
  assert.match(playerHeader, /role="Player"/);
  assert.match(coachHeader, /role="Coach"/);
  assert.match(coachHeader, /Team Branding/);
  assert.match(teamStageCss, /--identity-crest: clamp\(104px, 29vw, 120px\)/);
  assert.match(teamStageCss, /object-fit: contain/);
  assert.match(teamStageCss, /teamIdentityTitleStage__tonalCrest[\s\S]*opacity: \.055/);
  assert.match(teamStageCss, /teamIdentityTitleStage--dark \.teamIdentityTitleStage__tonalCrest \{ opacity: \.085/);
  assert.match(renderedTitleAuthority, /min-height:\s*var\(--identity-crest\)\s*!important/);
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
