import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const secondary = readFileSync("src/components/SecondaryPageSystem.jsx", "utf8");
const sharedCss = readFileSync("src/components/CoachSecondaryExperience.css", "utf8");
const drillsCss = readFileSync("public/shotlab-phase3g-coach-drills-hierarchy.css", "utf8");
const strengthCss = readFileSync("public/shotlab-phase3k-coach-strength-hierarchy.css", "utf8");
const phase6a = readFileSync("tests/phase6a-visual-system.test.mjs", "utf8");

const requiredSurfaces = [
  "coach-events-interactive-dashboard",
  "coach-page-dashboard-drills",
  "coach-page-dashboard-leaderboards",
  "coach-page-dashboard-strength",
  "coach-branding-workspace",
];

test("Phase 6B attaches one bounded shared Coach-secondary framing stylesheet", () => {
  assert.match(secondary, /import "\.\/CoachSecondaryExperience\.css";/);
  assert.equal((secondary.match(/CoachSecondaryExperience\.css/g) || []).length, 1);
  for (const surface of requiredSurfaces) assert.match(sharedCss, new RegExp(surface));
});

test("Phase 6B keeps Phase 6A Coach Home and Players outside its selector authority", () => {
  assert.doesNotMatch(sharedCss, /mission-control-active|mcShellV3|premium-roster-workspace|coach-players-primary-objective|coach-players-metrics/);
  assert.match(phase6a, /Coach Home and Players owners/);
});

test("shared Phase 6B framing is presentation-only and protects mobile geometry", () => {
  assert.match(sharedCss, /@media \(max-width: 390px\)/);
  assert.match(sharedCss, /overflow-x:\s*clip/);
  assert.match(sharedCss, /padding-inline:\s*14px/);
  assert.match(sharedCss, /min-height:\s*44px/);
  assert.match(sharedCss, /:focus-visible/);
  assert.match(sharedCss, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(sharedCss, /supabase|localStorage|sessionStorage|fetch\(|permission|auth/i);
});

test("Drills and S&C converge inside their existing route-owned style authorities", () => {
  assert.match(drillsCss, /coach-drills-operational-panel[\s\S]*border-top:1px solid var\(--phase3g-line\)!important/);
  assert.match(drillsCss, /article\{[\s\S]*border-radius:0!important[\s\S]*background:transparent!important[\s\S]*box-shadow:none!important/);
  assert.match(drillsCss, /coach-drills-library-disclosure\{[\s\S]*border-block:1px solid var\(--phase3g-line\)[\s\S]*border-radius:0/);
  assert.match(strengthCss, /coach-strength-operational-panel[\s\S]*border-top:1px solid var\(--p3-line/);
  assert.match(strengthCss, /coach-strength-operational-filters[\s\S]*padding:0!important[\s\S]*background:transparent!important/);
  assert.match(strengthCss, /coach-strength-insight-grid[\s\S]*article[\s\S]*border-radius:0!important[\s\S]*background:transparent!important/);
});

test("route-owned convergence preserves practical mobile interaction contracts", () => {
  assert.match(drillsCss, /min-height:44px!important/);
  assert.match(strengthCss, /min-height:44px!important/);
  assert.match(drillsCss, /prefers-reduced-motion:reduce/);
  assert.match(strengthCss, /prefers-reduced-motion:reduce/);
  assert.match(drillsCss, /:focus-visible/);
  assert.match(strengthCss, /:focus-visible/);
});
