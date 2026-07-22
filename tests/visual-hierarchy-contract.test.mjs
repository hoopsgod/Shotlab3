import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const hierarchySource = fs.readFileSync(new URL("../src/components/VisualHierarchy.jsx", import.meta.url), "utf8");
const hierarchyCss = fs.readFileSync(new URL("../src/components/VisualHierarchy.module.css", import.meta.url), "utf8");
const commandCenterSource = fs.readFileSync(new URL("../src/components/CoachCommandCenter.jsx", import.meta.url), "utf8");

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
});

test("coach dashboard exposes one command objective, three metrics, and collapsed operations", () => {
  assert.match(commandCenterSource, /testId="coach-primary-objective"/);
  assert.match(commandCenterSource, /testId="coach-primary-metrics"/);
  assert.match(commandCenterSource, /testId="coach-secondary-tools"/);
  assert.match(appSource, /testId="coach-today-practice"/);
  assert.match(appSource, /testId="coach-next-seven-days"/);
  assert.match(appSource, /testId="coach-operational-alerts"/);
  assert.match(appSource, /testId="coach-priority-editor"/);
  assert.match(appSource, /testId="coach-program-intelligence"/);
  assert.doesNotMatch(appSource, /title="COACH HOME" subtitle="Today-first command surface/);
});

test("secondary hierarchy uses progressive disclosure instead of adding another dominant card", () => {
  const progressiveDisclosureCount = (appSource.match(/<ProgressiveDisclosure/g) || []).length;
  assert.ok(progressiveDisclosureCount >= 8, `expected at least 8 disclosures, found ${progressiveDisclosureCount}`);
  assert.equal((appSource.match(/testId="player-primary-objective"/g) || []).length, 1);
  assert.equal((commandCenterSource.match(/testId="coach-primary-objective"/g) || []).length, 1);
});
