import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const routeRunner = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");
const secondaryPageSystem = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");
const playerHeader = fs.readFileSync(new URL("../src/components/PlayerDashboardHeader.jsx", import.meta.url), "utf8");
const coachHeader = fs.readFileSync(new URL("../src/components/CoachDashboardHeader.jsx", import.meta.url), "utf8");
const playerOperationalCss = fs.readFileSync(new URL("../src/components/PlayerOperationalWorkspace.module.css", import.meta.url), "utf8");
const mobileNav = fs.readFileSync(new URL("../src/components/MobileNavigation.module.css", import.meta.url), "utf8");
const navArchitecture = fs.readFileSync(new URL("../src/components/MobileNavigationArchitecture.css", import.meta.url), "utf8");
const retiredAuthority = fs.readFileSync(new URL("../src/styles/MobilePremiumVisualSystem2026.css", import.meta.url), "utf8");

test("premium mobile hierarchy is owner-level instead of a second additive visual authority", () => {
  assert.match(routeRunner, /apply-mobile-premium-secondary-page-system\.mjs/);
  assert.ok(retiredAuthority.length < 160, "retired mobile authority must remain declaration-free");
  assert.doesNotMatch(retiredAuthority, /\{[^}]*:[^}]*\}/);
});

test("secondary pages use route-aware editorial stages instead of repeated icon-title cards", () => {
  assert.match(secondaryPageSystem, /data-page-kind=\{iconName\}/);
  assert.match(secondaryPageSystem, /data-mobile-stage="editorial"/);
  assert.match(secondaryPageSystem, /data-mobile-stage="performance"/);
  assert.match(enhancer, /Editorial stage: route icon becomes quiet geometry instead of another boxed control/);
  assert.match(enhancer, /\.secondaryPageIntro \{[\s\S]*position: relative;[\s\S]*display: block;[\s\S]*min-height: 108px/);
  assert.match(enhancer, /\.secondaryPageIntro__icon \{[\s\S]*position: absolute;[\s\S]*width: 74px;[\s\S]*opacity: \.13/);
  assert.match(enhancer, /font-size:\s*clamp\(34px, 9\.6vw, 40px\) !important/);
  assert.match(enhancer, /\.secondaryPageIntro__summary \{ display: none; \}/);
  assert.match(enhancer, /data-page-kind="calendar"/);
  assert.match(enhancer, /data-page-kind="team"/);
  assert.match(enhancer, /data-page-kind="trophy"/);
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

test("mobile metrics and evidence form full-width score and ledger rhythms", () => {
  assert.match(enhancer, /Score strips are allowed to reach the viewport rhythm instead of becoming more cards/);
  assert.match(enhancer, /\.secondaryPageToolbar \[data-visual-role="metric-strip"\] \{[\s\S]*margin-inline: calc\(var\(--layout-gutter, 16px\) \* -1\) !important/);
  assert.match(enhancer, /Supporting evidence reads as a ledger beneath the performance band/);
  assert.match(enhancer, /\.secondaryPageEvidence > \* \{ padding: 14px 0 !important; \}/);
});

test("specialized Player functional headers follow the same concise Level B discipline", () => {
  assert.match(playerOperationalCss, /@media\(max-width:700px\)/);
  assert.match(playerOperationalCss, /\.commandBar\{grid-template-columns:1fr;gap:12px;padding:4px 0 14px\}/);
  assert.match(playerOperationalCss, /\.title\{font-size:clamp\(29px,8vw,32px\);line-height:1/);
  assert.match(playerOperationalCss, /\.subtitle\{display:none\}/);
  assert.match(playerOperationalCss, /\.primaryAction\{width:100%;min-height:44px;border-radius:12px\}/);
});

test("Player event and lifting commitment headers join the stronger editorial title rhythm", () => {
  assert.match(enhancer, /data-page-hierarchy="editorial"/);
  assert.match(enhancer, /data-layout-role="editorial-header" data-visual-role="page-intro"/);
  assert.match(enhancer, /Premium Level B commitment header/);
  assert.match(enhancer, /font-size:clamp\(31px,8\.8vw,36px\)!important/);
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

test("persistent Player and Coach identity chrome is native-bar compact rather than repeated hero cards", () => {
  assert.match(playerHeader, /data-mobile-chrome="native-identity"/);
  assert.match(playerHeader, /grid-template-columns:36px minmax\(0,1fr\)!important/);
  assert.match(playerHeader, /min-height:50px!important/);
  assert.match(playerHeader, /width:33px!important;height:33px/);
  assert.match(playerHeader, /font-size:17\.5px!important/);
  assert.match(coachHeader, /data-mobile-chrome="native-identity"/);
  assert.match(coachHeader, /grid-template-columns:44px minmax\(0,1fr\)!important/);
  assert.match(coachHeader, /min-height:62px!important/);
  assert.match(coachHeader, /aria-label="Team Branding Settings"/);
});

test("mobile navigation is a quiet native edge tab bar, safe-area aware, and touch compliant", () => {
  assert.match(mobileNav, /--mobile-tab-bar-height:\s*56px/);
  assert.match(mobileNav, /--bottom-nav-content-padding:\s*82px/);
  assert.match(mobileNav, /left:\s*0;[\s\S]*right:\s*0;[\s\S]*bottom:\s*0;/);
  assert.match(mobileNav, /width:\s*100%/);
  assert.match(mobileNav, /border-radius:\s*0/);
  assert.match(mobileNav, /min-height:\s*48px/);
  assert.match(mobileNav, /dockItem\.active \.dockIcon \{ background: rgba\(126, 158, 30, \.10\); \}/);
  assert.match(navArchitecture, /transform: translateY\(4px\) scale\(\.995\) !important/);
  assert.match(navArchitecture, /prefers-reduced-transparency/);
  assert.doesNotMatch(navArchitecture, /translateX\(-50%\)/);
});
