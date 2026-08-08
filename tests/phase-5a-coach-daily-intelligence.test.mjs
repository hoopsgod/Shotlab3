import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const commandCenter = await readFile(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");
const selectors = await readFile(new URL("../src/lib/coachDashboardSelectors.js", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const budget = JSON.parse(await readFile(new URL("../performance-budget.json", import.meta.url), "utf8"));

test("Phase 5A exposes only observed Coach daily intelligence", () => {
  assert.match(commandCenter, /const rsvpReadiness = eventReadiness \? clamp\(eventReadiness\.responseRate, 0, 100\) : null/);
  assert.match(commandCenter, /const unresolvedRsvps = Math\.max\(0, Number\(eventReadiness\?\.missing\) \|\| 0\)/);
  assert.match(commandCenter, /aria-label="Coach daily brief"/);
  assert.match(commandCenter, /<small>Today active<\/small>/);
  assert.match(commandCenter, /<small>RSVP ready<\/small>/);
  assert.match(commandCenter, /<small>Follow-up<\/small>/);
  assert.match(commandCenter, /label: "Review RSVPs"/);
});

test("Phase 5A prioritizes unresolved team decisions without inventing scores", () => {
  const playerPriority = commandCenter.indexOf("attentionCount > 0");
  const rsvpPriority = commandCenter.indexOf("unresolvedRsvps > 0");
  const normalPlan = commandCenter.indexOf("activationCommand ||");
  assert.ok(playerPriority >= 0 && rsvpPriority > playerPriority && normalPlan > rsvpPriority);
  assert.doesNotMatch(selectors, /completionRate\s*-\s*8/);
  assert.doesNotMatch(selectors, /priorityCompletionRate/);
  assert.match(selectors, /weeklyActivityRate:\s*completionRate/);
  assert.match(app, /Weekly roster activity: \$\{coachInsights\.weeklyActivityRate\}%/);
});

test("Phase 5A removes duplicate activity chrome instead of adding dashboard clutter", () => {
  assert.doesNotMatch(commandCenter, /function TeamActivityPanel/);
  assert.doesNotMatch(commandCenter, /const teamPanel =/);
  assert.match(commandCenter, /const priorityPanel = sessionPanel \|\| livePanel/);
  assert.match(commandCenter, /const lowerPanels = \[sessionPanel \? livePanel : null\]\.filter\(Boolean\)/);
});

test("Phase 5A runs after the Phase 4F compatibility aligner", () => {
  const prepare = packageJson.scripts["prepare:route-enhancers"];
  assert.match(prepare, /align-phase4f-browser-contracts\.mjs.*apply-phase5a-coach-daily-intelligence\.mjs/);
  assert.match(packageJson.scripts.dev, /apply-phase5a-coach-daily-intelligence\.mjs.*vite/);
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
