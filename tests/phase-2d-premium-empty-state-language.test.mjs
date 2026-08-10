import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

test('Phase 2D empty-state enhancer is idempotent and wired into dev/build preparation', () => {
  execFileSync(process.execPath, ['scripts/apply-phase2d-premium-empty-state-language.mjs'], { stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/apply-phase2d-premium-empty-state-language.mjs'], { stdio: 'pipe' });

  const source = read('src/components/CoachDashboardPhase2.jsx');
  const pkg = JSON.parse(read('package.json'));

  assert.match(source, /import "\.\/Phase2PremiumEmptyStateLanguage\.css";/);
  assert.match(source, /data-phase2-empty-state data-phase2-empty-tone=\{tone\} data-phase2-empty-kind=\{kind\}/);
  assert.match(source, /phase2-empty-state-label/);
  assert.match(source, /phase2-empty-state-message/);
  assert.match(pkg.scripts.dev, /apply-phase2d-premium-empty-state-language\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase2d-premium-empty-state-language\.mjs/);
});

test('Phase 2D assigns meaning to operational states instead of treating every empty condition alike', () => {
  const source = read('src/components/CoachDashboardPhase2.jsx');

  assert.match(source, /label="Activity status" kind="activity"/);
  assert.match(source, /label="Attendance status" kind="attendance"/);
  assert.match(source, /label="Follow-up cleared" tone="positive" kind="complete"/);
  assert.match(source, /label="Filtered view" kind="filter"/);
  assert.match(source, /label="Season history" kind="history"/);
  assert.match(source, /label="Filtered activity" kind="filter"/);
  assert.match(source, /No team activity matches the selected view\./);
  assert.match(source, /rows\.length \? \(/);
});

test('Phase 2D uses a quiet premium state lane with semantic icon and copy hierarchy', () => {
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
  assert.doesNotMatch(css, /border:\s*1px dashed/);
  assert.doesNotMatch(css, /isDemoAccount|isDemoMode|demoMode|setDemoMode/);
});
