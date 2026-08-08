import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rendered = readFileSync('tests/e2e/phase-3n-player-profile-canvas-containment.spec.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('playwright.screenshots.config.mjs', 'utf8');

const requireMarker = (source, marker, message) => {
  assert.ok(source.includes(marker), message || `missing required Phase 3N marker: ${marker}`);
};

test('Phase 3N diagnostic measures the final Profile content boundary and its ancestor geometry', () => {
  for (const marker of [
    'player-profile-account-data',
    'player-profile-privacy',
    'Logout',
    'PHASE3N_PROFILE_GEOMETRY',
    '.performance-shell--player',
    '.performance-workspace',
    '.player-scroll-container',
    '.player-scroll-container > .screen-fade-in',
    'player-profile-workspace',
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
