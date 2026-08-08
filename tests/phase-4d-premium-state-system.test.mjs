import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const panel = fs.readFileSync(new URL("../src/components/ShotLabStatePanel.jsx", import.meta.url), "utf8");
const panelCss = fs.readFileSync(new URL("../src/components/ShotLabStatePanel.module.css", import.meta.url), "utf8");
const authorityCss = fs.readFileSync(new URL("../public/shotlab-phase4d-state-reconciliation.css", import.meta.url), "utf8");
const script = fs.readFileSync(new URL("../scripts/apply-phase4d-premium-state-system.mjs", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const auth = fs.readFileSync(new URL("../src/components/AuthWorkspace.jsx", import.meta.url), "utf8");
const leaderboard = fs.readFileSync(new URL("../src/components/CompactLeaderboardPreviewCard.jsx", import.meta.url), "utf8");
const workspace = fs.readFileSync(new URL("../src/components/PlayerOperationalWorkspace.jsx", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("Phase 4D defines one semantic state component for loading, first-use, empty, success, and error", () => {
  for (const state of ["loading", "empty", "first-use", "success", "error"]) {
    assert.match(panel, new RegExp(`(?:\\"|')?${state}(?:\\"|')?\\s*:`));
  }
  assert.match(panel, /role=\{role\}/);
  assert.match(panel, /aria-live=\{state === "error" \? "assertive" : "polite"\}/);
  assert.match(panel, /aria-busy=\{busy \|\| undefined\}/);
  assert.match(panelCss, /prefers-reduced-motion:reduce/);
  assert.match(panelCss, /animation:none!important/);
});

test("Phase 4D integrates the state language at high-value recovery seams", () => {
  assert.match(app, /data-testid="startup-loading-state"/);
  assert.match(app, /data-testid="startup-error-state"/);
  assert.match(auth, /data-testid="auth-success-state"/);
  assert.match(auth, /data-testid="auth-error-state"/);
  assert.match(leaderboard, /testId=\{`leaderboard-\$\{displayState\}-state`\}/);
  assert.match(leaderboard, /state=\{recoveryState\}/);
  assert.match(workspace, /testId="player-workspace-empty-state"/);
  assert.match(workspace, /state=\{actionLabel \? "first-use" : "empty"\}/);
});

test("Phase 4D keeps content states out of the Liquid Glass layer", () => {
  assert.doesNotMatch(panelCss, /backdrop-filter/);
  assert.doesNotMatch(panelCss, /blur\(/);
  assert.doesNotMatch(authorityCss, /backdrop-filter:(?!none)/);
  assert.match(authorityCss, /backdrop-filter:none!important/);
});

test("Phase 4D improves disabled and completion semantics without changing data behavior", () => {
  assert.match(authorityCss, /\[data-testid="player-training-session"\] button:disabled/);
  assert.match(authorityCss, /\[data-command-role="confirmation"\]/);
  for (const forbidden of ["setScores", "setProgramScores", "setPlayers", "addScore", "deleteAccount", "toggleRsvp", "saveTeamBranding"]) {
    assert.doesNotMatch(script, new RegExp(forbidden));
  }
});

test("Phase 4D runs after Phase 4C and before final visual minification", () => {
  for (const name of ["dev", "prepare:route-enhancers"]) {
    const command = pkg.scripts[name];
    assert.match(command, /apply-phase4c-premium-interaction-material-motion\.mjs.*apply-phase4d-premium-state-system\.mjs.*minify-visual-authority-css\.mjs/);
  }
  assert.match(index, /shotlab-phase4c-interaction-material-motion[^]*shotlab-phase4d-state-reconciliation/);
});