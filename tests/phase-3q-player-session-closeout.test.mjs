import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const enhancer = readFileSync("scripts/apply-phase3q-player-session-closeout.mjs", "utf8");
const completion = readFileSync("src/components/PlayerTrainingCompletion.jsx", "utf8");
const closeout = readFileSync("src/components/PlayerSessionCloseout.jsx", "utf8");
const closeoutCss = readFileSync("src/components/PlayerSessionCloseout.module.css", "utf8");
const authority = readFileSync("public/shotlab-phase3q-player-session-closeout.css", "utf8");
const html = readFileSync("index.html", "utf8");
const screenshotConfig = readFileSync("playwright.screenshots.config.mjs", "utf8");
const screenshotSpec = readFileSync("tests/e2e/phase-3q-player-session-closeout-screenshots.spec.mjs", "utf8");
const workflow = readFileSync(".github/workflows/phase-3q-player-session-closeout.yml", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

test("Phase 3Q runs after Phase 3P and preserves an idempotent transform boundary", () => {
  assert.match(pkg.scripts.dev, /apply-phase3p-player-training-completion\.mjs[\s\S]*apply-phase3q-player-session-closeout\.mjs/);
  assert.match(pkg.scripts["prepare:route-enhancers"], /apply-phase3p-player-training-completion\.mjs[\s\S]*apply-phase3q-player-session-closeout\.mjs/);
  assert.match(enhancer, /Phase 3P training completion must be applied before Phase 3Q/);
  assert.match(enhancer, /const marker = 'completedCount=/);
  assert.match(enhancer, /already applied/);
  assert.match(enhancer, /expected exactly one anchor/);
});

test("Phase 3Q wires factual daily session context rather than synthetic aggregate scoring", () => {
  assert.match(enhancer, /todayProgramScores:todayS/);
  assert.match(enhancer, /programDrills\.length:drills\.length/);
  assert.match(enhancer, /nextCommitment=\{events\.filter/);
  assert.match(enhancer, /switchTab\("profile"\)/);
  assert.doesNotMatch(closeout, /overall score|performance score|session grade/i);
});

test("training completion gives the player an intentional closeout path without blocking continued training", () => {
  assert.match(completion, /PlayerSessionCloseout/);
  assert.match(completion, /player-training-finish-session/);
  assert.match(completion, /Finish for today/);
  assert.match(completion, /Finish session/);
  assert.match(completion, /Continue training/);
  assert.match(completion, /onResume=\{\(\) => setShowSessionCloseout\(false\)\}/);
});

test("session closeout answers work completed, strongest signal, momentum, next commitment, and next action", () => {
  for (const seam of [
    "player-session-closeout",
    "SESSION COMPLETE",
    "TODAY’S WORK IS BANKED",
    "RESULTS LOGGED",
    "PLAN STATUS",
    "MOMENTUM",
    "BEST MOMENT",
    "NEXT COMMITMENT",
    "CLOSE THE LOOP",
    "Done for today",
    "View progress",
    "Resume training",
  ]) assert.ok(closeout.toUpperCase().includes(seam.toUpperCase()), `missing closeout seam: ${seam}`);
});

test("session closeout uses a compact premium hierarchy with mobile and reduced-motion support", () => {
  assert.match(closeoutCss, /linear-gradient\(150deg, #0f120f/);
  assert.match(closeoutCss, /border-radius: 30px/);
  assert.match(closeoutCss, /\.metrics[\s\S]*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(closeoutCss, /\.signalGrid[\s\S]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(closeoutCss, /\.closeoutCard[\s\S]*background: #f7f8f4/);
  assert.match(closeoutCss, /\.primary[\s\S]*background: #c8ff1a/);
  assert.match(closeoutCss, /@media \(max-width: 390px\)/);
  assert.match(closeoutCss, /prefers-reduced-motion: reduce/);
});

test("Phase 3Q owns its late visual authority and safe dock clearance", () => {
  assert.match(html, /shotlab-phase3p-player-training-completion\.css[\s\S]*shotlab-phase3q-player-session-closeout\.css/);
  assert.match(authority, /player-training-finish-session/);
  assert.match(authority, /\[data-testid="player-session-closeout"\][\s\S]*background-color: #0f120f !important/);
  assert.match(authority, /player-session-closeout-hero/);
  assert.match(authority, /player-session-done/);
  assert.match(authority, /safe-area-inset-bottom/);
});

test("Phase 3Q iPhone evidence logs a real score, enters closeout, verifies contrast, and exits to progress", () => {
  assert.match(screenshotConfig, /phase-3q-player-session-closeout-screenshots\.spec\.mjs/);
  assert.match(screenshotSpec, /\/v1\/scores/);
  assert.match(screenshotSpec, /fill\("20"\)/);
  assert.match(screenshotSpec, /player-training-finish-session/);
  assert.match(screenshotSpec, /player-session-closeout/);
  assert.match(screenshotSpec, /player-session-next-commitment/);
  assert.match(screenshotSpec, /player-session-done/);
  assert.match(screenshotSpec, /player-session-view-progress/);
  assert.match(screenshotSpec, /04t-player-session-closeout\.png/);
  assert.match(screenshotSpec, /04u-player-session-closeout-actions\.png/);
  assert.match(screenshotSpec, /fullPage: false/);
  assert.match(screenshotSpec, /scrollWidth - window\.innerWidth/);
  assert.match(workflow, /04t-player-session-closeout\.png/);
  assert.match(workflow, /04u-player-session-closeout-actions\.png/);
});
