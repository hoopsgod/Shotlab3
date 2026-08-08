import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const script = fs.readFileSync(new URL("../scripts/apply-phase3v-final-reconciliation.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../public/shotlab-phase3v-final-closure.css", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("Phase 3V reconciles the verified parallel Player refinements", () => {
  assert.match(script, /player-profile-drill-index/);
  assert.match(script, /player-profile-full-drill-details/);
  assert.match(script, /player-profile-privacy/);
  assert.match(script, /player-profile-account-data/);
  assert.match(script, /Hide me from leaderboards/);
  assert.match(script, /LegalSupportLinks compact/);
  assert.match(script, /AccountTrustActions deleteAccount/);
  assert.match(script, /DRILL BREAKDOWN/);
  assert.match(script, /Sparkline data=\{d\.last10\}/);
});

test("Phase 3V owns one dock reserve for Home, Profile, and Rankings", () => {
  for (const route of ["home", "profile", "leaderboards"]) {
    assert.match(css, new RegExp(`data-workspace-tab=\\"${route}\\"`));
  }
  assert.match(css, /--p3v-route-dock-reserve:112px/);
  assert.match(css, /screen-fade-in::after/);
  assert.match(css, /height:var\(--p3v-route-dock-reserve\)!important/);
  assert.match(css, /padding-bottom:0!important/);
});

test("Phase 3V preserves Phase 3U account-control authority", () => {
  assert.doesNotMatch(script, /player-quick-actions/);
  assert.doesNotMatch(css, /player-quick-actions/);
  assert.doesNotMatch(script, /Logout/);
  assert.match(pkg.scripts.dev, /apply-phase3u-player-account-control\.mjs.*apply-phase3v-final-reconciliation\.mjs.*minify-visual-authority-css\.mjs/);
  assert.match(pkg.scripts["prepare:route-enhancers"], /apply-phase3u-player-account-control\.mjs.*apply-phase3v-final-reconciliation\.mjs.*minify-visual-authority-css\.mjs/);
});

test("Phase 3V stylesheet is a single final authority rather than divergent legacy links", () => {
  assert.match(script, /shotlab-phase3v-final-closure\.css/);
  assert.match(css, /player-profile-account-data/);
  assert.match(css, /player-profile-drill-index/);
  assert.match(css, /premium-leaderboards-hub/);
  assert.match(css, /player-home-compact-dashboard/);
});
