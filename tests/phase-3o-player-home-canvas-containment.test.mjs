import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rendered = readFileSync('tests/e2e/phase-3o-player-home-canvas-containment.spec.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('playwright.screenshots.config.mjs', 'utf8');

const requireMarker = (source, marker, message) => {
  assert.ok(source.includes(marker), message || `missing required Phase 3O marker: ${marker}`);
};

test('Phase 3O diagnostic measures the final Player Home boundary and ancestor geometry', () => {
  for (const marker of [
    'player-daily-command-center',
    'player-upcoming-schedule',
    'player-team-standings',
    'player-coach-guidance',
    'player-secondary-intelligence',
    'Logout',
    'PHASE3O_HOME_GEOMETRY',
    '.performance-workspace',
    '.player-scroll-container',
    '.player-scroll-container > .screen-fade-in',
    '.player-home-compact-dashboard',
    'layout.tail',
    'toBeLessThanOrEqual(220)',
    'layout.overflow',
    'toBeLessThanOrEqual(1)',
  ]) requireMarker(rendered, marker);
});

test('Phase 3O protects all supporting disclosures and final dock-safe interaction', () => {
  for (const marker of [
    'PHASE3O_HOME_DOCK_CLEARANCE',
    'toBeGreaterThanOrEqual(8)',
    'toHaveAttribute("open", "")',
    'player-daily-momentum-signal',
  ]) requireMarker(rendered, marker);
});

test('App Store workflow carries Phase 3O contract, rendered acceptance, and evidence package', () => {
  requireMarker(workflow, 'tests/phase-3o-player-home-canvas-containment.test.mjs');
  requireMarker(workflow, 'tests/e2e/phase-3o-player-home-canvas-containment.spec.mjs');
  requireMarker(workflow, 'shotlab-phase-3o-player-home-canvas-containment-evidence');
  requireMarker(screenshots, 'phase-3o-player-home-canvas-containment.spec.mjs');
});
