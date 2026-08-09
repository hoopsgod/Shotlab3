import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deriveCoachInsightSummary } from "../src/lib/coachDashboardSelectors.js";

const commandCenter = await readFile(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const selectors = await readFile(new URL("../src/lib/coachDashboardSelectors.js", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const statePanelCss = await readFile(new URL("../src/components/ShotLabStatePanel.module.css", import.meta.url), "utf8");
const phase4eAuthorityCss = await readFile(new URL("../public/shotlab-phase4e-final-polish.css", import.meta.url), "utf8");
const repeatBuildWrapper = await readFile(new URL("../scripts/run-finish-v9-compatible.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const budget = JSON.parse(await readFile(new URL("../performance-budget.json", import.meta.url), "utf8"));

test("Phase 5A adds truthful RSVP decision intelligence without changing the accepted Coach hero language", () => {
  assert.match(commandCenter, /const unresolvedRsvps = Math\.max\(0, Number\(eventReadiness\?\.missing\) \|\| 0\)/);
  assert.match(commandCenter, /attentionCount > 0[\s\S]*unresolvedRsvps > 0[\s\S]*activationCommand \|\|/);
  assert.match(commandCenter, /eyebrow: "Today at a glance"/);
  assert.match(commandCenter, /title: "1 decision before practice"/);
  assert.match(commandCenter, /label: "Review RSVPs"/);
  assert.doesNotMatch(commandCenter, /aria-label="Coach daily brief"/);
  assert.doesNotMatch(commandCenter, /<small>RSVP ready<\/small>/);
});

test("Phase 5A preserves the stronger Phase 4 metric strip and lower dashboard composition", () => {
  assert.match(commandCenter, /<strong>\{activeCount\}<span>\/\{rosterSize\}<\/span><\/strong><small>Active<\/small>/);
  assert.match(commandCenter, /<strong>\{attentionCount\}<\/strong><small>Follow-up<\/small>/);
  assert.match(commandCenter, /<strong>\{hasScheduledSession \? "Set" : "—"\}<\/strong><small>Next<\/small>/);
  assert.match(commandCenter, /function TeamActivityPanel\(/);
  assert.match(commandCenter, /const teamPanel = hasTeamActivity \? <TeamActivityPanel/);
  assert.match(commandCenter, /const priorityPanel = sessionPanel \|\| teamPanel \|\| livePanel/);
  assert.match(commandCenter, /const lowerPanels = \[sessionPanel \? teamPanel : null\]\.filter\(Boolean\)/);
  assert.match(commandCenter, /coach-live-evidence-region/);
});

test("Phase 5A removes pseudo-derived intelligence rather than dressing it up", () => {
  assert.doesNotMatch(selectors, /completionRate\s*-\s*8/);
  assert.doesNotMatch(selectors, /priorityCompletionRate/);
  assert.match(selectors, /rosterEmails\.has\(r\.email\)/);
  assert.match(selectors, /weeklyActivityRate:\s*completionRate/);
  assert.match(app, /Weekly roster activity: \$\{coachInsights\.weeklyActivityRate\}%/);
});

test("Phase 5A weekly activity cannot be inflated by activity outside the supplied roster", () => {
  const today = "2026-08-08";
  const roster = [{ email: "visible@shotlab.test", name: "Visible Player" }];
  const otherScores = Array.from({ length: 9 }, (_, index) => ({ email: `other-${index}@shotlab.test`, date: today, score: 10 }));
  const withVisibleActivity = deriveCoachInsightSummary({
    roster,
    scores: [{ email: "visible@shotlab.test", date: today, score: 10 }, ...otherScores],
    today,
  });
  assert.equal(withVisibleActivity.weeklyActivityRate, 100);
  assert.deepEqual(withVisibleActivity.engagedAthletes, ["visible@shotlab.test"]);

  const withoutVisibleActivity = deriveCoachInsightSummary({ roster, scores: otherScores, today });
  assert.equal(withoutVisibleActivity.weeklyActivityRate, 0);
  assert.deepEqual(withoutVisibleActivity.engagedAthletes, []);
});

test("Phase 5A preserves proven state geometry and fixes the actual mobile Player overflow source", () => {
  assert.match(statePanelCss, /width:min\(calc\(100% - 12px\),calc\(100vw - 28px\)\);[\s\S]*?margin-inline:auto/);
  assert.doesNotMatch(statePanelCss, /@media \(max-width:640px\)[\s\S]*?\.root\{width:min\(calc\(100% - 28px\),calc\(100vw - 28px\)\)\}/);
  assert.match(statePanelCss, /\.action\{[\s\S]*?min-height:44px/);
  assert.match(phase4eAuthorityCss, /\.performance-shell--player \.performance-workspace--player\s*\{[\s\S]*?max-width:\s*100vw;[\s\S]*?overflow-x:\s*clip;[\s\S]*?box-sizing:\s*border-box\b/);
  assert.match(phase4eAuthorityCss, /\.performance-shell \.player-scroll-container\s*\{[\s\S]*?box-sizing:\s*border-box\s*!important;[\s\S]*?width:\s*100%\s*!important;[\s\S]*?max-width:\s*100%\s*!important/);
  assert.doesNotMatch(phase4eAuthorityCss, /\[data-testid="player-workspace-empty-state"\]\s*\{[\s\S]*?max-width:\s*calc\(100%\s*-\s*6px\)/);
  assert.doesNotMatch(phase4eAuthorityCss, /\[data-testid="player-workspace-empty-state"\]\s*\{[\s\S]*?margin-left:\s*3px/);
});

test("Phase 5A owns the final enhancer position and makes repeated native builds safe", () => {
  const prepare = packageJson.scripts["prepare:route-enhancers"];
  assert.match(prepare, /^node scripts\/run-finish-v9-compatible\.mjs/);
  assert.match(prepare, /align-phase4f-browser-contracts\.mjs.*apply-phase5a-coach-daily-intelligence\.mjs$/);
  assert.match(packageJson.scripts.dev, /apply-phase5a-coach-daily-intelligence\.mjs.*vite/);
  assert.match(repeatBuildWrapper, /phase5CoachIntelligenceApplied/);
  assert.match(repeatBuildWrapper, /const unresolvedRsvps =/);
  assert.match(repeatBuildWrapper, /label: \"Review RSVPs\"/);
  assert.match(repeatBuildWrapper, /spawnSync\(process\.execPath, \["scripts\/finish-v9-route-enhancers\.mjs"\]/);
});

test("Phase 5A keeps every accepted performance threshold unchanged", () => {
  assert.equal(budget.maxLargestJavaScriptBytes, 585000);
  assert.equal(budget.maxStartupAppJavaScriptBytes, 585000);
  assert.equal(budget.maxStartupAppJavaScriptGzipBytes, 166000);
  assert.equal(budget.maxTotalJavaScriptGzipBytes, 365000);
  assert.equal(budget.maxLargestCssBytes, 128000);
  assert.equal(budget.maxStartupAppCssBytes, 25000);
  assert.equal(budget.maxStartupAppCssGzipBytes, 5500);
  assert.equal(budget.maxTotalCssGzipBytes, 76750);
  assert.equal(budget.maxJavaScriptFileCount, 8);
});
