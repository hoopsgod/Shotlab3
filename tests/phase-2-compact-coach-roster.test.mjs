import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const dashboards = fs.readFileSync(new URL("../src/components/CoachInteractiveDashboards.jsx", import.meta.url), "utf8");
const secondary = fs.readFileSync(new URL("../src/components/SecondaryPageSystem.jsx", import.meta.url), "utf8");

test("Phase 2 applies compact shared headers to Players, Schedule, and Drills", () => {
  assert.match(dashboards, /testId="coach-players-command-bar" compact/);
  assert.match(dashboards, /testId="coach-events-command-bar"[\s\S]*?compact/);
  assert.match(dashboards, /compact=\{testId === "coach-page-dashboard-drills"\}/);
  assert.match(secondary, /secondaryPageTitleStage--compact/);
});

test("Players has one title authority and an explicit profile action without nested row controls", () => {
  const roster = app.slice(app.indexOf("function CoachRoster"), app.indexOf("// Text sanitizer"));
  assert.doesNotMatch(roster, /PLAYER ROSTER/);
  assert.match(roster, /aria-label=\{`Open \$\{p\.name \|\| "player"\} profile`\}/);
  assert.match(roster, /<article key=\{rosterIdentity\}/);
  assert.match(roster, /<details className="coachRosterCard__manage">/);
  assert.match(roster, /Remove from team/);
  assert.doesNotMatch(roster, /role="button"/);
});
