import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3m-player-profile-account-hierarchy.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3m-player-profile-account-hierarchy.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
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

test('Phase 3M presentation authority loads last and keeps Account & data readable on the light Profile canvas', () => {
  const phase3l = html.indexOf('shotlab-phase3l-player-leaderboards-containment.css');
  const phase3m = html.indexOf('shotlab-phase3m-player-profile-account-hierarchy.css');
  assert.ok(phase3l >= 0, 'accepted Phase 3L authority must remain loaded');
  assert.ok(phase3m > phase3l, 'Phase 3M authority must load after Phase 3L');
  for (const marker of [
    '[data-testid="player-profile-account-data"]',
    'background:var(--p3m-surface)!important',
    'color:var(--p3m-ink)!important',
    'color:var(--p3m-muted)!important',
    'background:var(--p3m-soft)!important',
    ':focus-visible',
    '@media(prefers-reduced-motion:reduce)',
  ]) requireMarker(css, marker);
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
    'PHASE3M_ACCOUNT_PRESENTATION',
    'rgb(255, 255, 255)',
    'rgb(23, 28, 24)',
    'rgb(104, 113, 106)',
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
