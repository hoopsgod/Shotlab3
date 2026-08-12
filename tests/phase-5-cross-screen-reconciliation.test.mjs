import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const identityCss = fs.readFileSync("public/shotlab-phase3-secondary-cohesion.css", "utf8");
const metricCss = fs.readFileSync("src/components/PlayerMetricHierarchy.module.css", "utf8");
const visualAudit = fs.readFileSync("tests/e2e/phase-3a-cross-screen-visual-audit.spec.mjs", "utf8");
const feedback = fs.readFileSync("src/components/AppFeedbackLayer.jsx", "utf8");

test("Phase 5 keeps every mobile Player secondary identity header inside the viewport", () => {
  assert.match(identityCss, /performance-shell--player\.is-mobile:not\(\[data-workspace-tab="home"\]\)/);
  assert.match(identityCss, /margin:10px 16px 8px!important/);
  assert.match(identityCss, /transform:none!important/);
  assert.match(identityCss, /overflow:hidden!important/);
});

test("Phase 5 gives dark Player metric surfaces explicit readable foreground ownership", () => {
  assert.match(metricCss, /--text-1:#f7f9f5/);
  assert.match(metricCss, /--text-3:#929e94/);
  assert.match(metricCss, /\.metricPrimary,\.metricSupporting/);
});

test("Phase 5 visual audit measures geometry and foreground contrast rather than relying on page width alone", () => {
  assert.match(visualAudit, /expectPlayerIdentityInsideViewport/);
  assert.match(visualAudit, /expectReadablePlayerMetrics/);
  assert.match(visualAudit, /player-at-home-workspace/);
  assert.match(visualAudit, /player-leaderboards-workspace/);
  assert.match(visualAudit, /colors\.values\.length/);
  assert.match(visualAudit, /toHaveLength\(3\)/);
});

test("Phase 5 restores persistent connectivity feedback after transient notifications settle", () => {
  assert.match(feedback, /persistentFeedbackRef/);
  assert.match(feedback, /activeFeedbackRef/);
  assert.match(feedback, /const fallback = persistentFeedback\?\.id === dismissedFeedback\?\.id \? null : persistentFeedback/);
  assert.match(visualAudit, /expectPersistentFeedbackRestored/);
  assert.match(visualAudit, /Team identity saved/);
  assert.match(visualAudit, /Working offline/);
});
