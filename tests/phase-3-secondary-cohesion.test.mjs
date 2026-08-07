import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('public/shotlab-phase3-secondary-cohesion.css', 'utf8');
const acceptanceCss = readFileSync('public/shotlab-phase3-secondary-acceptance.css', 'utf8');

test('Phase 3 secondary authorities load after the Phase 2 lock in acceptance order', () => {
  const phase2 = html.indexOf('id="shotlab-phase2-critical"');
  const phase3 = html.indexOf('id="shotlab-phase3-secondary-cohesion"');
  const acceptance = html.indexOf('id="shotlab-phase3-secondary-acceptance"');
  assert.ok(phase2 >= 0, 'Phase 2 critical stylesheet must remain mounted');
  assert.ok(phase3 > phase2, 'Phase 3 cohesion authority must load after Phase 2 critical styles');
  assert.ok(acceptance > phase3, 'Rendered acceptance corrections must load last');
  assert.match(html, /href="\/shotlab-phase3-secondary-cohesion\.css"/);
  assert.match(html, /href="\/shotlab-phase3-secondary-acceptance\.css"/);
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

test('Rendered player workspace IDs receive light command and metric hierarchy', () => {
  assert.match(acceptanceCss, /player-leaderboards-workspace/);
  assert.match(acceptanceCss, /player-profile-workspace/);
  assert.match(acceptanceCss, /\[class\*="commandBar"\]/);
  assert.match(acceptanceCss, /\[data-metric-priority="primary"\]/);
  assert.match(acceptanceCss, /linear-gradient\(135deg,#fff 0%,#f8f9f2 100%\)/);
});

test('Rendered Coach Events and Drills canvases cannot fall back to legacy black', () => {
  assert.match(acceptanceCss, /coach-events-mobile-page/);
  assert.match(acceptanceCss, /#coach-events-management/);
  assert.match(acceptanceCss, /#coach-drills-management/);
  assert.match(acceptanceCss, /background:var\(--p3-canvas\)!important/);
  assert.match(acceptanceCss, /article\{/);
  assert.match(acceptanceCss, /background:var\(--p3-surface-soft\)!important/);
});

test('Phase 3 keeps mobile safety and accessibility behavior explicit', () => {
  const combined = `${css}\n${acceptanceCss}`;
  assert.match(combined, /env\(safe-area-inset-bottom,0px\)/);
  assert.match(combined, /min-height:44px!important/);
  assert.match(combined, /@media\(max-width:700px\)/);
  assert.match(combined, /@media\(prefers-reduced-motion:reduce\)/);
});
