import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('public/shotlab-phase3l-player-leaderboards-containment.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');
const rendered = readFileSync('tests/e2e/phase-3l-player-leaderboards-containment.spec.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

test('Phase 3L loads after accepted Phase 3K and remains Leaderboards-only', () => {
  assert.match(html, /shotlab-phase3k-coach-strength-hierarchy\.css[\s\S]*shotlab-phase3l-player-leaderboards-containment\.css/);
  assert.match(css, /data-workspace-tab="leaderboards"/);
  assert.doesNotMatch(css, /data-workspace-tab="home"/);
  assert.doesNotMatch(css, /data-workspace-tab="profile"/);
});

test('Leaderboards removes the duplicate outer dock reserve while retaining one safe content reserve', () => {
  assert.match(css, /\.performance-workspace\{[\s\S]*min-height:0!important[\s\S]*padding-bottom:0!important/);
  assert.match(css, /\.player-scroll-container\{[\s\S]*padding-bottom:calc\(var\(--bottom-nav-content-padding,88px\) \+ 8px\)!important/);
  assert.match(css, /scroll-padding-bottom:calc\(var\(--bottom-nav-content-padding,88px\) \+ 8px\)!important/);
  assert.match(css, /\.player-scroll-container > \.screen-fade-in\{[\s\S]*min-height:0!important/);
});

test('Player shell still carries the global dock-safe padding contract and visible Logout behavior', () => {
  assert.match(app, /--player-scroll-bottom-padding:calc\(var\(--bottom-nav-content-padding, 88px\) \+ 24px \+ env\(safe-area-inset-bottom, 0px\)\)/);
  assert.match(app, /aria-label="Logout"/);
  assert.match(app, /tab==="leaderboards"/);
  assert.match(app, /<PremiumLeaderboardsHub/);
});

test('rendered Phase 3L acceptance protects ranking controls and caps the empty tail', () => {
  assert.match(rendered, /premium-leaderboards-hub/);
  assert.match(rendered, /Current \/ Offseason/);
  assert.match(rendered, /All-Time/);
  assert.match(rendered, /At-Home Shots/);
  assert.match(rendered, /Program Drills/);
  assert.match(rendered, /PARTICIPATION CATEGORIES/);
  assert.match(rendered, /Logout/);
  assert.match(rendered, /layout\.tail[\s\S]*toBeLessThanOrEqual\(220\)/);
  assert.match(rendered, /layout\.overflow[\s\S]*toBeLessThanOrEqual\(1\)/);
});

test('App Store workflow carries Phase 3L contract, browser acceptance, and evidence package', () => {
  assert.match(workflow, /tests\/phase-3l-player-leaderboards-containment\.test\.mjs/);
  assert.match(workflow, /tests\/e2e\/phase-3l-player-leaderboards-containment\.spec\.mjs/);
  assert.match(workflow, /shotlab-phase-3l-player-leaderboards-containment-evidence/);
});
