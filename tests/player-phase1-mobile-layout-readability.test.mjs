import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workspace = await readFile(new URL('../src/components/PlayerOperationalWorkspace.module.css', import.meta.url), 'utf8');
const hierarchy = await readFile(new URL('../src/components/PlayerMetricHierarchy.module.css', import.meta.url), 'utf8');
const progress = await readFile(new URL('../src/components/PlayerProgressStory.module.css', import.meta.url), 'utf8');
const home = await readFile(new URL('../src/styles/CommandHierarchy2026.css', import.meta.url), 'utf8');
const component = await readFile(new URL('../src/components/PlayerOperationalWorkspace.jsx', import.meta.url), 'utf8');

const channel = (value) => { const v=value/255; return v<=.04045?v/12.92:((v+.055)/1.055)**2.4; };
const luminance = ([r,g,b]) => .2126*channel(r)+.7152*channel(g)+.0722*channel(b);
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const hex = (value) => [0,2,4].map((offset)=>Number.parseInt(value.slice(1+offset,3+offset),16));

test('Player Phase 1 uses existing Player authorities without a global overflow mask', () => {
  assert.doesNotMatch(component, /PlayerPhase1MobileReadability\.css/);
  assert.doesNotMatch(workspace, /overflow-x\s*:\s*hidden/i);
});

test('Player workspace metrics keep readable floors and wrap meaningful copy', () => {
  assert.match(workspace, /\.metricLabel,\.metricDetail\{[^}]*overflow:visible[^}]*text-overflow:clip[^}]*white-space:normal[^}]*overflow-wrap:anywhere/);
  assert.match(workspace, /\.metricLabel\{font-size:11px/);
  assert.match(workspace, /\.metricDetail\{[^}]*font-size:12px/);
  assert.match(hierarchy, /@media\(max-width:700px\)[\s\S]*\.metricSupporting>span:first-child\{[^}]*color:#5f6962!important[^}]*font-size:11px!important/);
  assert.match(hierarchy, /@media\(max-width:700px\)[\s\S]*\.metricSupporting>span:last-child\{[^}]*color:#59635d!important[^}]*font-size:12px!important/);
  for (const [foreground,background] of [['#5f6962','#f7f8f4'],['#59635d','#f7f8f4'],['#5f6962','#ffffff'],['#59635d','#ffffff']]) {
    assert.ok(contrast(hex(foreground),hex(background))>=4.5, `${foreground} must remain AA-safe on ${background}`);
  }
});

test('mobile Player secondary pages retain editorial scoreboard and return-control authority', () => {
  assert.match(workspace, /shared-dashboard-back-action\)\{[^}]*width:auto!important[^}]*min-height:48px!important[^}]*border:0!important[^}]*background:transparent!important/);
  assert.match(workspace, /data-team-workspace[^\n]*at-home[^\n]*program[^\n]*\.metrics\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important;background:transparent!important/);
  assert.match(workspace, /data-metric-priority="primary"\]\{grid-column:1\/-1!important/);
  assert.match(workspace, /data-metric-priority="supporting"[^\n]*data-metric-role="value"[^\n]*color:#172019!important/);
});

test('mobile Player filter rails and title support reflow inside the viewport', () => {
  assert.match(workspace, /\.filterButton\{[^}]*min-height:48px[^}]*white-space:normal/);
  assert.match(workspace, /@media\(max-width:760px\)[\s\S]*\.filterRail\{[^}]*flex-wrap:wrap[^}]*overflow-x:visible[^}]*scroll-snap-type:none/);
  assert.match(workspace, /teamIdentityTitleStage__identityLine\)\{margin-bottom:6px;font-size:10px\}/);
  assert.match(workspace, /teamIdentityTitleStage__summary\)\{[^}]*display:block[^}]*overflow:visible[^}]*-webkit-line-clamp:unset/);
});

test('Player Progress dark-surface labels remain high-contrast', () => {
  assert.match(progress, /heroTopline>span:first-child\{color:#aebbb1\}/);
  assert.match(progress, /targetPanelCopy>span\{display:block;color:#aebbb1\}/);
  assert.match(progress, /metricStrip :global\(\[data-performance-kind\]\) span,[^\n]*color:#aebbb1!important/);
  for (const background of ['#071820','#0b2633','#203945']) assert.ok(contrast(hex('#aebbb1'),hex(background))>=4.5);
});

test('Player Home progress information wraps instead of ellipsizing', () => {
  assert.match(home, /playerProgressDisclosure\s*>\s*summary strong\s*\{[^}]*overflow:\s*visible[^}]*text-overflow:\s*clip[^}]*white-space:\s*normal/);
});
