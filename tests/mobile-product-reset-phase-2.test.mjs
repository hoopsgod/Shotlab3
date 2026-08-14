import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const auth = read("../src/components/AuthWorkspace.jsx");
const coach = read("../src/components/CoachCommandCenter.jsx");
const playerHeader = read("../src/components/PlayerDashboardHeader.jsx");
const playerCommand = read("../src/components/PlayerDailyCommandCenter.jsx");
const playerCommandCss = read("../src/components/PlayerDailyCommandCenter.module.css");
const mobileNavigationCss = read("../src/components/MobileNavigation.module.css");
const mobileNavigationAuthority = read("../src/components/MobileNavigationArchitecture.css");

test("Phase 2 identifies every mobile first-viewport surface without removing Phase 1", () => {
  for (const source of [coach, playerHeader, playerCommand]) {
    assert.match(source, /data-mobile-product-reset="phase-1"/);
    assert.match(source, /data-mobile-visual-system="phase-2"/);
  }
  assert.match(auth, /data-mobile-visual-system="phase-2"/);
});

test("Phase 2 gives authentication a cinematic dark-to-light entry composition", () => {
  assert.match(auth, /linear-gradient\(180deg,#071820 0,#0B2633 304px,#F3F1EA 304px/);
  assert.match(auth, /borderRadius:"30px 30px 30px 12px"/);
  assert.match(auth, /color:"#C8FF1A"/);
  assert.match(auth, /backdropFilter:"blur\(24px\) saturate\(135%\)"/);
});

test("Coach mobile chrome and command hero use the Phase 2 premium field system", () => {
  assert.match(coach, /@media\(max-width:700px\)/);
  assert.match(coach, /border-radius:30px 30px 30px 12px!important/);
  assert.match(coach, /linear-gradient\(145deg,#0b2a38 0,#071820 74%\)/);
  assert.match(coach, /background:linear-gradient\(135deg,#c8ff1a,#aee800\)!important/);
  assert.match(coach, /prefers-reduced-transparency:reduce/);
});

test("Player identity, decision field, evidence, and coach handoff share one visual language", () => {
  assert.match(playerHeader, /border-radius:24px 24px 24px 10px!important/);
  assert.match(playerHeader, /backdrop-filter:blur\(22px\) saturate\(135%\)!important/);
  assert.match(playerCommandCss, /border-radius: 28px 28px 28px 10px/);
  assert.match(playerCommandCss, /border-radius: 20px 20px 20px 8px/);
  assert.match(playerCommandCss, /border-radius: 22px 22px 22px 8px/);
  assert.match(playerCommandCss, /font-size: 15px/);
});

test("The mobile dock becomes a high-contrast performance control surface", () => {
  assert.match(mobileNavigationCss, /background: rgba\(7, 24, 32, \.91\)/);
  assert.match(mobileNavigationCss, /border-radius: 25px 25px 25px 10px/);
  assert.match(mobileNavigationCss, /rgba\(200, 255, 26, \.10\)/);
  assert.match(mobileNavigationAuthority, /background: rgba\(7, 24, 32, \.91\) !important/);
  assert.match(mobileNavigationAuthority, /color: #c8ff1a !important/);
  assert.match(mobileNavigationAuthority, /backdrop-filter: blur\(30px\) saturate\(145%\) !important/);
});

test("Phase 2 stays presentation-only", () => {
  for (const source of [playerHeader, playerCommandCss, mobileNavigationCss, mobileNavigationAuthority]) {
    assert.doesNotMatch(source, /supabase|localStorage|sessionStorage|fetch\(/i);
  }
});
