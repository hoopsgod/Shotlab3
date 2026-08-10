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
  assert.match(source, /className=\{styles\.emptyState\} data-phase2-empty-state/);
  assert.match(pkg.scripts.dev, /apply-phase2d-premium-empty-state-language\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase2d-premium-empty-state-language\.mjs/);
});

test('Phase 2D uses a quiet premium state lane instead of the legacy dashed placeholder card', () => {
  const css = read('src/components/Phase2PremiumEmptyStateLanguage.css');

  assert.match(css, /\[data-phase2-empty-state\]/);
  assert.match(css, /grid-template-columns:\s*38px minmax\(0, 1fr\)/);
  assert.match(css, /border-block:\s*1px solid/);
  assert.match(css, /border-radius:\s*0 !important/);
  assert.match(css, /text-align:\s*left !important/);
  assert.match(css, /mask:\s*url\(/);
  assert.match(css, /coach-leaderboard-operational-panel/);
  assert.match(css, /coach-player-intelligence-drawer/);
  assert.match(css, /coach-event-intelligence-drawer/);
  assert.doesNotMatch(css, /border:\s*1px dashed/);
  assert.doesNotMatch(css, /isDemoAccount|isDemoMode|demoMode|setDemoMode/);
});
