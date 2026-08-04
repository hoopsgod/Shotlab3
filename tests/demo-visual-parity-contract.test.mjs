import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

const requiredSharedSurfaces = [
  'CoachPlayersInteractiveDashboard',
  'CoachEventsInteractiveDashboard',
  'CoachPageDashboardHeader',
  'PlayerDailyCommandCenter',
  'PlayerWorkspaceCommandBar',
  'MobileNavigation',
];

test('demo sessions use the shared production application tree', () => {
  assert.match(appSource, /const doDemo=async\(kind="player"\)=>/);
  assert.match(appSource, /kind==="coach"\?DEMO_COACH:DEMO_PLAYER/);
  assert.match(appSource, /setDemoMode\(true\)/);

  for (const component of requiredSharedSurfaces) {
    assert.match(appSource, new RegExp(`\\b${component}\\b`), `${component} must remain in the shared App tree`);
  }

  assert.doesNotMatch(
    appSource,
    /(?:DemoCoachApp|DemoPlayerApp|DemoCoachDashboard|DemoPlayerDashboard)/,
    'Demo users must not be routed to separate stale visual implementations',
  );
});

test('demo mode is limited to data and persistence behavior, not alternate page styling', () => {
  const demoModeStyleBranches = appSource.match(/isDemoMode\(\)[^\n]{0,120}(?:className|style=|stylesheet)/g) || [];
  assert.equal(
    demoModeStyleBranches.length,
    0,
    `Found demo-only visual branches: ${demoModeStyleBranches.join(' | ')}`,
  );

  assert.match(appSource, /import "\.\/styles\/PremiumWorkspace\.css";/);
  assert.match(appSource, /import "\.\/styles\/CoachInteractiveDashboard\.css";/);
});
