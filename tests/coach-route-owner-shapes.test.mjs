import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const dashboards = readFileSync(new URL('../src/components/CoachInteractiveDashboards.css', import.meta.url), 'utf8');
const finalAxis = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');

test('paid Coach mobile containment binds every real route-root shape', () => {
  assert.match(centering, /performance-workspace--coach > div:has\(> \.page\.pageShell\)/);
  assert.match(centering, /performance-workspace--coach > div:has\(> \.secondaryPageShell\)/);
  assert.match(centering, /performance-workspace--coach > div:has\(\[data-testid="coach-command-center-full"\]\)/);
});

test('secondary Coach title stages stay on the route rail with no breakout arithmetic', () => {
  assert.match(dashboards, /secondaryPageShell > \.teamIdentityTitleStageFrame,[\s\S]*width:\s*100%;[\s\S]*max-width:\s*100%;[\s\S]*margin-inline:\s*0;/);
  assert.doesNotMatch(dashboards, /width:\s*calc\(100% \+/);
  assert.doesNotMatch(dashboards, /margin-inline:\s*calc\(/);
  assert.match(finalAxis, /secondaryPageShell > \.teamIdentityTitleStageFrame,[\s\S]*width:\s*100% !important;[\s\S]*margin-inline:\s*0 !important/);
  assert.doesNotMatch(finalAxis, /calc\(100% - \(var\(--shotlab-mobile-content-rail/);
});
