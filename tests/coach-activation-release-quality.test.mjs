import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const selector = fs.readFileSync("src/lib/coachActivationPath.js", "utf8");
const commandCenter = fs.readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
const css = fs.readFileSync("src/components/CoachActivationPath.css", "utf8");
const app = fs.readFileSync("src/App.jsx", "utf8");

test("Mission Control is the single visible coach onboarding system", () => {
  assert.match(commandCenter, /data-testid="coach-onboarding-state"/);
  assert.match(commandCenter, /deriveCoachActivationPath/);
  assert.match(app, /data-testid="coach-setup-checklist"/);
  assert.match(css, /body\.mission-control-active \[data-testid="coach-setup-checklist"\]\s*\{[\s\S]*display:none !important/);
});

test("activation readiness is based on actual identity, roster, schedule, and engagement state", () => {
  assert.match(selector, /id: "team-access"/);
  assert.match(selector, /id: "team-identity"/);
  assert.match(selector, /id: "first-player"/);
  assert.match(selector, /id: "first-session"/);
  assert.match(selector, /id: "first-engagement"/);
  assert.match(selector, /isCoachIdentityConfigured/);
  assert.match(selector, /engagementConfirmed/);
  assert.doesNotMatch(selector, /legacyOperationalTeam/);
  assert.doesNotMatch(selector, /rosterCount >= 2/);
});

test("activation surface meets mobile, focus, and reduced-motion release requirements", () => {
  assert.match(css, /font-family:var\(--mc-native/);
  assert.match(css, /min-height:48px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /outline:3px solid/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /min-height:50px/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /backdrop-filter:none/);
});

test("activation changes remain presentation and decision-model only", () => {
  for (const source of [selector, css]) {
    assert.doesNotMatch(source, /supabase|fetch\(|localStorage|sessionStorage|\.insert\(|\.update\(|\.delete\(/i);
  }
});
