import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const dashboards = fs.readFileSync("src/components/CoachInteractiveDashboards.jsx", "utf8");
const stage = fs.readFileSync("src/components/CoachRoutePerformanceStage.jsx", "utf8");
const stageCss = fs.readFileSync("src/components/CoachRoutePerformanceStage.module.css", "utf8");
const embeddedCss = fs.readFileSync("src/components/CoachInteractiveDashboards.css", "utf8");
const disclosureCss = fs.readFileSync("src/components/SecondaryPageDisclosure.module.css", "utf8");
const icons = fs.readFileSync("src/components/ShotLabIcon.jsx", "utf8");

const requiredRouteKinds = ["players", "schedule", "training", "strength", "activity", "leaderboards"];

test("coach secondary routes use one semantic performance stage before utility rails", () => {
  assert.match(dashboards, /CoachRoutePerformanceStage/);
  assert.match(dashboards, /testId="coach-players-decision-brief"/);
  assert.match(dashboards, /testId="coach-events-decision-brief"/);
  assert.doesNotMatch(dashboards, /max=\{Math\.max\(model\.primary\.value, 1\)\}/, "do not render a self-normalized always-full progress signal");
  assert.doesNotMatch(dashboards, /InteractiveMetricStrip/, "route metrics should live in the performance stage instead of a duplicate light card rail");
  assert.doesNotMatch(dashboards, /model\.supporting/, "generic route headers must not repeat stage metrics as another evidence-card row");

  const playersStage = dashboards.indexOf('kind="players"');
  const playersToolbar = dashboards.indexOf('testId="coach-players-toolbar"');
  const scheduleStage = dashboards.indexOf('kind="schedule"');
  const scheduleToolbar = dashboards.indexOf('testId="coach-events-toolbar"');
  assert.ok(playersStage > -1 && playersStage < playersToolbar, "Players decision stage should precede utilities");
  assert.ok(scheduleStage > -1 && scheduleStage < scheduleToolbar, "Schedule decision stage should precede utilities");
});

test("coach route stage preserves semantic contrast, actions, and truthful metric labels", () => {
  assert.match(stage, /data-surface="dark"/);
  assert.match(stage, /data-visual-role="primary-decision"/);
  assert.match(stage, /data-action-role="primary"/);
  assert.match(stage, /role="heading" aria-level="2"/);
  assert.match(stage, /aria-label="Current performance signals"/);
  assert.match(stage, /aria-pressed=\{active\}/);
  assert.doesNotMatch(stage, /trend|increase|decrease|improved|declined/i, "route stage must not invent directional claims");
});

test("route identity resolves route context before incidental title words", () => {
  const leaderIndex = stage.indexOf('normalized.includes("leader")');
  const playerIndex = stage.indexOf('normalized.includes("player")');
  assert.ok(leaderIndex > -1 && leaderIndex < playerIndex, "leaderboards must not inherit the Players motif from titles such as Ranked Players");
  assert.match(stage, /const routeKind = classifyRouteValue\(testId\)/);
  assert.match(stage, /routeKind === "default" \? classifyRouteValue\(title\) : routeKind/);
});

test("embedded generic headers do not create a second page-sized bottom reserve", () => {
  assert.match(dashboards, /className="secondaryPageShell--embeddedHeader"/);
  assert.match(embeddedCss, /secondaryPageShell--embeddedHeader[\s\S]*padding-bottom:\s*0/);
  assert.doesNotMatch(embeddedCss, /!important/);
});

test("coach route stages have distinct visual identities without a global override layer", () => {
  requiredRouteKinds.forEach((kind) => {
    assert.ok(stageCss.includes(`data-route-kind="${kind}"`), `${kind} needs a route-specific motif`);
  });
  assert.match(stageCss, /--stage-accent:\s*#c8ff1a/);
  assert.match(stageCss, /min-height:\s*var\(--touch-target, 44px\)/, "primary actions must retain practical mobile targets");
  assert.doesNotMatch(stageCss, /!important/, "component-owned Phase 3 styling should not add another override layer");
  assert.doesNotMatch(stageCss, /:global|\bbody\b|\bhtml\b/, "component styling must stay locally owned");
});

test("Schedule supporting intelligence is quiet, touch-safe, and component-owned", () => {
  assert.match(dashboards, /<SecondaryPageDisclosure/);
  assert.match(dashboards, /testId="coach-events-supporting-intelligence"/);
  assert.match(disclosureCss, /min-height:\s*60px/);
  assert.doesNotMatch(disclosureCss, /!important/);
});

test("route icon vocabulary includes strength and activity signals", () => {
  assert.match(icons, /strength:/);
  assert.match(icons, /activity:/);
  assert.match(stage, /strength:\s*"strength"/);
  assert.match(stage, /activity:\s*"activity"/);
});
