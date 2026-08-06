// Phase 2 command hierarchy release contract.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const main = read("../src/main.jsx");
const player = read("../src/components/PlayerDailyCommandCenter.jsx");
const evidence = read("../src/components/CommandEvidenceBar.jsx");
const evidenceStyles = read("../src/components/CommandEvidenceBar.module.css");
const hierarchy = read("../src/styles/CommandHierarchy2026.css");

test("Phase 2 authority loads after the Phase 1 visual foundation", () => {
  const foundationIndex = main.indexOf("await import('./styles/VisualFoundation2026.css')");
  const hierarchyIndex = main.indexOf("await import('./styles/CommandHierarchy2026.css')");
  assert.ok(foundationIndex >= 0);
  assert.ok(hierarchyIndex > foundationIndex);
});

test("Player home exposes one primary action before supporting evidence", () => {
  const primaryIndex = player.indexOf('data-command-role="primary"');
  const evidenceIndex = player.indexOf("<CommandEvidenceBar");
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

test("Command evidence bar remains accessible and bounded", () => {
  assert.match(evidence, /slice\(0, 4\)/);
  assert.match(evidence, /role="group"/);
  assert.match(evidence, /aria-label=\{ariaLabel\}/);
  assert.match(evidence, /type="button"/);
  assert.match(evidence, /ariaLabel \|\| `\$\{item\.label\}:/);
  assert.match(evidenceStyles, /grid-template-columns: repeat\(var\(--evidence-count, 3\)/);
  assert.match(evidenceStyles, /button\.item:focus-visible/);
  assert.doesNotMatch(evidenceStyles, /font-size: 8px/);
});

test("dark performance command surfaces restore readable local text tokens", () => {
  assert.match(hierarchy, /--text-1: #f5f8f9/);
  assert.match(hierarchy, /--text-2: #c3cdd2/);
  assert.match(hierarchy, /--text-3: #9ba7ae/);
  assert.match(hierarchy, /--command-evidence-value: #f5f8f9/);
});

test("Coach home tightens the above-the-fold decision zone", () => {
  assert.match(hierarchy, /body\.mission-control-active \.mcHero \{/);
  assert.match(hierarchy, /min-height: clamp\(350px, 48vh, 500px\)/);
  assert.match(hierarchy, /body\.mission-control-active \.mcRealityStrip/);
  assert.match(hierarchy, /body\.mission-control-active \.mcFocusGrid/);
  assert.match(hierarchy, /@media \(max-width: 760px\)/);
});

test("Coach mobile authority targets the live high-specificity shell", () => {
  assert.match(hierarchy, /body\.mission-control-active \.mcShellV3 \.mcHero \{/);
  assert.match(hierarchy, /min-height: 318px !important/);
  assert.match(hierarchy, /body\.mission-control-active \.mcShellV3 \.mcHeroContent h1/);
  assert.match(hierarchy, /font-size: 34px !important/);
  assert.match(hierarchy, /body\.mission-control-active \.mcShellV3 \.mcHeroContent > p/);
  assert.match(hierarchy, /font-size: 13px !important/);
  assert.match(hierarchy, /body\.mission-control-active \.mcShellV3 \.mcRealityStrip > button/);
  assert.match(hierarchy, /min-height: 55px !important/);
  assert.match(hierarchy, /body\.mission-control-active \.mcShellV3 \.mcPrimary/);
  assert.match(hierarchy, /min-height: 48px !important/);
});
