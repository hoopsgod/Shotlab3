import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const routeRunner = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");
const secondaryPageSystem = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const titleStage = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.jsx", import.meta.url), "utf8");
const titleStageCss = fs.readFileSync(new URL("../src/components/TeamIdentityTitleStage.css", import.meta.url), "utf8");
const playerHeader = fs.readFileSync(new URL("../src/components/PlayerDashboardHeader.jsx", import.meta.url), "utf8");
const coachHeader = fs.readFileSync(new URL("../src/components/CoachDashboardHeader.jsx", import.meta.url), "utf8");
const coachCommand = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
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
  assert.doesNotMatch(enhancer, /teamIdentityTitleStage|secondaryPageIntro__title|secondaryPageIntro__icon/);
});

test("retired Coach dashboard authorities cannot override the current production visual system", () => {
  assert.doesNotMatch(indexHtml, /shotlab-v6-decision-workspaces\.css/);
  assert.doesNotMatch(indexHtml, /shotlab-v7-page-authority\.css/);
  assert.doesNotMatch(indexHtml, /shotlab-v9-secondary-polish\.css/);
  assert.match(indexHtml, /shotlab-v11-decision-first\.css/);
  assert.match(indexHtml, /shotlab-phase3-secondary-cohesion\.css/);
});

test("secondary pages use the shared premium team-identity stage with compact standard geometry", () => {
  assert.match(secondaryPageSystem, /dataPageKind=\{iconName\}/);
  assert.match(secondaryPageSystem, /dataMobileStage="team-identity"/);
  assert.match(secondaryPageSystem, /data-mobile-stage="performance"/);
  assert.match(titleStage, /data-team-identity-stage="true"/);
  assert.match(titleStageCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(titleStageCss, /--identity-title:\s*clamp\(42px, 10\.2vw, 44px\)/);
  assert.match(titleStageCss, /object-fit:\s*contain/);
  assert.doesNotMatch(enhancer, /secondaryPageIntro|Drills Dashboard|Leaderboards Dashboard/);
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

test("Player event and lifting routes use the same semantic title primitive", () => {
  assert.match(playerCommitment, /TeamIdentityTitleStage/);
  assert.match(playerCommitment, /variant="standard"/);
  assert.match(playerCommitment, /dataMobileStage="team-identity"/);
  assert.match(playerCommitment, /dataVisualRole="player-team-workspace-title"/);
  assert.doesNotMatch(playerCommitment, /className=\{styles\.routeHeader\}/);
  assert.doesNotMatch(enhancer, /Premium Level B commitment header|routeHeader>p|PlayerCommitmentCenter/);
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

test("Player and Coach Home identity use intentional shared/source-owned variants instead of legacy native chrome", () => {
  assert.match(playerHeader, /TeamIdentityTitleStage/);
  assert.match(playerHeader, /variant="hero"/);
  assert.match(playerHeader, /surface="dark"/);
  assert.match(playerHeader, /role="Player Mode"/);
  assert.doesNotMatch(playerHeader, /data-mobile-chrome="native-identity"|!important/);
  assert.match(coachHeader, /TeamIdentityTitleStage/);
  assert.match(coachCommand, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coachCommand, /--coach-hero-crest:clamp\(108px,30vw,124px\)/);
  assert.match(coachCommand, /font-size:clamp\(46px,12vw,58px\)/);
  assert.match(coachCommand, /object-fit:contain/);
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
