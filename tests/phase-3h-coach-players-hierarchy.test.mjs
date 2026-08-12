import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("src/App.jsx", "utf8");
const enhancer = readFileSync("scripts/apply-phase3h-coach-players-hierarchy.mjs", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const routeEnhancers = readFileSync("scripts/run-route-enhancers.mjs", "utf8");
const screenshots = readFileSync("tests/e2e/design-system-screenshots.spec.mjs", "utf8");

test("Phase 3H compatibility verifier remains in the build pipeline", () => {
  assert.match(pkg.scripts.dev, /run-route-enhancers\.mjs dev/);
  assert.match(pkg.scripts["prepare:route-enhancers"], /run-route-enhancers\.mjs build/);
  assert.match(routeEnhancers, /apply-phase3g-coach-drills-hierarchy\.mjs[\s\S]*apply-phase3h-coach-players-hierarchy\.mjs/);
  assert.doesNotMatch(enhancer, /writeFileSync/);
  assert.match(enhancer, /Phase 5B\.3 supersedes the old build-time disclosure rewrite/);
});

test("Coach Players keeps activation and roster work while Team & Account owns history", () => {
  const playersStart = app.indexOf('{tab==="players"&&!selP');
  const administrationStart = app.indexOf('{tab==="settings"', playersStart);
  assert.ok(playersStart >= 0 && administrationStart > playersStart);
  const players = app.slice(playersStart, administrationStart);
  assert.match(players, /<CoachPlayerInviteForm/);
  assert.match(players, /<CoachRoster/);
  assert.match(players, /onSelectPlayer=\{openPlayerIntelligence\}/);
  assert.doesNotMatch(players, /coach-season-archive|<NewSeasonWizard|DEMO SETTINGS|LEGAL & SUPPORT/);
  assert.match(app.slice(administrationStart), /testId="coach-administration-workspace"/);
  assert.match(app.slice(administrationStart), /data-testid="coach-season-archive"/);
});

test("legacy disclosure CSS is retired instead of shipping unused styling", () => {
  const html = readFileSync("index.html", "utf8");
  assert.doesNotMatch(html, /shotlab-phase3h-coach-players-hierarchy\.css/);
  assert.doesNotMatch(enhancer, /coach-player-management-disclosure|coach-player-season-tools/);
});

test("rendered evidence follows Players into the dedicated Team & Account route", () => {
  assert.match(screenshots, /06-coach-players/);
  assert.match(screenshots, /06b-coach-player-add/);
  assert.match(screenshots, /06c-coach-team-account/);
  assert.doesNotMatch(screenshots, /coach-player-season-tools|coach-player-roster-management/);
});
