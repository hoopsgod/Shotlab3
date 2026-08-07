import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const enhancer = readFileSync("scripts/apply-phase3p-player-training-completion.mjs", "utf8");
const component = readFileSync("src/components/PlayerTrainingCompletion.jsx", "utf8");
const css = readFileSync("src/components/PlayerTrainingCompletion.module.css", "utf8");
const authority = readFileSync("public/shotlab-phase3p-player-training-completion.css", "utf8");
const html = readFileSync("index.html", "utf8");
const screenshotConfig = readFileSync("playwright.screenshots.config.mjs", "utf8");
const screenshotSpec = readFileSync("tests/e2e/phase-3p-player-training-completion-screenshots.spec.mjs", "utf8");
const workflow = readFileSync(".github/workflows/phase-3p-player-training-completion.yml", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

test("Phase 3P runs after the accepted Phase 3O session enhancer and remains idempotent", () => {
  assert.match(pkg.scripts.dev, /apply-phase3o-player-training-session\.mjs[\s\S]*apply-phase3p-player-training-completion\.mjs/);
  assert.match(pkg.scripts["prepare:route-enhancers"], /apply-phase3o-player-training-session\.mjs[\s\S]*apply-phase3p-player-training-completion\.mjs/);
  assert.match(enhancer, /Phase 3O training session must be applied before Phase 3P/);
  assert.match(enhancer, /const marker = '<PlayerTrainingCompletion data=\{shareData\}'/);
  assert.match(enhancer, /already applied/);
  assert.match(enhancer, /expected exactly one anchor/);
});

test("Phase 3P replaces equal-weight DONE and CHALLENGE controls with a momentum-first completion surface", () => {
  assert.match(enhancer, /<PlayerTrainingCompletion data=\{shareData\}/);
  assert.match(enhancer, /shareCard=\{<ShareCard data=\{shareData\}\/\>\}/);
  assert.match(enhancer, /onContinue=\{closeShare\}/);
  assert.match(enhancer, /onChallenge=\{\(\)=>setShowChallForm\(true\)\}/);
  assert.match(component, /NEXT MOVE/);
  assert.match(component, /Continue training/);
  assert.match(component, /Review program/);
});

test("Phase 3P answers what happened, what changed, and what happens next", () => {
  for (const seam of [
    "RESULT LOGGED",
    "DRILL COMPLETE",
    "PERSONAL BEST",
    "WHAT CHANGED",
    "MOMENTUM",
    "NEXT MOVE",
    "player-training-result",
    "player-training-progress-copy",
    "player-training-next-action",
  ]) assert.ok(component.includes(seam), `missing completion hierarchy seam: ${seam}`);
});

test("Phase 3P preserves persistence, PB, challenge, completion cue, and share capabilities", () => {
  for (const seam of [
    "setSaved(true)",
    "setConfetti(true)",
    "setShareData({drill:active.name",
    "addChallenge({to:challTarget",
    "const closeShare=",
    "const sendChallenge=",
    "pushCompletionCue({title:activeMode",
    "shareCard={<ShareCard data={shareData}/>}",
  ]) assert.ok(enhancer.includes(seam), `missing preserved completion capability: ${seam}`);
  assert.match(component, /player-training-share-toggle/);
  assert.match(component, /player-training-challenge-action/);
  assert.match(component, /player-training-share-card/);
});

test("Phase 3P completion design is compact, premium, responsive, and motion-safe", () => {
  assert.match(css, /linear-gradient\(145deg, #111411/);
  assert.match(css, /border-radius: 30px/);
  assert.match(css, /\.resultHero[\s\S]*grid-template-columns/);
  assert.match(css, /\.insightGrid[\s\S]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.nextCard[\s\S]*background: #f7f8f4/);
  assert.match(css, /\.primaryAction[\s\S]*background: #c8ff1a/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("Phase 3P has a stable late visual authority and safe mobile dock clearance", () => {
  assert.match(html, /shotlab-phase3o-player-training-session\.css[\s\S]*shotlab-phase3p-player-training-completion\.css/);
  assert.match(authority, /player-training-completion-wrap[\s\S]*safe-area-inset-bottom/);
  assert.match(authority, /\[data-testid="player-training-completion"\][\s\S]*background-color: #111411 !important/);
  assert.match(authority, /\[data-testid="player-training-result"\][\s\S]*#c8ff1a !important/);
  assert.match(authority, /\[data-testid="player-training-next-action"\][\s\S]*background: #c8ff1a !important/);
});

test("Phase 3P iPhone evidence logs a real score and verifies post-log hierarchy", () => {
  assert.match(screenshotConfig, /phase-3p-player-training-completion-screenshots\.spec\.mjs/);
  assert.match(screenshotSpec, /player-training-log-score/);
  assert.match(screenshotSpec, /player-training-completion/);
  assert.match(screenshotSpec, /player-training-result/);
  assert.match(screenshotSpec, /player-training-next-action/);
  assert.match(screenshotSpec, /player-training-share-toggle/);
  assert.match(screenshotSpec, /player-training-challenge-action/);
  assert.match(screenshotSpec, /04r-player-training-completion\.png/);
  assert.match(screenshotSpec, /04s-player-training-share-secondary\.png/);
  assert.match(screenshotSpec, /fullPage: false/);
  assert.match(screenshotSpec, /fill\("20"\)/);
  assert.match(screenshotSpec, /scrollWidth - window\.innerWidth/);
  assert.match(workflow, /04r-player-training-completion\.png/);
  assert.match(workflow, /04s-player-training-share-secondary\.png/);
});
