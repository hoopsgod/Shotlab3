import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('public/shotlab-phase3l-player-leaderboards-containment.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
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
  for (const marker of [
    '.performance-shell--player.is-mobile[data-workspace-tab="leaderboards"] .performance-workspace',
    'min-height:0!important',
    'padding-bottom:0!important',
    '.performance-shell--player.is-mobile[data-workspace-tab="leaderboards"] .player-scroll-container',
    'padding-bottom:calc(var(--bottom-nav-content-padding,88px) + 8px)!important',
    'scroll-padding-bottom:calc(var(--bottom-nav-content-padding,88px) + 8px)!important',
    '.player-scroll-container > .screen-fade-in',
    '[data-testid="premium-leaderboards-hub"]',
  ]) requireMarker(css, marker);
});

test('rendered Phase 3L acceptance protects Logout, ranking controls, overflow, and hard tail budget', () => {
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
  requireMarker(workflow, 'shotlab-phase-3l-player-leaderboards-containment-evidence');
});
