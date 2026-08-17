import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const mainSource = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const dashboardSource = fs.readFileSync(new URL('../src/components/CoachInteractiveDashboards.jsx', import.meta.url), 'utf8');
const eventsCss = fs.readFileSync(new URL('../src/components/CoachEventsPremium.css', import.meta.url), 'utf8');

test('Coach Events premium stylesheet is loaded after the authenticated visual authority', () => {
  const authorityImport = "await import('./styles/AuthenticatedVisualAuthority2026.css')";
  const eventsImport = "await import('./components/CoachEventsPremium.css')";
  const authorityIndex = mainSource.indexOf(authorityImport);
  const eventsIndex = mainSource.indexOf(eventsImport);

  assert.notEqual(authorityIndex, -1, 'authenticated visual authority import is missing');
  assert.notEqual(eventsIndex, -1, 'Coach Events premium stylesheet import is missing');
  assert.ok(eventsIndex > authorityIndex, 'Coach Events page-specific styles must load after the shared authenticated authority');
});

test('Coach Events premium workspace remains connected to its page-specific selectors', () => {
  assert.match(dashboardSource, /className="coachEventsPremiumWorkspace"/);
  assert.match(eventsCss, /\.coachEventsPremiumWorkspace\s*\{/);
  assert.match(eventsCss, /\[data-testid="coach-events-decision-brief"\]/);
  assert.match(eventsCss, /\[data-testid="coach-events-mobile-page"\]/);
});
