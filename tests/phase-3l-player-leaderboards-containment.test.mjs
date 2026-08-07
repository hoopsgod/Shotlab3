import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('public/shotlab-phase3l-player-leaderboards-containment.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');
const rendered = readFileSync('tests/e2e/phase-3l-player-leaderboards-containment.spec.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

const requireMarker = (source, marker, message) => {
  assert.ok(source.includes(marker), message || `missing required Phase 3L marker: ${marker}`);
};

test('Phase 3L loads after accepted Phase 3K and remains Leaderboards-only', () => {
  const phase3k = html.indexOf('shotlab-phase3k-coach-strength-hierarchy.css');
  const phase3l = html.indexOf('shotlab-phase3l-player-leaderboards-containment.css');
  assert.ok(phase3k >= 0, 'Phase 3K authority must remain loaded');
  assert.ok(phase3l > phase3k, 'Phase 3L authority must load after Phase 3K');
  requireMarker(css, 'data-workspace-tab="leaderboards"');
  assert.equal(css.includes('data-workspace-tab="home"'), false);
  assert.equal(css.includes('data-workspace-tab="profile"'), false);
});

test('Leaderboards removes duplicate outer reserve while retaining one safe dock reserve', () => {
  requireMarker(css, '.performance-shell--player.is-mobile[data-workspace-tab="leaderboards"] .performance-workspace');
  requireMarker(css, 'min-height:0!important');
  requireMarker(css, 'padding-bottom:0!important');
  requireMarker(css, '.performance-shell--player.is-mobile[data-workspace-tab="leaderboards"] .player-scroll-container');
  requireMarker(css, 'padding-bottom:calc(var(--bottom-nav-content-padding,88px) + 8px)!important');
  requireMarker(css, 'scroll-padding-bottom:calc(var(--bottom-nav-content-padding,88px) + 8px)!important');
  requireMarker(css, '.player-scroll-container > .screen-fade-in');
  requireMarker(css, '[data-testid="premium-leaderboards-hub"]');
});

test('Player shell keeps the global dock-safe contract and visible Logout behavior', () => {
  requireMarker(app, '--player-scroll-bottom-padding:calc(var(--bottom-nav-content-padding, 88px) + 24px + env(safe-area-inset-bottom, 0px))');
  requireMarker(app, 'aria-label="Logout"');
  requireMarker(app, 'tab==="leaderboards"');
  requireMarker(app, '<PremiumLeaderboardsHub');
});

test('rendered Phase 3L acceptance protects ranking controls and the hard empty-tail budget', () => {
  for (const marker of [
    'premium-leaderboards-hub',
    'Current / Offseason',
    'All-Time',
    'At-Home Shots',
    'Program Drills',
    'PARTICIPATION CATEGORIES',
    'Logout',
    'PHASE3L_GEOMETRY',
    'layout.tail',
    'toBeLessThanOrEqual(220)',
    'layout.overflow',
    'toBeLessThanOrEqual(1)',
  ]) requireMarker(rendered, marker);
});

test('App Store workflow carries Phase 3L source/browser acceptance and evidence', () => {
  requireMarker(workflow, 'tests/phase-3l-player-leaderboards-containment.test.mjs');
  requireMarker(workflow, 'tests/e2e/phase-3l-player-leaderboards-containment.spec.mjs');
  requireMarker(workflow, 'shotlab-phase-3k-coach-strength-hierarchy-evidence');
  requireMarker(workflow, 'shotlab-phase-3l-player-leaderboards-containment-evidence');
});
