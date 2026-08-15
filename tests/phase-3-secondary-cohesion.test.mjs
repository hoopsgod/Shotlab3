import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('public/shotlab-phase3-secondary-cohesion.css', 'utf8');
const acceptanceCss = readFileSync('public/shotlab-phase3-secondary-acceptance.css', 'utf8');
const playerHeader = readFileSync('src/components/PlayerDashboardHeader.jsx', 'utf8');
const playerWorkspace = readFileSync('src/components/PlayerOperationalWorkspace.jsx', 'utf8');
const playerWorkspaceCss = readFileSync('src/components/PlayerOperationalWorkspace.module.css', 'utf8');

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

test('Player secondary identity is a compact but unmistakable athlete rail at the rendered owner', () => {
  assert.match(css, /player-dashboard-identity-header/);
  assert.match(playerHeader, /performance-shell--player\.is-mobile:not\(\[data-workspace-tab="home"\]\)/);
  assert.match(playerHeader, /data-identity-role=\"name\"\]\{[\s\S]*font-size:26px!important/);
  assert.match(playerHeader, /data-identity-role=\"brand-mark\"\]\{width:58px!important;height:58px!important/);
  assert.match(playerHeader, /:is\(\[data-identity-role=\"tagline\"\],\[data-identity-role=\"mission\"\]\)\{display:none!important\}/);
  assert.doesNotMatch(playerHeader, /performance-shell--player[^`]*font-size:(?:8|9|10)px!important/);
});

test('Player workspaces own their editorial command and evidence hierarchy', () => {
  assert.match(playerWorkspace, /data-page-hierarchy="editorial"/);
  assert.match(playerWorkspace, /data-layout-role="editorial-header"/);
  assert.match(playerWorkspace, /data-layout-role="supporting-evidence"/);
  assert.match(playerWorkspaceCss, /\.commandBar\{[\s\S]*?background:transparent/);
  assert.match(playerWorkspaceCss, /\.metrics\{[\s\S]*?border-block:1px solid/);
  assert.doesNotMatch(acceptanceCss, /\[class\*="commandBar"\]/);
  assert.doesNotMatch(acceptanceCss, /\[data-metric-priority/);
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
