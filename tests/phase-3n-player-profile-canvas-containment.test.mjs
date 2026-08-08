import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('public/shotlab-phase3n-player-profile-canvas-containment.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const rendered = readFileSync('tests/e2e/phase-3n-player-profile-canvas-containment.spec.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('playwright.screenshots.config.mjs', 'utf8');

const requireMarker = (source, marker, message) => {
  assert.ok(source.includes(marker), message || `missing required Phase 3N marker: ${marker}`);
};

test('Phase 3N authority loads after Phase 3M and stays scoped to mobile Player Profile', () => {
  const phase3m = html.indexOf('shotlab-phase3m-player-profile-account-hierarchy.css');
  const phase3n = html.indexOf('shotlab-phase3n-player-profile-canvas-containment.css');
  assert.ok(phase3m >= 0, 'accepted Phase 3M authority must remain loaded');
  assert.ok(phase3n > phase3m, 'Phase 3N authority must load after Phase 3M');
  requireMarker(css, 'data-workspace-tab="profile"');
  assert.equal(css.includes('data-workspace-tab="leaderboards"'), false);
  assert.equal(css.includes('data-workspace-tab="home"'), false);
});

test('Phase 3N removes duplicate Profile reserves and restores one minifier-safe structural spacer', () => {
  for (const marker of [
    '--phase3n-profile-dock-reserve:112px',
    '.performance-workspace',
    'padding-bottom:0!important',
    '.player-scroll-container',
    'scroll-padding-bottom:var(--phase3n-profile-dock-reserve)!important',
    '.player-scroll-container > .screen-fade-in::after',
    'height:var(--phase3n-profile-dock-reserve)!important',
    'min-height:var(--phase3n-profile-dock-reserve)!important',
    'pointer-events:none!important',
  ]) requireMarker(css, marker);
  assert.equal(css.includes('--phase3n-profile-dock-reserve:calc('), false, 'Profile reserve must remain minifier-safe');
});

test('rendered Phase 3N measures Profile geometry and enforces one bounded dock reserve', () => {
  for (const marker of [
    'player-profile-account-data',
    'player-profile-privacy',
    'Logout',
    'PHASE3N_PROFILE_GEOMETRY',
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

test('Phase 3N preserves one dock-safe final interaction and Account & data behavior', () => {
  for (const marker of [
    'PHASE3N_PROFILE_DOCK_CLEARANCE',
    'toBeGreaterThanOrEqual(8)',
    'Delete Account & Data',
    'toHaveAttribute("open", "")',
  ]) requireMarker(rendered, marker);
});

test('App Store workflow carries Phase 3N contract, rendered acceptance, and evidence package', () => {
  requireMarker(workflow, 'tests/phase-3n-player-profile-canvas-containment.test.mjs');
  requireMarker(workflow, 'tests/e2e/phase-3n-player-profile-canvas-containment.spec.mjs');
  requireMarker(workflow, 'shotlab-phase-3n-player-profile-canvas-containment-evidence');
  requireMarker(screenshots, 'phase-3n-player-profile-canvas-containment.spec.mjs');
});
