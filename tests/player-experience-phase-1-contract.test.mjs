import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("src/App.jsx", "utf8");
const component = fs.readFileSync("src/components/PlayerDailyCommandCenter.jsx", "utf8");
const selector = fs.readFileSync("src/lib/playerDailyCommandCenter.js", "utf8");
const workflow = fs.readFileSync(".github/workflows/player-experience-phase-1-e2e.yml", "utf8");

test("Player Home uses the shared daily command center", () => {
  assert.match(app, /import PlayerDailyCommandCenter from/);
  assert.match(app, /derivePlayerDailyCommandCenter/);
  assert.match(app, /<PlayerDailyCommandCenter model=\{dailyCommandModel\} onAction=\{handleDailyCommandAction\}\/>/);
  assert.match(app, /data-testid="player-completion-cue"/);
  assert.match(app, /nextAction:\{target:"home"\}/);
});

test("command center remains inside the Player route and does not leak into Coach", () => {
  const playerStart = app.indexOf("function Player(");
  const coachStart = app.indexOf("function Coach(");
  const commandCenter = app.indexOf("<PlayerDailyCommandCenter");
  assert.ok(playerStart >= 0 && coachStart > playerStart);
  assert.ok(commandCenter > playerStart && commandCenter < coachStart);
  assert.equal(app.slice(coachStart).includes("<PlayerDailyCommandCenter"), false);
});

test("daily action routing supports direct home and program drill launch", () => {
  assert.match(app, /const handleDailyCommandAction=useCallback/);
  assert.match(app, /target==="duels"\?programDrills:drills/);
  assert.match(app, /setActive\(actionDrill\)/);
  assert.match(component, /data-testid="player-daily-primary-action"/);
  assert.match(component, /data-testid="player-activation-loop"/);
});

test("decision engine is pure and does not write auth, schema, or persistence", () => {
  assert.match(selector, /export const derivePlayerDailyCommandCenter/);
  for (const forbidden of ["supabase", ".insert(", ".update(", ".delete(", "localStorage", "sessionStorage", "fetch("]) {
    assert.equal(selector.includes(forbidden), false, `selector must not contain ${forbidden}`);
  }
});

test("permanent verification is read-only", () => {
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(workflow, /contents: write/);
  assert.doesNotMatch(workflow, /git push|git commit/);
});
