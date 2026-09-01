import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const runtimeGuard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');

const compactCentering = centering.replace(/\s+/g, '');

test('Phase 2 keeps generic mobile containment in CSS and dynamic Coach route ownership in runtime', () => {
  for (const selector of [
    '.app-shell.is-mobile',
    '.app-shell.is-mobile>.shell-main',
    '.app-shell.is-mobile>.shell-main>.content-wrap',
    '.app-shell.is-mobile .performance-workspace',
    '.app-shell.is-mobile [data-testid="coach-command-center-full"]',
    '.app-shell.is-mobile [data-testid="player-daily-command-center"]',
  ]) {
    assert.ok(compactCentering.includes(selector), `generic mobile containment missing ${selector}`);
  }

  assert.doesNotMatch(
    compactCentering,
    /\.performance-workspace--coach>div:has\(/,
    'shared centering CSS must not rediscover the dynamic Coach route owner',
  );

  assert.match(runtimeGuard, /function findCoachRouteOwner\(\)/);
  assert.match(runtimeGuard, /Array\.from\(workspace\.children\)/);
  assert.match(runtimeGuard, /routeOwner\.classList\.add\('coach-route-scroll-container'\)/);
  assert.match(runtimeGuard, /width:\s*'100%'/);
  assert.match(runtimeGuard, /minWidth:\s*'0'/);
  assert.match(runtimeGuard, /maxWidth:\s*'100%'/);
  assert.match(runtimeGuard, /overflowX:\s*'clip'/);
});
