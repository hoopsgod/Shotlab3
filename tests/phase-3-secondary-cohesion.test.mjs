import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('public/shotlab-phase3-secondary-cohesion.css', 'utf8');

test('Phase 3 secondary cohesion authority loads after the Phase 2 lock', () => {
  const phase2 = html.indexOf('id="shotlab-phase2-critical"');
  const phase3 = html.indexOf('id="shotlab-phase3-secondary-cohesion"');
  assert.ok(phase2 >= 0, 'Phase 2 critical stylesheet must remain mounted');
  assert.ok(phase3 > phase2, 'Phase 3 authority must load after Phase 2 critical styles');
  assert.match(html, /href="\/shotlab-phase3-secondary-cohesion\.css"/);
});

test('Phase 3 is scoped to high-value secondary destinations', () => {
  for (const selector of [
    'premium-leaderboards-hub',
    'player-career-history',
    'coach-players-interactive-dashboard',
    'coach-events-interactive-dashboard',
    'coach-drills-management',
  ]) {
    assert.match(css, new RegExp(selector));
  }
  assert.match(css, /color-scheme:light!important/);
  assert.match(css, /performance-workspace::before/);
  assert.match(css, /performance-workspace::after/);
  assert.match(css, /display:none!important/);
});

test('Player secondary identity chrome is compact without changing the shared component', () => {
  assert.match(css, /player-dashboard-identity-header/);
  assert.match(css, /\[class\*="tagline"\]/);
  assert.match(css, /\[class\*="mission"\]/);
  assert.match(css, /font-size:26px!important/);
  assert.match(css, /width:58px!important/);
  assert.match(css, /height:58px!important/);
});

test('Player secondary command and ranking surfaces use light native hierarchy', () => {
  assert.match(css, /\[data-testid\^="player-workspace-"\]/);
  assert.match(css, /\[data-metric-priority\]/);
  assert.match(css, /linear-gradient\(135deg,#fff 0%,#f8f9f2 100%\)/);
  assert.match(css, /\[data-testid="premium-leaderboards-hub"\]/);
  assert.match(css, /\[data-testid="compact-leaderboard-preview"\]/);
});

test('Phase 3 keeps mobile safety and accessibility behavior explicit', () => {
  assert.match(css, /env\(safe-area-inset-bottom,0px\)/);
  assert.match(css, /min-height:44px!important/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
