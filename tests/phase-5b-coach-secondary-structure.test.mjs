import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("src/App.jsx", "utf8");
const component = readFileSync("src/components/SecondaryPageSystem.jsx", "utf8");
const css = readFileSync("src/components/SecondaryPageSystem.css", "utf8");
const titleCss = readFileSync("src/components/TeamIdentityTitleStage.css", "utf8");
const phase2Css = readFileSync("src/components/CoachDashboardPhase2.module.css", "utf8");
const reboot = readFileSync("src/lib/visualSystemReboot.js", "utf8");
const releaseFixes = readFileSync("src/lib/visualSystemRebootReleaseFixes.js", "utf8");
const playersEnhancer = readFileSync("scripts/apply-phase3h-coach-players-hierarchy.mjs", "utf8");
const compact = (value) => value.replace(/\s+/g, "");

test("Coach secondary pages use the shared editorial title stage, one performance decision surface, and flat evidence", () => {
  const normalizedCss = compact(css);
  assert.match(component, /function SecondaryPageIntro/);
  assert.match(component, /<TeamIdentityTitleStage/);
  assert.match(component, /variant="standard"/);
  assert.match(component, /surface="light"/);
  assert.match(titleCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.doesNotMatch(css, /\.secondaryPageIntro\b/);
  assert.match(normalizedCss, /\.secondaryPageToolbar\[data-visual-role="metric-strip"\][^{]*\{[^}]*gap:0!important/);
  assert.match(normalizedCss, /\.secondaryPageDecision\{[^}]*linear-gradient\(145deg,var\(--team-brand-surface-elevated,#171b18\),var\(--team-brand-surface-deep,#0c0f0d\)72%\)/);
  assert.match(normalizedCss, /\.secondaryPageDecision__visual\{[^}]*display:block/);
  assert.match(normalizedCss, /\.secondaryPageEvidence>\*\{[^}]*border-radius:0!important/);
  assert.match(normalizedCss, /\.secondaryPageEvidence>\*\{[^}]*background:transparent!important/);
});

test("historical runtime visual layers cannot override the canonical secondary-page component stylesheet", () => {
  assert.match(reboot, /owns Mission Control support surfaces only/);
  assert.doesNotMatch(reboot, /secondaryStart|secondaryEnd|\.secondaryPageIntro/);
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
  const normalizedCss = compact(css);
  assert.match(detail, /<SecondaryPageShell[^>]*className="coachPlayerDetailWorkspace"/);
  assert.match(detail, /<SecondaryPageIntro[^>]*eyebrow="Player intelligence"/);
  assert.match(detail, /className="coachPlayerDataManagement"/);
  assert.match(detail, /<summary className="coachPlayerDataManagement__summary">/);
  assert.match(normalizedCss, /\.coachPlayerProfileHero\{[^}]*linear-gradient\(145deg,var\(--team-brand-surface-elevated,#171b18\),var\(--team-brand-surface-deep,#0c0f0d\)72%\)/);
  assert.match(normalizedCss, /\.coachPlayerProfileMetrics\{[^}]*background:#fff/);
});

test("Coach operational panels share the light 2026 workspace grammar", () => {
  const normalizedPhase2 = compact(phase2Css);
  assert.match(normalizedPhase2, /\.phasePanel\{[^}]*background:transparent/);
  assert.match(normalizedPhase2, /\.operationalRow,\.comparisonRow\{[^}]*background:#fff/);
  assert.match(normalizedPhase2, /\.emptyState\{[^}]*font:55013px/);
  assert.doesNotMatch(phase2Css, /font-size:\s*[89]px/);
});
