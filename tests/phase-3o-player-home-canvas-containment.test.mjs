import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('public/shotlab-phase3o-player-home-canvas-containment.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const rendered = readFileSync('tests/e2e/phase-3o-player-home-canvas-containment.spec.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('playwright.screenshots.config.mjs', 'utf8');

const requireMarker = (source, marker, message) => {
  assert.ok(source.includes(marker), message || `missing required Phase 3O marker: ${marker}`);
};

test('Phase 3O authority loads after Phase 3N and stays scoped to mobile Player Home', () => {
  const phase3n = html.indexOf('shotlab-phase3n-player-profile-canvas-containment.css');
  const phase3o = html.indexOf('shotlab-phase3o-player-home-canvas-containment.css');
  assert.ok(phase3n >= 0, 'accepted Phase 3N authority must remain loaded');
  assert.ok(phase3o > phase3n, 'Phase 3O authority must load after Phase 3N');
  requireMarker(css, 'data-workspace-tab="home"');
  assert.equal(css.includes('data-workspace-tab="profile"'), false);
  assert.equal(css.includes('data-workspace-tab="leaderboards"'), false);
});

test('Phase 3O replaces the measured 104 + 128 + 24 Home tail with one minifier-safe structural reserve', () => {
  for (const marker of [
    '--phase3o-home-dock-reserve:112px',
    '.performance-workspace',
    'padding-bottom:0!important',
    '.player-scroll-container',
    'scroll-padding-bottom:var(--phase3o-home-dock-reserve)!important',
    '.player-home-compact-dashboard',
    'margin-bottom:0!important',
    '.player-scroll-container > .screen-fade-in::after',
    'height:var(--phase3o-home-dock-reserve)!important',
    'min-height:var(--phase3o-home-dock-reserve)!important',
    'pointer-events:none!important',
  ]) requireMarker(css, marker);
  assert.equal(css.includes('--phase3o-home-dock-reserve:calc('), false, 'Home reserve must remain minifier-safe');
});

test('rendered Phase 3O protects Home hierarchy and enforces one bounded dock reserve', () => {
  for (const marker of [
    'player-daily-command-center',
    'player-upcoming-schedule',
    'player-team-standings',
    'player-coach-guidance',
    'player-secondary-intelligence',
    'Logout',
    'PHASE3O_HOME_GEOMETRY',
    'layout.reserve',
    'layout.spacerHeight',
    'toBe("112px")',
    'toBeGreaterThanOrEqual(96)',
    'layout.tail',
    'toBeLessThanOrEqual(220)',
    'layout.overflow',
    'toBeLessThanOrEqual(1)',
  ]) requireMarker(rendered, marker);
});

test('Phase 3O preserves all supporting disclosures and actual More progress expanded actions', () => {
  for (const marker of [
    'PHASE3O_HOME_DOCK_CLEARANCE',
    'toBeGreaterThanOrEqual(8)',
    'toHaveAttribute("open", "")',
    'Team Rank',
    'View Program',
    'Events',
    'Progress',
  ]) requireMarker(rendered, marker);
  assert.equal(rendered.includes('player-daily-momentum-signal'), false, 'Phase 3O must not treat command-center momentum as More progress content');
});

test('App Store workflow carries Phase 3O contract, rendered acceptance, and evidence package', () => {
  requireMarker(workflow, 'tests/phase-3o-player-home-canvas-containment.test.mjs');
  requireMarker(workflow, 'tests/e2e/phase-3o-player-home-canvas-containment.spec.mjs');
  requireMarker(workflow, 'shotlab-phase-3o-player-home-canvas-containment-evidence');
  requireMarker(screenshots, 'phase-3o-player-home-canvas-containment.spec.mjs');
});
