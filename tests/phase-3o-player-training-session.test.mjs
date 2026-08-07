import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const enhancer = readFileSync("scripts/apply-phase3o-player-training-session.mjs", "utf8");
const component = readFileSync("src/components/PlayerTrainingSessionHeader.jsx", "utf8");
const css = readFileSync("src/components/PlayerTrainingSessionHeader.module.css", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

test("Phase 3O runs after accepted Phase 3N and remains idempotent", () => {
  assert.match(pkg.scripts.dev, /apply-phase3n-player-commitments\.mjs[\s\S]*apply-phase3o-player-training-session\.mjs/);
  assert.match(pkg.scripts["prepare:route-enhancers"], /apply-phase3n-player-commitments\.mjs[\s\S]*apply-phase3o-player-training-session\.mjs/);
  assert.match(enhancer, /const marker = 'PlayerTrainingSessionHeader drill={active}'/);
  assert.match(enhancer, /already applied/);
  assert.match(enhancer, /expected exactly one anchor/);
});

test("Phase 3O replaces the legacy drill intro with one focused training-session command surface", () => {
  assert.match(enhancer, /data-testid="player-training-session"/);
  assert.match(enhancer, /PlayerTrainingSessionHeader drill={active}/);
  assert.match(enhancer, /currentIndex=\{\(activeMode==="program"\?todayProgramScores:todayS\)\.length\+1\}/);
  assert.match(enhancer, /total=\{activeMode==="program"\?programDrills\.length:drills\.length\}/);
});

test("Phase 3O preserves score validation, persistence, completion, PB, and challenge flows", () => {
  for (const seam of [
    "onClick={handleLog}",
    "disabled={submitting||activeScoreInvalid}",
    "setSaved(true)",
    "addChallenge({to:challTarget",
    "const activeScoreValidation=",
    "const prevBest=activeScores.filter",
    "pushCompletionCue({title:activeMode==\"program\"?\"Program drill completed\":\"Drill completed\"",
  ]) assert.ok(enhancer.includes(seam), `missing preserved training capability: ${seam}`);
});

test("training-session header exposes mode, drill identity, plan position, target, and live score", () => {
  for (const seam of [
    "player-training-session-header",
    "AT HOME SESSION",
    "PROGRAM SESSION",
    "CURRENT WORK",
    "SESSION TARGET",
    "LIVE SCORE",
    "player-training-live-progress",
    "Back to training plan",
  ]) assert.ok(component.includes(seam), `missing training header seam: ${seam}`);
});

test("training-session visual system is compact, premium, responsive, and reduced-motion safe", () => {
  assert.match(css, /linear-gradient\(155deg,#20231f/);
  assert.match(css, /border-radius: 28px/);
  assert.match(css, /\.copy h1[\s\S]*clamp\(/);
  assert.match(css, /\.targetRow[\s\S]*border-top/);
  assert.match(css, /\.progressTrack/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
