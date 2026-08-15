import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const TARGET = 'src/components/CoachDashboardPhase2.jsx';
const read = (path) => readFileSync(path, 'utf8');

test('Phase 2D enhancer is a one-way semantic migration and tolerates downstream normalization', () => {
  const original = read(TARGET);

  try {
    execFileSync(process.execPath, ['scripts/apply-phase2d-premium-empty-state-language.mjs'], { stdio: 'pipe' });

    const enhanced = read(TARGET);
    assert.match(enhanced, /label="Filtered activity" kind="filter"/);
    assert.match(enhanced, /No team activity matches the selected view\./);

    // Simulate the real build -> Playwright webServer lifecycle: later route
    // enhancers are allowed to replace the Phase 2D activity presentation while
    // preserving the shared semantic EmptyState component and stylesheet lane.
    const downstreamNormalized = enhanced
      .replace('label="Filtered activity" kind="filter"', 'data-phase3-activity-placeholder="true"')
      .replace('No team activity matches the selected view.', 'Activity feed normalized downstream.');
    assert.notEqual(downstreamNormalized, enhanced);
    writeFileSync(TARGET, downstreamNormalized);

    execFileSync(process.execPath, ['scripts/apply-phase2d-premium-empty-state-language.mjs'], { stdio: 'pipe' });

    const source = read(TARGET);
    const pkg = JSON.parse(read('package.json'));

    assert.match(source, /import "\.\/Phase2PremiumEmptyStateLanguage\.css";/);
    assert.match(source, /data-phase2-empty-state data-phase2-empty-tone=\{tone\} data-phase2-empty-kind=\{kind\}/);
    assert.match(source, /phase2-empty-state-label/);
    assert.match(source, /phase2-empty-state-message/);
    assert.match(pkg.scripts.dev, /apply-phase2d-premium-empty-state-language\.mjs/);
    assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase2d-premium-empty-state-language\.mjs/);

    assert.match(source, /New roster profile · Awaiting first logged session/);
    assert.doesNotMatch(source, /lastActivityDate \|\| "No activity recorded"/);
    assert.match(source, /label="Activity status" kind="activity"/);
    assert.match(source, /No player activity recorded yet\./);
    assert.match(source, /label="Response status" kind="attendance"/);
    assert.match(source, /label="Follow-up cleared" tone="positive" kind="complete"/);
    assert.match(source, /label="Filtered view" kind="filter"/);
    assert.match(source, /label="Season history" kind="history"/);

    // The second pass must preserve the downstream state rather than attempting
    // to reconstruct Phase 2D's original activity JSX and crashing CI.
    assert.match(source, /data-phase3-activity-placeholder="true"/);
    assert.match(source, /Activity feed normalized downstream\./);
    assert.doesNotMatch(source, /No team activity matches the selected view\./);
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
  assert.match(css, /coach-page-dashboard-leaderboards-evidence/);
  assert.match(css, /\[data-testid="coach-page-dashboard-leaderboards-evidence"\] article button/);
  assert.match(css, /-webkit-text-fill-color:\s*#33402f !important/);
  assert.match(css, /#f7f8f2 !important/);
  assert.match(css, /#26302a !important/);
  assert.match(css, /#33402f !important/);
  assert.doesNotMatch(css, /border:\s*1px dashed/);
  assert.doesNotMatch(css, /isDemoAccount|isDemoMode|demoMode|setDemoMode/);
});
