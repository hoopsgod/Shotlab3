import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const selector = fs.readFileSync("src/lib/coachActivationPath.js", "utf8");
const commandCenter = fs.readFileSync("src/components/CoachCommandCenter.jsx", "utf8");
const css = fs.readFileSync("src/components/CoachActivationPath.css", "utf8");
const app = fs.readFileSync("src/App.jsx", "utf8");

test("Mission Control is the single visible coach onboarding system", () => {
  assert.equal(commandCenter.includes('data-testid="coach-onboarding-state"'), true);
  assert.equal(commandCenter.includes("deriveCoachActivationPath"), true);
  assert.equal(app.includes('data-testid="coach-setup-checklist"'), true);
  assert.equal(css.includes('body.mission-control-active [data-testid="coach-setup-checklist"]'), true);
  assert.equal(css.includes("display:none !important"), true);
});

test("activation readiness is based on actual identity, roster, schedule, and engagement state", () => {
  for (const milestone of [
    'id: "team-access"',
    'id: "team-identity"',
    'id: "first-player"',
    'id: "first-session"',
    'id: "first-engagement"',
  ]) {
    assert.equal(selector.includes(milestone), true, `missing activation milestone ${milestone}`);
  }
  assert.equal(selector.includes("isCoachIdentityConfigured"), true);
  assert.equal(selector.includes("engagementConfirmed"), true);
  assert.equal(selector.includes("legacyOperationalTeam"), false);
  assert.equal(selector.includes("rosterCount >= 2"), false);
});

test("activation surface meets mobile, focus, and reduced-motion release requirements", () => {
  for (const requirement of [
    "font-family:var(--mc-native",
    "min-height:48px",
    ":focus-visible",
    "outline:3px solid",
    "@media(max-width:700px)",
    "min-height:50px",
    "@media(prefers-reduced-motion:reduce)",
    "backdrop-filter:none",
  ]) {
    assert.equal(css.includes(requirement), true, `missing activation style requirement ${requirement}`);
  }
});

test("activation changes remain presentation and decision-model only", () => {
  const forbiddenTokens = [
    "supabase",
    "fetch(",
    "localStorage",
    "sessionStorage",
    ".insert(",
    ".update(",
    ".delete(",
  ];
  for (const [sourceName, source] of [["selector", selector], ["styles", css]]) {
    for (const token of forbiddenTokens) {
      assert.equal(source.includes(token), false, `${sourceName} must not include ${token}`);
    }
  }
});
