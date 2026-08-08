import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3m-player-profile-account-hierarchy.mjs', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const rendered = readFileSync('tests/e2e/phase-3m-player-profile-account-hierarchy.spec.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

const requireMarker = (source, marker, message) => {
  assert.ok(source.includes(marker), message || `missing required Phase 3M marker: ${marker}`);
};

test('Phase 3M enhancer is guarded and runs after the established Profile transform', () => {
  requireMarker(enhancer, 'function ProfilePage(');
  requireMarker(enhancer, 'testId="player-profile-account-data"');
  requireMarker(enhancer, 'data-testid="player-profile-privacy"');
  requireMarker(enhancer, '<LegalSupportLinks compact/>');
  requireMarker(enhancer, '<AccountTrustActions deleteAccount={deleteAccount}/>');
  const dev = pkg.scripts.dev;
  const build = pkg.scripts['prepare:route-enhancers'];
  for (const script of [dev, build]) {
    const phase3f = script.indexOf('apply-phase3f-profile-intelligence.mjs');
    const phase3m = script.indexOf('apply-phase3m-player-profile-account-hierarchy.mjs');
    assert.ok(phase3f >= 0, 'Phase 3F Profile transform must remain in the route enhancer chain');
    assert.ok(phase3m > phase3f, 'Phase 3M must run after Phase 3F Profile transformation');
  }
});

test('Phase 3M keeps leaderboard privacy visible and preserves all account capabilities behind disclosure', () => {
  for (const marker of [
    'Hide me from leaderboards',
    'Account & data',
    'Privacy resources, support, data requests, and account controls',
    '>LEGAL & SUPPORT</div>',
    '<LegalSupportLinks compact/>',
    '<AccountTrustActions deleteAccount={deleteAccount}/>',
    'Delete Account & Data',
    'REQUEST DATA',
  ]) requireMarker(enhancer, marker);
});

test('rendered Phase 3M acceptance proves compact default hierarchy and recoverable account controls', () => {
  for (const marker of [
    'player-profile-privacy',
    'player-profile-account-data',
    'Hide me from leaderboards',
    'Account & data',
    'account-data-request-entry',
    'Delete Account & Data',
    'Privacy',
    'Terms',
    'Support',
    'Delete Account',
    'Data Request',
    'PHASE3M_PROFILE_HEIGHTS',
    'toBeLessThanOrEqual(2350)',
    'toBeGreaterThanOrEqual(240)',
    '03e-player-profile-account-data-expanded.png',
  ]) requireMarker(rendered, marker);
});

test('App Store workflow carries Phase 3M source/browser acceptance and evidence', () => {
  requireMarker(workflow, 'tests/phase-3m-player-profile-account-hierarchy.test.mjs');
  requireMarker(workflow, 'tests/e2e/phase-3m-player-profile-account-hierarchy.spec.mjs');
  requireMarker(workflow, 'shotlab-phase-3m-player-profile-account-hierarchy-evidence');
});
