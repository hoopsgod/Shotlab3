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

test("Phase 2 identifies every mobile first-viewport surface without removing Phase 1", () => {
  for (const source of [coach, playerHeader, playerCommand]) {
    assert.match(source, /data-mobile-product-reset="phase-1"/);
    assert.match(source, /data-mobile-visual-system="phase-2"/);
  }
  assert.match(auth, /data-mobile-visual-system="phase-2"/);
});

test("corrective Phase 2 changes first-viewport composition instead of only restyling cards", () => {
  assert.match(auth, /data-phase2-composition="cinematic-auth-stage"/);
  assert.match(coach, /data-phase2-composition="integrated-command-deck"/);
  assert.match(coach, /className="mcDecisionIndex"/);
  assert.match(playerHeader, /data-phase2-composition="performance-passport"/);
  assert.match(playerCommand, /data-phase2-composition="progress-led-training"/);
  assert.match(playerCommand, /data-testid="player-hero-progress"/);
  assert.match(playerCommand, /className="playerPhase2Gauge"/);
});

test("Phase 2 gives authentication a cinematic dark-to-light entry composition", () => {
  assert.match(auth, /linear-gradient\(180deg,#06161E 0,#0B2A38 338px,#F3F1EA 338px/);
  assert.match(auth, /width:64,height:64/);
  assert.match(auth, /borderRadius:"30px 30px 30px 12px"/);
  assert.match(auth, /color:"#C8FF1A"/);
  assert.match(auth, /backdropFilter:"blur\(24px\) saturate\(135%\)"/);
});

test("Coach mobile chrome and command hero use the Phase 2 premium field system", () => {
  assert.match(coach, /@media\(max-width:700px\)/);
  assert.match(coach, /margin:0 8px -78px!important/);
  assert.match(coach, /border-radius:34px 34px 34px 12px!important/);
  assert.match(coach, /linear-gradient\(145deg,#0b2a38 0,#06151c 78%\)/);
  assert.match(coach, /background:linear-gradient\(135deg,#c8ff1a,#aee800\)!important/);
  assert.match(coach, /prefers-reduced-transparency:reduce/);
});

test("Player identity, decision field, evidence, and coach handoff share one visual language", () => {
  assert.match(playerHeader, /border-radius:0 0 34px 12px!important/);
  assert.match(playerHeader, /min-height:182px!important/);
  assert.match(playerCommand, /grid-template-columns:minmax\(0,1fr\) 104px!important/);
  assert.match(playerCommand, /conic-gradient\(#9ed200 var\(--phase2-progress\)/);
  assert.match(playerCommand, /background:radial-gradient\(circle at 96% 4%,rgba\(200,255,26,.15\)/);
  assert.match(playerCommandCss, /font-size: 15px/);
});

test("The mobile dock becomes a high-contrast performance control surface", () => {
  assert.match(mobileNavigationCss, /background: rgba\(7, 24, 32, \.91\)/);
  assert.match(mobileNavigationCss, /border-radius: 25px 25px 25px 10px/);
  assert.match(mobileNavigationCss, /rgba\(200, 255, 26, \.10\)/);
  assert.match(mobileNavigationCss, /color: #c8ff1a/);
  assert.match(mobileNavigationCss, /backdrop-filter: blur\(30px\) saturate\(145%\)/);
});

test("Phase 2 stays presentation-only", () => {
  for (const source of [playerHeader, playerCommandCss, mobileNavigationCss]) {
    assert.doesNotMatch(source, /supabase|localStorage|sessionStorage|fetch\(/i);
  }
});
