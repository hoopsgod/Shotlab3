import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const coherence = read("../src/styles/Phase3AppWideCoherence2026.css");
const authority = read("../src/styles/AuthenticatedVisualAuthority2026.css");
const secondary = read("../src/components/SecondaryPageSystem.jsx");
const roster = read("../src/styles/Phase2PremiumRosterLayer.css");

const rgb = (hex) => {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
};
const luminance = (hex) => rgb(hex)
  .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

test("Phase 3 coherence loads after semantic surfaces and before role-specific convergence", () => {
  const surfaces = authority.indexOf("Phase3SurfaceContracts.css");
  const coherenceIndex = authority.indexOf("Phase3AppWideCoherence2026.css");
  const coach = authority.indexOf("CoachRoleVisualConvergence2026.css");
  assert.ok(surfaces >= 0, "semantic surface contracts must remain loaded");
  assert.ok(coherenceIndex > surfaces, "app-wide coherence must refine the semantic surface contract");
  assert.ok(coach > coherenceIndex, "existing Coach role convergence remains the final role-specific authority");
});

test("Phase 3 coherence uses explicit contracts rather than class-name or test-id heuristics", () => {
  assert.doesNotMatch(coherence, /\[class\s*\*=/i);
  assert.doesNotMatch(coherence, /\[data-testid\s*\*=/i);
  assert.doesNotMatch(coherence, /\.shotlab-demo|\[data-demo/i);
  assert.doesNotMatch(coherence, /performance-shell--coach|performance-shell--player/);
  for (const contract of [
    'data-surface="light"',
    'data-surface="dark"',
    'data-visual-role="secondary-page"',
    'data-visual-role="page-intro"',
    'data-visual-role="primary-decision"',
    'data-visual-role="supporting-evidence"',
    'data-visual-role="filter-rail"',
    'data-action-role="primary"',
    'data-action-role="secondary"',
    'data-action-role="tertiary"',
    'data-action-role="destructive"',
  ]) assert.ok(coherence.includes(`[${contract}]`), `${contract} must remain explicit`);
});

test("light and dark materials publish control and action variables from the nearest surface", () => {
  assert.match(coherence, /\[data-surface="light"\][\s\S]*--surface-control-bg:[^;]+;[\s\S]*--surface-primary-bg:[^;]+;/);
  assert.match(coherence, /\[data-surface="dark"\][\s\S]*--surface-control-bg:[^;]+;[\s\S]*--surface-primary-bg:[^;]+;/);
  assert.match(coherence, /\[data-visual-role="secondary-page"\][\s\S]*:is\(input, select, textarea\)[\s\S]*background:\s*var\(--surface-control-bg\)\s*!important/);
  assert.match(coherence, /\[data-action-role="primary"\][\s\S]*background:\s*var\(--surface-primary-bg\)\s*!important/);
  assert.match(coherence, /\[data-action-role="secondary"\][\s\S]*background:\s*var\(--surface-secondary-bg\)\s*!important/);
  assert.match(coherence, /\[data-action-role="tertiary"\][\s\S]*background:\s*transparent\s*!important/);
});

test("coherence tokens preserve readable foregrounds independent of team branding", () => {
  const light = "#f7f5ef";
  const dark = "#171b18";
  for (const color of ["#171a18", "#3f4842", "#68706a", "#465717"]) {
    assert.ok(contrast(color, light) >= 4.5, `${color} must clear normal-text contrast on the light canvas`);
  }
  for (const color of ["#f5f7f4", "#d7ddd8", "#aeb7b0"]) {
    assert.ok(contrast(color, dark) >= 4.5, `${color} must clear normal-text contrast on the dark material`);
  }
});

test("Phase 3 reduces card overload while retaining one intentional dark decision surface", () => {
  assert.match(coherence, /supporting-evidence[\s\S]*box-shadow:\s*none\s*!important/);
  assert.match(coherence, /dashboard-section[\s\S]*background:\s*transparent\s*!important[\s\S]*box-shadow:\s*none\s*!important/);
  assert.match(coherence, /filter-rail[\s\S]*background:\s*transparent\s*!important[\s\S]*box-shadow:\s*none\s*!important/);
  assert.match(coherence, /primary-decision[\s\S]*data-surface="dark"[\s\S]*--sl-coherence-radius-feature/);
});

test("390-class mobile geometry remains safe and touchable", () => {
  assert.match(coherence, /@media\s*\(max-width:\s*430px\)/);
  assert.match(coherence, /overflow-x:\s*clip/);
  assert.match(coherence, /safe-area-inset-bottom/);
  assert.match(coherence, /min-height:\s*44px/);
  assert.match(coherence, /--sl-coherence-section-gap:\s*20px/);
});

test("Phase 2 roster interaction guardrails remain present", () => {
  assert.match(secondary, /\.\.\/styles\/Phase2PremiumRosterLayer\.css/);
  assert.match(roster, /\.coachRosterCard__profile/);
  assert.doesNotMatch(roster, /\.phase1RosterRow\s*\{[^}]*cursor:\s*pointer/i);
});
