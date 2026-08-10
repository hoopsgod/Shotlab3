import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const TARGET = 'src/components/CoachDashboardPhase2.jsx';
const read = (path) => readFileSync(path, 'utf8');

test('Phase 2D enhancer is idempotent, semantic, and leaves the source tree clean for earlier build enhancers', () => {
  const original = read(TARGET);

  try {
    execFileSync(process.execPath, ['scripts/apply-phase2d-premium-empty-state-language.mjs'], { stdio: 'pipe' });
    execFileSync(process.execPath, ['scripts/apply-phase2d-premium-empty-state-language.mjs'], { stdio: 'pipe' });

    const source = read(TARGET);
    const pkg = JSON.parse(read('package.json'));

    assert.match(source, /import "\.\/Phase2PremiumEmptyStateLanguage\.css";/);
    assert.match(source, /data-phase2-empty-state data-phase2-empty-tone=\{tone\} data-phase2-empty-kind=\{kind\}/);
    assert.match(source, /phase2-empty-state-label/);
    assert.match(source, /phase2-empty-state-message/);
    assert.match(pkg.scripts.dev, /apply-phase2d-premium-empty-state-language\.mjs/);
    assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase2d-premium-empty-state-language\.mjs/);

    assert.match(source, /label="Activity status" kind="activity"/);
    assert.match(source, /No player activity recorded yet\./);
    assert.match(source, /label="Response status" kind="attendance"/);
    assert.match(source, /label="Follow-up cleared" tone="positive" kind="complete"/);
    assert.match(source, /label="Filtered view" kind="filter"/);
    assert.match(source, /label="Season history" kind="history"/);
    assert.match(source, /label="Filtered activity" kind="filter"/);
    assert.match(source, /No team activity matches the selected view\./);
    assert.match(source, /rows\.length \? \(/);
  } finally {
    writeFileSync(TARGET, original);
  }

  assert.equal(read(TARGET), original);
});

test('Phase 2D uses a quiet premium state lane with semantic icon, copy hierarchy, and contextual material safeguards', () => {
  const css = read('src/components/Phase2PremiumEmptyStateLanguage.css');

  assert.match(css, /\[data-phase2-empty-state\]/);
  assert.match(css, /grid-template-columns:\s*38px minmax\(0, 1fr\)/);
  assert.match(css, /grid-template-rows:\s*auto auto/);
  assert.match(css, /border-block:\s*1px solid/);
  assert.match(css, /border-radius:\s*0 !important/);
  assert.match(css, /text-align:\s*left !important/);
  assert.match(css, /phase2-empty-state-label/);
  assert.match(css, /phase2-empty-state-message/);
  assert.match(css, /data-phase2-empty-kind="filter"/);
  assert.match(css, /data-phase2-empty-kind="activity"/);
  assert.match(css, /data-phase2-empty-kind="attendance"/);
  assert.match(css, /data-phase2-empty-kind="complete"/);
  assert.match(css, /data-phase2-empty-kind="history"/);
  assert.match(css, /data-phase2-empty-tone="positive"/);
  assert.match(css, /coach-player-intelligence-drawer/);
  assert.match(css, /coach-event-intelligence-drawer/);
  assert.match(css, /coach-leaderboard-operational-panel/);
  assert.match(css, /:has\(\[data-phase2-empty-kind="filter"\]\)/);
  assert.match(css, /section:has\(\[data-phase2-empty-state\]\)/);
  assert.doesNotMatch(css, /border:\s*1px dashed/);
  assert.doesNotMatch(css, /isDemoAccount|isDemoMode|demoMode|setDemoMode/);
});
