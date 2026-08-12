import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("src/App.jsx", "utf8");
const css = readFileSync("src/components/SecondaryPageSystem.css", "utf8");
const phase2Css = readFileSync("src/components/CoachDashboardPhase2.module.css", "utf8");
const reboot = readFileSync("src/lib/visualSystemReboot.js", "utf8");
const releaseFixes = readFileSync("src/lib/visualSystemRebootReleaseFixes.js", "utf8");
const playersEnhancer = readFileSync("scripts/apply-phase3h-coach-players-hierarchy.mjs", "utf8");

test("Coach secondary pages use editorial opening, one performance decision surface, and flat evidence", () => {
  assert.match(css, /\.secondaryPageIntro\s*\{[\s\S]*?background:\s*transparent;/);
  assert.match(css, /\.secondaryPageToolbar \[class\*="metricStrip"\][\s\S]*?gap:\s*0 !important/);
  assert.match(css, /\.secondaryPageDecision\s*\{[\s\S]*?linear-gradient\(145deg, #171b18, #0c0f0d 72%\)/);
  assert.match(css, /\.secondaryPageDecision__visual\s*\{[\s\S]*?display:\s*block/);
  assert.match(css, /\.secondaryPageEvidence > \*[\s\S]*?border-radius:\s*0 !important/);
  assert.match(css, /\.secondaryPageEvidence > \*[\s\S]*?background:\s*transparent !important/);
});

test("historical runtime visual layers cannot override the canonical secondary-page component stylesheet", () => {
  assert.match(reboot, /secondaryStart[\s\S]*secondaryEnd[\s\S]*CSS\.slice/);
  assert.doesNotMatch(releaseFixes, /\.secondaryPageIntro/);
});

test("Players route keeps one actionable roster instead of rendering a duplicate Player Details list", () => {
  const start = app.indexOf('{tab==="players"&&!selP');
  const end = app.indexOf('{tab==="settings"', start);
  assert.ok(start >= 0 && end > start);
  const players = app.slice(start, end);
  assert.match(players, /<CoachRoster/);
  assert.match(players, /onSelectPlayer=\{openPlayerIntelligence\}/);
  assert.doesNotMatch(players, /t="PLAYER DETAILS"/);
  assert.equal((players.match(/<CoachRoster/g) || []).length, 1);
  assert.doesNotMatch(playersEnhancer, /t="PLAYER DETAILS"/);
  assert.match(playersEnhancer, /onSelectPlayer=\{openPlayerIntelligence\}/);
});

test("Coach Player Detail enters through the canonical editorial workspace and keeps account controls quiet", () => {
  const start = app.indexOf('{tab==="players"&&selP');
  const end = app.indexOf('S&C MANAGEMENT', start);
  assert.ok(start >= 0 && end > start);
  const detail = app.slice(start, end);
  assert.match(detail, /<SecondaryPageShell[^>]*className="coachPlayerDetailWorkspace"/);
  assert.match(detail, /<SecondaryPageIntro[^>]*eyebrow="Player intelligence"/);
  assert.match(detail, /className="coachPlayerDataManagement"/);
  assert.match(detail, /<summary className="coachPlayerDataManagement__summary">/);
  assert.match(css, /\.coachPlayerProfileHero\s*\{[\s\S]*?linear-gradient\(145deg, #171b18, #0c0f0d 72%\)/);
  assert.match(css, /\.coachPlayerDataManagement\s*\{[\s\S]*?background:\s*#fff/);
});

test("Coach operational panels share the light 2026 workspace grammar", () => {
  assert.match(phase2Css, /\.phasePanel\s*\{[\s\S]*?background:\s*transparent/);
  assert.match(phase2Css, /\.operationalRow,\s*\n\.comparisonRow\s*\{[\s\S]*?background:\s*#fff/);
  assert.match(phase2Css, /\.emptyState\s*\{[\s\S]*?font:\s*550 13px/);
  assert.doesNotMatch(phase2Css, /font-size:\s*[89]px/);
});
