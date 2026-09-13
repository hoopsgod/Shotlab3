import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const secondary = readFileSync("src/components/SecondaryPageSystem.jsx", "utf8");
const css = readFileSync("src/components/CoachSecondaryExperience.css", "utf8");
const phase6a = readFileSync("tests/phase6a-visual-system.test.mjs", "utf8");

const requiredSurfaces = [
  "coach-events-interactive-dashboard",
  "coach-page-dashboard-drills",
  "coach-page-dashboard-leaderboards",
  "coach-page-dashboard-strength",
  "coach-branding-workspace",
];

test("Phase 6B attaches one source-owned Coach secondary convergence stylesheet", () => {
  assert.match(secondary, /import "\.\/CoachSecondaryExperience\.css";/);
  assert.equal((secondary.match(/CoachSecondaryExperience\.css/g) || []).length, 1);
  for (const surface of requiredSurfaces) assert.match(css, new RegExp(surface));
});

test("Phase 6B keeps Phase 6A Coach Home and Players outside its selector authority", () => {
  assert.doesNotMatch(css, /mission-control-active|mcShellV3|premium-roster-workspace|coach-players-primary-objective|coach-players-metrics/);
  assert.match(phase6a, /Coach Home and Players owners/);
});

test("Phase 6B convergence is presentation-only and protects mobile geometry", () => {
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /padding-inline:\s*14px/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /supabase|localStorage|sessionStorage|fetch\(|permission|auth/i);
});

test("Phase 6B reduces container chrome on core Coach operational surfaces", () => {
  assert.match(css, /coach-drills-operational-panel[\s\S]*border-radius:\s*0/);
  assert.match(css, /coach-drills-library-disclosure[\s\S]*border-block:/);
  assert.match(css, /coachLeaderboardPulse[\s\S]*border-radius:\s*0/);
  assert.match(css, /coachStrengthSupportingIntelligence[\s\S]*border-block:/);
});
