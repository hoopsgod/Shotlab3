import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const dashboards = readFileSync(new URL('../src/components/CoachInteractiveDashboards.css', import.meta.url), 'utf8');

test('paid Coach mobile containment binds every real route-root shape', () => {
  assert.match(centering, /performance-workspace--coach > div:has\(> \.page\.pageShell\)/);
  assert.match(centering, /performance-workspace--coach > div:has\(> \.secondaryPageShell\)/);
  assert.match(centering, /performance-workspace--coach > div:has\(\[data-testid="coach-command-center-full"\]\)/);
});

test('Events does not revive the stale 100%-plus-margin title width override', () => {
  assert.doesNotMatch(dashboards, /coachEventsPremiumWorkspace > \.teamIdentityTitleStageFrame > \.teamIdentityTitleStage[\s\S]*width:\s*100%\s*!important/);
});
