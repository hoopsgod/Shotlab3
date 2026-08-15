import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const enhancer = fs.readFileSync(new URL("../scripts/apply-mobile-premium-secondary-page-system.mjs", import.meta.url), "utf8");
const routeRunner = fs.readFileSync(new URL("../scripts/run-route-enhancers.mjs", import.meta.url), "utf8");
const playerHeader = fs.readFileSync(new URL("../src/components/PlayerDashboardHeader.jsx", import.meta.url), "utf8");
const playerOperationalCss = fs.readFileSync(new URL("../src/components/PlayerOperationalWorkspace.module.css", import.meta.url), "utf8");
const mobileNav = fs.readFileSync(new URL("../src/components/MobileNavigation.module.css", import.meta.url), "utf8");
const retiredAuthority = fs.readFileSync(new URL("../src/styles/MobilePremiumVisualSystem2026.css", import.meta.url), "utf8");

test("premium mobile hierarchy is owner-level instead of a second additive visual authority", () => {
  assert.match(routeRunner, /apply-mobile-premium-secondary-page-system\.mjs/);
  assert.ok(retiredAuthority.length < 160, "retired mobile authority must remain declaration-free");
  assert.doesNotMatch(retiredAuthority, /\{[^}]*:[^}]*\}/);
});

test("major functional page intros are compact instead of oversized title stages", () => {
  assert.match(enhancer, /grid-template-columns:\s*34px minmax\(0, 1fr\)/);
  assert.match(enhancer, /\.performance-shell \.secondaryPageIntro \.secondaryPageIntro__title/);
  assert.match(enhancer, /font-size:\s*clamp\(29px, 8vw, 34px\) !important/);
  assert.match(enhancer, /padding:\s*3px 0 12px/);
  assert.match(enhancer, /\.secondaryPageIntro__summary \{ display: none; \}/);
  assert.match(enhancer, /\.secondaryPageDecision/);
  assert.match(enhancer, /min-height:\s*0/);
  assert.match(enhancer, /\.secondaryPageDecision::after,[\s\S]*\.secondaryPageDecision__icon,[\s\S]*\.secondaryPageDecision__visual \{ display: none; \}/);
  assert.match(enhancer, /font-size:\s*clamp\(23px, 6\.4vw, 27px\)/);
  assert.match(enhancer, /@media \(max-width: 390px\)/);
  assert.match(enhancer, /font-size: 30px !important/);
  assert.match(enhancer, /\['title="Drills Dashboard"', 'title="Drills"'\]/);
  assert.match(enhancer, /\['title="Strength & Conditioning Dashboard"', 'title="S&C"'\]/);
  assert.match(enhancer, /\['title="Activity Dashboard"', 'title="Activity"'\]/);
  assert.match(enhancer, /\['title="Leaderboards Dashboard"', 'title="Leaderboards"'\]/);
});

test("specialized Player functional headers follow the same compact Level B discipline", () => {
  assert.match(playerOperationalCss, /@media\(max-width:700px\)/);
  assert.match(playerOperationalCss, /\.commandBar\{grid-template-columns:1fr;gap:12px;padding:4px 0 14px\}/);
  assert.match(playerOperationalCss, /\.title\{font-size:clamp\(29px,8vw,32px\);line-height:1/);
  assert.match(playerOperationalCss, /\.subtitle\{display:none\}/);
  assert.match(playerOperationalCss, /\.primaryAction\{width:100%;min-height:44px;border-radius:12px\}/);
  assert.match(playerOperationalCss, /\.metric\{min-height:88px;padding:13px 14px\}/);
});

test("Player event and lifting commitment headers join the shared Level B semantics", () => {
  assert.match(enhancer, /data-page-hierarchy="editorial"/);
  assert.match(enhancer, /data-layout-role="editorial-header" data-visual-role="page-intro"/);
  assert.match(enhancer, /Premium Level B commitment header/);
  assert.match(enhancer, /\.routeTitleRow h1 \{ font-size: clamp\(29px, 8vw, 32px\) !important/);
  assert.match(enhancer, /\.routeHeader > p \{ display: none; \}/);
  assert.match(enhancer, /\.routeTitleRow > span \{ min-height: 18px; margin: 0; padding: 0; border: 0/);
});

test("mobile metric feedback cannot pull one card out of its visual row", () => {
  assert.match(enhancer, /Premium mobile metrics keep a stable row while feedback remains tonal/);
  assert.match(enhancer, /@media \(max-width: 760px\), \(hover: none\)/);
  assert.match(enhancer, /\.metric:hover,[\s\S]*\.metric:focus-visible \{ transform: none; \}/);
});

test("Coach detail screens start useful content sooner without losing performance hierarchy", () => {
  assert.match(enhancer, /\.coachPlayerDetailWorkspace \{ gap: 16px/);
  assert.match(enhancer, /\.coachPlayerProfileHero \{ grid-template-columns: 1fr; gap: 12px; padding: 18px/);
  assert.match(enhancer, /\.coachPlayerProfileHero h2 \{ font-size: 27px/);
  assert.match(enhancer, /\.coachPlayerProfileMetrics \{ grid-template-columns: repeat\(2/);
});

test("persistent Player identity is compact rather than a repeated route hero", () => {
  assert.match(playerHeader, /min-height:62px/);
  assert.match(playerHeader, /grid-template-columns:46px minmax\(0,1fr\)/);
  assert.match(playerHeader, /width:44px!important;height:44px/);
  assert.match(playerHeader, /font-size:20px!important/);
  assert.match(playerHeader, /text-overflow:ellipsis/);
});

test("mobile navigation is quiet, safe-area aware, and touch-target compliant", () => {
  assert.match(mobileNav, /--mobile-tab-bar-height:\s*60px/);
  assert.match(mobileNav, /bottom:\s*max\(6px, env\(safe-area-inset-bottom/);
  assert.match(mobileNav, /width:\s*min\(430px/);
  assert.match(mobileNav, /min-height:\s*50px/);
  assert.match(mobileNav, /background:\s*rgba\(126, 158, 30, \.08\)/);
  assert.match(mobileNav, /prefers-reduced-motion:\s*reduce/);
  assert.match(mobileNav, /prefers-reduced-transparency:\s*reduce/);
});
