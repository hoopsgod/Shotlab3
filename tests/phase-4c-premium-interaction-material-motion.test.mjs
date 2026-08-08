import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const script = fs.readFileSync(new URL("../scripts/apply-phase4c-premium-interaction-material-motion.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../public/shotlab-phase4c-interaction-material-motion.css", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("Phase 4C scopes premium navigation interaction material to the Player role", () => {
  assert.match(script, /data-navigation-role=\{role\} data-testid=\"mobile-navigation-overlay\"/);
  assert.match(script, /data-navigation-role=\{role\} data-testid=\"mobile-navigation-sheet\"/);
  assert.match(script, /onClick=\{\(\) => setOpen\(\(value\) => !value\)\}/);
  assert.match(script, /onMouseDown=\{\(\) => setOpen\(false\)\}/);
  assert.match(css, /\[data-navigation-role=\"player\"\]\[data-testid=\"mobile-navigation-dock\"\]/);
  assert.match(css, /\[data-navigation-role=\"player\"\]\[data-testid=\"mobile-navigation-overlay\"\]/);
  assert.match(css, /\[data-navigation-role=\"player\"\]\[data-testid=\"mobile-navigation-sheet\"\]/);
  assert.doesNotMatch(css, /data-navigation-role=\"coach\"/);
});

test("Phase 4C gives training score entry deliberate focus and press states without changing save behavior", () => {
  assert.match(css, /player-training-score-zone\"\]\:focus-within/);
  assert.match(css, /player-training-session\"\] input\[type=\"number\"\]\:focus/);
  assert.match(css, /player-training-log-score\"\]\:active:not\(:disabled\)/);
  assert.match(css, /--phase4c-focus-ring/);
  assert.doesNotMatch(script, /handleLog|setSaved|prevBest|scores/);
});

test("Phase 4C adds restrained completion motion with reduced-motion protection", () => {
  assert.match(css, /phase4cCompletionIn/);
  assert.match(css, /phase4cResultIn/);
  assert.match(css, /phase4cPBMarkIn/);
  assert.match(css, /player-training-next-action/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /animation:none!important/);
  assert.match(css, /transition:none!important/);
});

test("Phase 4C keeps translucent material limited to navigation and provides a reduced-transparency fallback", () => {
  assert.match(css, /backdrop-filter:blur\(10px\) saturate\(96%\)/);
  assert.match(css, /prefers-reduced-transparency:reduce/);
  assert.match(css, /background-color:#faf9f5!important/);
  assert.match(css, /background-image:none!important/);
  const completionBlock = css.match(/body #root \[data-testid=\"player-training-completion\"\]\{([^}]*)\}/)?.[1] || "";
  assert.ok(completionBlock, "training completion authority block should exist");
  assert.doesNotMatch(completionBlock, /backdrop-filter/);
});

test("Phase 4C runs after Phase 4B and before final visual minification", () => {
  for (const name of ["dev", "prepare:route-enhancers"]) {
    const command = pkg.scripts[name];
    assert.match(command, /apply-phase4b-premium-performance-marks\.mjs.*apply-phase4c-premium-interaction-material-motion\.mjs.*minify-visual-authority-css\.mjs/);
  }
});
