// Phase 2 Player command hierarchy release contract.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const main = read("../src/main.jsx");
const player = read("../src/components/PlayerDailyCommandCenter.jsx");
const playerCss = read("../src/components/PlayerDailyCommandCenter.module.css");
const hierarchy = read("../src/styles/CommandHierarchy2026.css");
const rail = read("../src/components/OperationalInsightRail.jsx");
const railCss = read("../src/components/OperationalInsightRail.module.css");
const railModel = read("../src/lib/operationalInsightRails.js");
const coach = read("../src/components/CoachCommandCenter.jsx");
const sessionIntegrity = read("../public/shotlab-v15-session-integrity.css");

test("Phase 2 Player authority loads after the Phase 1 visual foundation", () => {
  const foundationIndex = main.indexOf("await import('./styles/VisualFoundation2026.css')");
  const hierarchyIndex = main.indexOf("await import('./styles/CommandHierarchy2026.css')");
  assert.ok(foundationIndex >= 0);
  assert.ok(hierarchyIndex > foundationIndex);
});

test("Player home exposes one primary action before supporting evidence", () => {
  const primaryIndex = player.indexOf('data-command-role="primary"');
  const evidenceIndex = player.indexOf('data-testid="player-command-evidence"');
  const priorityIndex = player.indexOf('data-command-role="coach-priority"');
  const nextActionsIndex = player.indexOf('data-command-role="next-actions"');
  const progressIndex = player.indexOf('data-command-role="progress-details"');
  assert.ok(primaryIndex >= 0);
  assert.ok(evidenceIndex > primaryIndex);
  assert.ok(priorityIndex > evidenceIndex);
  assert.ok(nextActionsIndex > priorityIndex);
  assert.ok(progressIndex > nextActionsIndex);
});

test("Player supporting analytics use progressive disclosure", () => {
  assert.match(player, /data-testid="player-progress-disclosure"/);
  assert.match(player, /className="playerProgressDisclosure"/);
  assert.match(player, /Progress snapshot/);
  assert.match(player, /View details/);
  assert.match(player, /open=\{progressShouldOpen \|\| undefined\}/);
  assert.match(player, /model\.queue\) \? model\.queue\.slice\(1, 3\)/);
});

test("Player evidence reuses existing progress primitives", () => {
  assert.match(player, /className=\{styles\.progressGrid\} role="group" data-testid="player-command-evidence" data-layout-role="supporting-evidence"/);
  assert.match(player, /aria-label="Today’s training evidence"/);
  assert.match(player, /Current streak:/);
  assert.match(player, /className=\{styles\.progressCard\}/);
  assert.match(hierarchy, /\[data-testid="player-command-evidence"\]/);
  assert.match(hierarchy, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(hierarchy, /font-size: clamp\(20px, 4\.8vw, 26px\)/);
  assert.doesNotMatch(player, /CommandEvidenceBar|playerCommandEvidenceItem/);
  assert.doesNotMatch(hierarchy, /\.playerCommandEvidenceItem/);
});

test("Player command hierarchy keeps only the primary decision surface in dark performance mode", () => {
  assert.match(player, /data-layout-role="primary-decision"/);
  assert.match(player, /data-layout-role="supporting-evidence"/);
  assert.match(player, /data-layout-role="quiet-secondary"/);
  assert.doesNotMatch(hierarchy, /\.performance-shell--player \[data-testid\^="player-"\]\[data-testid\$="-workspace"\]/);
  assert.match(hierarchy, /\.player-primary-logging-region/);
});

test("Player mobile hierarchy preserves a dominant action and deliberate disclosure", () => {
  assert.match(hierarchy, /\[data-command-role="primary"\]/);
  assert.match(hierarchy, /font-size: clamp\(32px, 10vw, 44px\)/);
  assert.match(hierarchy, /\.playerProgressDisclosure > summary:focus-visible/);
  assert.match(hierarchy, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Dark-surface copy authority cannot recolor generic control labels", () => {
  assert.match(sessionIntegrity, /:is\(p,small\)\{color:#b8c0ba!important;-webkit-text-fill-color:currentColor!important\}/);
  assert.doesNotMatch(sessionIntegrity, /:is\(p,small,span\)\{color:#b8c0ba!important/);
  assert.match(playerCss, /\.primaryButton,\s*\.taskButton,\s*\.activationButton\s*\{[\s\S]*-webkit-text-fill-color: currentColor;/);
  assert.match(playerCss, /\.primaryButton > \*,\s*\.taskButton > \*,\s*\.activationButton > \*\s*\{[\s\S]*color: inherit;[\s\S]*-webkit-text-fill-color: currentColor;/);
});

test("Phase 2 gives desktop insight rails one dark priority and quiet supporting cards", () => {
  assert.match(rail, /data-density="decision-first"/);
  assert.match(rail, /data-rail-role=\{index === 0 \? "primary" : "supporting"\}/);
  assert.match(railCss, /\.card\s*\{[\s\S]*#fbfbf8[\s\S]*box-shadow:\s*0 6px 16px/s);
  assert.match(railCss, /\.card h3\s*\{[\s\S]*color: #172019/s);
  assert.match(railCss, /\.card p\s*\{[\s\S]*color: #5f6962/s);
  assert.match(railCss, /\.primaryCard\s*\{[\s\S]*linear-gradient\(155deg, #151b1c, #0a0e11\)/s);
  assert.match(railCss, /\.primaryCard h3\s*\{[\s\S]*#f5f8f6/s);
});

test("Phase 2 copy is concise, grammatical, and does not overclaim verification", () => {
  assert.match(player, /Daily work banked\./);
  assert.match(railModel, /title: "Daily brief"/);
  assert.match(railModel, /"1 RSVP needs a response"/);
  assert.match(railModel, /at-home makes logged/);
  assert.doesNotMatch(railModel, /RSVP\$\{[^}]+\} need action/);
  assert.doesNotMatch(railModel, /verified At Home makes/);
});

test("Coach home reserves the brand accent for the primary decision", () => {
  assert.match(coach, /data-home-hierarchy="decision-first"/);
  assert.match(coach, /data-testid="coach-primary-objective" data-home-role="primary"/);
  assert.match(coach, /data-testid="coach-onboarding-state" data-home-role="supporting"/);
  assert.match(sessionIntegrity, /\[data-testid="coach-onboarding-state"\]::before\{inset:0 auto 0 0!important;width:4px!important/);
});