import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const tokens = read("../src/theme/appTokens.js");
const foundation = read("../src/styles/visualFoundation2026.js");
const runtime = read("../src/styles/appLegacyStylesRuntime.js");
const auth = read("../src/components/AuthWorkspace.jsx");
const authCss = read("../src/components/AuthWorkspace.module.css");
const appHeader = read("../src/components/AppHeader.jsx");
const appHeaderCss = read("../src/components/AppHeader.module.css");
const mobileNavCss = read("../src/components/MobileNavigation.module.css");
const playerHomeCss = read("../src/components/PlayerDailyCommandCenter.module.css");
const coachHomeCss = read("../src/components/CoachMissionControlFinal.css");

test("Phase 1 establishes a light-first canonical token system", () => {
  assert.match(tokens, /BG_BASE: "#F3F0E8"/);
  assert.match(tokens, /BG_CARD: "#FFFFFF"/);
  assert.match(tokens, /BG_INK: "#0D151B"/);
  assert.match(tokens, /TEXT_PRIMARY: "#121A20"/);
  assert.match(tokens, /RADIUS_SMALL: 12/);
  assert.match(tokens, /RADIUS_MEDIUM: 18/);
  assert.match(tokens, /RADIUS_LARGE: 26/);
  assert.match(tokens, /SHADOW_CARD: "0 12px 34px rgba\(27, 35, 41, 0\.08\)"/);
});

test("the 2026 foundation is appended after legacy CSS and owns the final cascade", () => {
  assert.match(runtime, /import \{ VISUAL_FOUNDATION_2026_CSS \} from "\.\/visualFoundation2026\.js"/);
  assert.match(runtime, /extractStyleTemplate\("_STYLES_CSS"\).*VISUAL_FOUNDATION_2026_CSS/s);
  assert.match(foundation, /--bg-0: #f3f0e8/);
  assert.match(foundation, /--surface-ink: #0d151b/);
  assert.match(foundation, /--radius-sm: 12px/);
  assert.match(foundation, /--radius-md: 18px/);
  assert.match(foundation, /--radius-lg: 26px/);
  assert.match(foundation, /--font-display: -apple-system/);
  assert.doesNotMatch(foundation, /fonts\.googleapis\.com/);
});

test("authentication is a reusable light-first product surface without inline presentation", () => {
  assert.match(auth, /import styles from "\.\/AuthWorkspace\.module\.css"/);
  assert.match(auth, /data-testid="auth-workspace"/);
  assert.match(auth, /Basketball Performance OS/);
  assert.match(auth, /Demo Player/);
  assert.match(auth, /Demo Coach/);
  assert.doesNotMatch(auth, /style=\{\{/);
  assert.match(authCss, /background:[\s\S]*var\(--bg-0, #f3f0e8\)/);
  assert.match(authCss, /background: rgba\(255, 255, 255, \.94\)/);
  assert.match(authCss, /border-radius: 28px/);
});

test("shared page headers use one editorial primitive", () => {
  assert.match(appHeader, /import styles from "\.\/AppHeader\.module\.css"/);
  assert.doesNotMatch(appHeader, /style=\{\{/);
  assert.match(appHeaderCss, /font-family: var\(--font-display/);
  assert.match(appHeaderCss, /letter-spacing: -\.042em/);
  assert.match(appHeaderCss, /border-bottom: 1px solid var\(--stroke-1/);
});

test("mobile navigation is a restrained floating glass dock", () => {
  assert.match(mobileNavCss, /left: max\(12px, env\(safe-area-inset-left/);
  assert.match(mobileNavCss, /border-radius: 24px/);
  assert.match(mobileNavCss, /background: rgba\(255, 255, 255, \.83\)/);
  assert.match(mobileNavCss, /backdrop-filter: blur\(28px\) saturate\(130%\)/);
  assert.doesNotMatch(mobileNavCss, /background: rgba\(7, 10, 12/);
});

test("Player home uses one dark performance hero with light supporting surfaces", () => {
  assert.match(playerHomeCss, /\.hero \{[\s\S]*linear-gradient\(145deg, #15212a/);
  assert.match(playerHomeCss, /\.coachSignal \{[\s\S]*background: var\(--surface-1, #fff\)/);
  assert.match(playerHomeCss, /\.progressCard \{[\s\S]*background: var\(--surface-1, #fff\)/);
  assert.match(playerHomeCss, /\.taskRow \{[\s\S]*background: var\(--surface-1, #fff\)/);
  assert.doesNotMatch(playerHomeCss, /backdrop-filter: blur\(26px\)/);
});

test("Coach home uses one dark decision hero with light operational sections", () => {
  assert.match(coachHomeCss, /--mc-canvas: #f3f0e8/);
  assert.match(coachHomeCss, /\.mcHero \{[\s\S]*linear-gradient\(145deg, var\(--mc-dark-raised\)/);
  assert.match(coachHomeCss, /\.mcSection,[\s\S]*background: var\(--mc-paper\)/);
  assert.match(coachHomeCss, /\.mcAttentionRow \{[\s\S]*background: var\(--mc-paper-soft\)/);
  assert.doesNotMatch(coachHomeCss, /mcFinalArenaPulse/);
  assert.doesNotMatch(coachHomeCss, /repeating-linear-gradient/);
});
