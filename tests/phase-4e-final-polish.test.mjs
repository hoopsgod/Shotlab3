import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const header = fs.readFileSync(new URL("../src/components/AppHeader.jsx", import.meta.url), "utf8");
const hierarchy = fs.readFileSync(new URL("../src/components/VisualHierarchy.module.css", import.meta.url), "utf8");
const authority = fs.readFileSync(new URL("../public/shotlab-phase4e-final-polish.css", import.meta.url), "utf8");
const script = fs.readFileSync(new URL("../scripts/apply-phase4e-final-polish.mjs", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("Phase 4E locks AppHeader actions to 44px and prevents title clipping", () => {
  assert.match(header, /minHeight:\s*44/);
  assert.match(header, /minWidth:\s*44/);
  assert.doesNotMatch(header, /minHeight:\s*38/);
  assert.match(header, /overflowWrap:\s*"break-word"/);
  assert.match(header, /maxWidth:\s*"100%"/);
});

test("Phase 4E reconciles hierarchy actions and mobile title width", () => {
  assert.match(hierarchy, /\.quietAction\s*\{[^}]*min-height:\s*44px/s);
  assert.doesNotMatch(hierarchy, /\.quietAction\s*\{[^}]*min-height:\s*36px/s);
  assert.match(hierarchy, /@media \(max-width: 640px\)[\s\S]*\.objectiveTitle\s*\{[^}]*max-width:\s*100%/);
  assert.match(hierarchy, /\.quietHeader\s*\{[^}]*min-width:\s*0/);
});

test("Phase 4E owns mobile gutters, dock clearance, and high-value state placement", () => {
  assert.match(authority, /--phase4e-mobile-gutter:/);
  assert.match(authority, /--phase4e-dock-clearance:/);
  assert.match(authority, /\.performance-shell \.player-scroll-container[\s\S]*padding-left:\s*var\(--phase4e-mobile-gutter\)/);
  assert.match(authority, /\[data-testid="player-workspace-empty-state"\]/);
  assert.match(authority, /scroll-margin-bottom:\s*var\(--phase4e-dock-clearance\)/);
  assert.doesNotMatch(authority, /backdrop-filter/);
  assert.doesNotMatch(authority, /\.performance-shell\s+button\s*\{[^}]*min-height/s);
});

test("Phase 4E remains presentation-only", () => {
  for (const forbidden of ["setScores", "setProgramScores", "setPlayers", "addScore", "deleteAccount", "toggleRsvp", "saveTeamBranding", "localStorage", "sessionStorage"]) {
    assert.doesNotMatch(script, new RegExp(forbidden));
  }
});

test("Phase 4E runs after Phase 4D and before final visual minification", () => {
  for (const name of ["dev", "prepare:route-enhancers"]) {
    const command = pkg.scripts[name];
    assert.match(command, /apply-phase4d-premium-state-system\.mjs.*apply-phase4e-final-polish\.mjs.*minify-visual-authority-css\.mjs/);
  }
  assert.match(index, /shotlab-phase4d-state-reconciliation[^]*shotlab-phase4e-final-polish/);
});
