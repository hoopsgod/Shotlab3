import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const hierarchySource = fs.readFileSync(new URL("../src/components/VisualHierarchy.jsx", import.meta.url), "utf8");
const hierarchyCss = fs.readFileSync(new URL("../src/components/VisualHierarchy.module.css", import.meta.url), "utf8");
const commandCenterSource = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const commandCenterCss = fs.readFileSync(new URL("../src/components/CoachCommandCenter.css", import.meta.url), "utf8");
const leaderboardSource = fs.readFileSync(new URL("../src/components/PremiumLeaderboardsHub.jsx", import.meta.url), "utf8");


test("shared hierarchy primitives define objective, three-metric, disclosure, and quiet-section layers", () => {
  assert.match(hierarchySource, /function DominantObjectiveCard/);
  assert.match(hierarchySource, /function MetricStrip/);
  assert.match(hierarchySource, /items\.slice\(0, 3\)/);
  assert.match(hierarchySource, /function ProgressiveDisclosure/);
  assert.match(hierarchySource, /function QuietSection/);
  assert.match(hierarchyCss, /\.objective\s*\{/);
  assert.match(hierarchyCss, /\.metricStrip\s*\{/);
  assert.match(hierarchyCss, /\.disclosure\s*\{/);
});


test("player dashboard exposes one dominant objective and only three primary metrics", () => {
  assert.match(appSource, /testId="player-primary-objective"/);
  assert.match(appSource, /testId="player-primary-metrics"/);
  assert.match(appSource, /title="Upcoming schedule"/);
  assert.match(appSource, /testId="player-team-standings"/);
  assert.match(appSource, /testId="player-coach-guidance"/);
  assert.match(appSource, /testId="player-secondary-intelligence"/);
  assert.doesNotMatch(appSource, /aria-label="Progress snapshot"/);
  assert.match(appSource, /className="player-quick-actions"[\s\S]*?border:0,background:"transparent"/);
  assert.match(commandCenterCss,/player-home-compact-dashboard/);
  assert.match(commandCenterCss,/player-primary-objective/);
});


test("coach home uses one daily command hero with three metrics and progressive tools", () => {
  assert.match(commandCenterSource, /data-testid="coach-primary-objective"/);
  assert.match(commandCenterSource, /data-testid="coach-primary-metrics"/);
  assert.match(commandCenterSource, /Coach command/);
  assert.match(commandCenterSource, /coachTodayBrief__signal/);
  assert.match(commandCenterSource, /aria-expanded=\{toolsOpen\}/);
  assert.match(commandCenterSource, /data-testid="coach-secondary-tools"/);
  assert.match(commandCenterSource, /data-testid="coach-team-code-bar"/);
  assert.doesNotMatch(commandCenterSource, /Team health/);
  assert.doesNotMatch(commandCenterSource, /coach-command-grid/);
  assert.match(appSource, /coach-home-dashboard/);
  assert.match(appSource, /visible=\{isOverviewTab&&showMiniHeader\}/);
  assert.match(appSource, /padding:`\$\{isOverviewTab&&showMiniHeader\?"74px":"12px"\}/);
  assert.match(appSource, /\{isOverviewTab&&<>/);
});


test("leaderboards place rankings ahead of optional archive and participation context", () => {
  assert.match(leaderboardSource, /data-testid="leaderboard-status-line"/);
  assert.match(leaderboardSource, /aria-label="Primary leaderboard categories"/);
  assert.match(leaderboardSource, /testId="leaderboard-participation-categories"/);
  assert.match(leaderboardSource, /testId="all-time-coverage-note"/);
  assert.match(leaderboardSource, /PRIMARY_CATEGORY_ITEMS/);
  assert.match(leaderboardSource, /PARTICIPATION_CATEGORY_ITEMS/);
  assert.doesNotMatch(leaderboardSource, /gridTemplateColumns: 'repeat\(3,minmax\(0,1fr\)\)'/);
  assert.doesNotMatch(leaderboardSource, /boxShadow: '0 10px 26px/);
});


test("secondary hierarchy remains progressively disclosed without oversized summary cards", () => {
  const progressiveDisclosureCount = (appSource.match(/<ProgressiveDisclosure/g) || []).length;
  assert.ok(progressiveDisclosureCount >= 8, `expected at least 8 disclosures, found ${progressiveDisclosureCount}`);
  assert.equal((appSource.match(/testId="player-primary-objective"/g) || []).length, 1);
  assert.equal((commandCenterSource.match(/data-testid="coach-primary-objective"/g) || []).length, 1);
  assert.match(hierarchyCss, /background:\s*transparent !important/);
  assert.match(hierarchyCss, /min-height:\s*48px/);
  assert.match(hierarchyCss, /coach-home-dashboard/);
  assert.match(commandCenterCss,/coach-setup-checklist/);
  assert.match(commandCenterCss,/details summary/);
});