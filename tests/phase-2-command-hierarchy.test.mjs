// Phase 2 Player command hierarchy release contract.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const main = read("../src/main.jsx");
const player = read("../src/components/PlayerDailyCommandCenter.jsx");
const hierarchy = read("../src/styles/CommandHierarchy2026.css");

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

test("Player evidence remains accessible, compact, and locally styled", () => {
  assert.match(player, /className="playerCommandEvidence" role="group"/);
  assert.match(player, /aria-label="Today’s training evidence"/);
  assert.match(player, /Current streak:/);
  assert.match(hierarchy, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(hierarchy, /\.playerCommandEvidenceItem/);
  assert.match(hierarchy, /font-size: clamp\(19px, 4\.8vw, 25px\)/);
  assert.doesNotMatch(player, /CommandEvidenceBar/);
});

test("dark Player command surfaces restore readable local text tokens", () => {
  assert.match(hierarchy, /--text-1: #f5f8f9/);
  assert.match(hierarchy, /--text-2: #c3cdd2/);
  assert.match(hierarchy, /--text-3: #9ba7ae/);
});

test("Player mobile hierarchy preserves a dominant action and deliberate disclosure", () => {
  assert.match(hierarchy, /\[data-command-role="primary"\]/);
  assert.match(hierarchy, /font-size: clamp\(32px, 10vw, 44px\)/);
  assert.match(hierarchy, /\.playerProgressDisclosure > summary:focus-visible/);
  assert.match(hierarchy, /@media \(prefers-reduced-motion: reduce\)/);
});
