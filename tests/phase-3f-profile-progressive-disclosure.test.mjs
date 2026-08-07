import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/App.jsx', 'utf8');
const index = readFileSync('index.html', 'utf8');
const css = readFileSync('public/shotlab-phase3f-profile-disclosure.css', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

test('Phase 3F authority loads after the accepted Phase 3E Profile hierarchy', () => {
  const phase3e = index.indexOf('shotlab-phase3e-profile-hierarchy');
  const phase3f = index.indexOf('shotlab-phase3f-profile-disclosure');
  assert.ok(phase3e >= 0, 'Phase 3E hierarchy must remain loaded');
  assert.ok(phase3f > phase3e, 'Phase 3F disclosure authority must load after Phase 3E');
});

test('Player Profile keeps a concise decision readout visible before deep performance evidence', () => {
  assert.match(app, /data-testid="player-profile-readout"/);
  assert.match(app, />PERFORMANCE READOUT<\/div>/);
  assert.match(app, /Momentum is \$\{interpretedTrends\.momentum\}/);
  assert.match(app, /Strongest:<\/strong> \{interpretedTrends\.strongestDrill\}/);
  assert.match(app, /Focus:<\/strong> \{interpretedTrends\.weakArea\}/);
  assert.ok(app.indexOf('PLAYER PROGRESS PROFILE') < app.indexOf('data-testid="player-profile-readout"'));
});

test('Full trends totals and analytics are preserved behind Performance details', () => {
  const start = app.indexOf('testId="player-profile-performance-details"');
  const end = app.indexOf('testId="player-profile-drill-development"');
  assert.ok(start >= 0 && end > start, 'Performance details must precede Drill development');
  const block = app.slice(start, end);
  assert.match(block, /INTERPRETED PERFORMANCE TRENDS/);
  assert.match(block, /At Home Drill Makes/);
  assert.match(block, /Program Drill Makes/);
  assert.match(block, /Shot Tracker Makes/);
  assert.match(block, /Best Streak/);
  assert.match(block, /data-testid="player-profile-analytics"/);
  assert.match(block, /<ShotLabCharts scores=\{scores\} drills=\{drills\} programDrills=\{programDrills\} user=\{u\} \/>/);
});

test('Drill PBs trends and sparklines remain behind Drill development', () => {
  const start = app.indexOf('testId="player-profile-drill-development"');
  const end = app.indexOf('>PRIVACY</div>', start);
  assert.ok(start >= 0 && end > start, 'Drill development must remain before Privacy');
  const block = app.slice(start, end);
  assert.match(block, /DRILL BREAKDOWN/);
  assert.match(block, /drillStats\.map/);
  assert.match(block, />PB<\/div>/);
  assert.match(block, />AVG<\/div>/);
  assert.match(block, />LOGGED<\/div>/);
  assert.match(block, /<Sparkline data=\{d\.last10\}/);
});

test('Privacy support and account actions stay outside deep Profile disclosures', () => {
  const drillEnd = app.indexOf('</ProgressiveDisclosure>', app.indexOf('testId="player-profile-drill-development"'));
  const privacy = app.indexOf('>PRIVACY</div>', drillEnd);
  const support = app.indexOf('>LEGAL & SUPPORT</div>', privacy);
  const account = app.indexOf('<AccountTrustActions deleteAccount={deleteAccount}/>', support);
  assert.ok(drillEnd >= 0 && privacy > drillEnd && support > privacy && account > support);
});

test('Phase 3F disclosure surfaces are light native touch targets with reduced-motion support', () => {
  assert.match(css, /\[data-testid="player-profile-readout"\]/);
  assert.match(css, /\[data-testid="player-profile-performance-details"\]/);
  assert.match(css, /\[data-testid="player-profile-drill-development"\]/);
  assert.match(css, /min-height:62px!important/);
  assert.match(css, /touch-action:manipulation!important/);
  assert.match(css, /summary:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css, /--p3f-surface:#ffffff/);
});

test('App Store presentation workflow includes Phase 3F contract and evidence lineage', () => {
  assert.match(workflow, /agent\/phase-3e-profile-information-hierarchy/);
  assert.match(workflow, /phase-3f-profile-progressive-disclosure\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3f-profile-disclosure-evidence/);
});
