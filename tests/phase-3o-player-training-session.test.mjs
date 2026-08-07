import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const enhancer = readFileSync("scripts/apply-phase3o-player-training-session.mjs", "utf8");
const component = readFileSync("src/components/PlayerTrainingSessionHeader.jsx", "utf8");
const css = readFileSync("src/components/PlayerTrainingSessionHeader.module.css", "utf8");
const authority = readFileSync("public/shotlab-phase3o-player-training-session.css", "utf8");
const html = readFileSync("index.html", "utf8");
const screenshotConfig = readFileSync("playwright.screenshots.config.mjs", "utf8");
const screenshotSpec = readFileSync("tests/e2e/phase-3o-player-training-session-screenshots.spec.mjs", "utf8");
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
    "pushCompletionCue({title:activeMode",
  ]) assert.ok(enhancer.includes(seam), `missing preserved training capability: ${seam}`);
});

test("Phase 3O unifies score entry and LOG SCORE into one safe-area-aware completion zone", () => {
  assert.match(enhancer, /data-testid="player-training-score-zone"/);
  assert.match(enhancer, /LOG YOUR RESULT/);
  assert.match(enhancer, /data-testid="player-training-log-score"/);
  assert.match(enhancer, /LOG SCORE &#8594;/);
  assert.match(authority, /\[data-testid="player-training-score-zone"\][\s\S]*safe-area-inset-bottom/);
  assert.match(authority, /\[data-testid="player-training-log-score"\][\s\S]*background-color: #c8ff1a !important/);
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

test("Phase 3O uses a stable late authority boundary for the dark drill identity and score input", () => {
  assert.match(html, /shotlab-phase3n-player-commitments\.css[\s\S]*shotlab-phase3o-player-training-session\.css/);
  assert.match(authority, /\[data-testid="player-training-session-header"\][\s\S]*background-color: #111411 !important/);
  assert.match(authority, /\[data-testid="player-training-session-header"\] > div[\s\S]*background-color: transparent !important/);
  assert.match(authority, /\[data-testid="player-training-session-header"\] h1[\s\S]*#f8faf5 !important/);
  assert.match(authority, /\[data-testid="player-training-session"\] input\[type="number"\][\s\S]*#c8ff1a !important/);
});

test("Phase 3O iPhone evidence is selected by the screenshot runner and exercises live-score state", () => {
  assert.match(screenshotConfig, /phase-3o-player-training-session-screenshots\.spec\.mjs/);
  assert.match(screenshotSpec, /player-training-session-header/);
  assert.match(screenshotSpec, /player-training-live-progress/);
  assert.match(screenshotSpec, /player-training-score-zone/);
  assert.match(screenshotSpec, /player-training-log-score/);
  assert.match(screenshotSpec, /04p-player-training-session\.png/);
  assert.match(screenshotSpec, /scoreInput\.fill\("20"\)/);
  assert.match(screenshotSpec, /identityBackground/);
  assert.match(screenshotSpec, /titleColor/);
  assert.match(screenshotSpec, /inputStyle\.color/);
  assert.match(screenshotSpec, /logBox\.y \+ logBox\.height/);
  assert.match(screenshotSpec, /scrollWidth - window\.innerWidth/);
});
