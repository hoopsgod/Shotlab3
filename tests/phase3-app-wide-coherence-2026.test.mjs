import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const coherence = read("../src/styles/Phase3AppWideCoherence2026.css");
const authority = read("../src/styles/AuthenticatedVisualAuthority2026.css");
const secondary = read("../src/components/SecondaryPageSystem.jsx");
const roster = read("../src/styles/Phase2PremiumRosterLayer.css");

test("Phase 3 coherence loads after semantic surfaces and before role-specific convergence", () => {
  const surfaces = authority.indexOf("Phase3SurfaceContracts.css");
  const coherenceIndex = authority.indexOf("Phase3AppWideCoherence2026.css");
  const coach = authority.indexOf("CoachRoleVisualConvergence2026.css");
  assert.ok(surfaces >= 0 && coherenceIndex > surfaces && coach > coherenceIndex);
});

test("coherence stays role-neutral and uses explicit semantic contracts", () => {
  assert.doesNotMatch(coherence, /\[class\s*\*=/i);
  assert.doesNotMatch(coherence, /\[data-testid\s*\*=/i);
  assert.doesNotMatch(coherence, /\.shotlab-demo|\[data-demo|performance-shell--coach|performance-shell--player/i);
  for (const contract of [
    'data-surface="light"', 'data-surface="dark"',
    'data-visual-role="secondary-page"', 'data-visual-role="page-intro"',
    'data-visual-role="primary-decision"', 'data-visual-role="supporting-evidence"',
    'data-visual-role="filter-rail"', 'data-action-role="primary"',
    'data-action-role="secondary"', 'data-action-role="tertiary"',
    'data-action-role="destructive"',
  ]) assert.ok(coherence.includes(`[${contract}]`), `${contract} must remain explicit`);
});

test("Coach and Player actions resolve from the nearest declared surface", () => {
  assert.match(coherence, /\[data-surface="light"\][\s\S]*--coherence-primary-bg:[^;]+;[\s\S]*--coherence-secondary-bg:[^;]+;/);
  assert.match(coherence, /\[data-surface="dark"\][\s\S]*--coherence-primary-bg:[^;]+;[\s\S]*--coherence-secondary-bg:[^;]+;/);
  assert.match(coherence, /\[data-action-role="primary"\][\s\S]*background:\s*var\(--coherence-primary-bg\)\s*!important/);
  assert.match(coherence, /\[data-action-role="secondary"\][\s\S]*background:\s*var\(--coherence-secondary-bg\)\s*!important/);
  assert.match(coherence, /\[data-action-role="tertiary"\][^}]*background:\s*transparent\s*!important/);
});

test("Phase 3 reduces card overload while retaining a single emphasized decision material", () => {
  assert.match(coherence, /supporting-evidence[\s\S]*box-shadow:\s*none\s*!important/);
  assert.match(coherence, /dashboard-section[\s\S]*background:\s*transparent\s*!important/);
  assert.match(coherence, /filter-rail[\s\S]*background:\s*transparent\s*!important/);
  assert.match(coherence, /primary-decision[\s\S]*data-surface="dark"[\s\S]*--sl-coherence-radius-feature/);
});

test("390-class secondary pages keep the shared mobile reading rail", () => {
  assert.match(coherence, /@media\s*\(max-width:\s*430px\)/);
  assert.match(coherence, /--sl-coherence-section-gap:\s*20px/);
  assert.match(coherence, /overflow-x:\s*clip/);
});

test("Phase 2 roster interaction guardrails remain present", () => {
  assert.match(secondary, /\.\.\/styles\/Phase2PremiumRosterLayer\.css/);
  assert.match(roster, /\.coachRosterCard__profile/);
  assert.doesNotMatch(roster, /\.phase1RosterRow\s*\{[^}]*cursor:\s*pointer/i);
});
