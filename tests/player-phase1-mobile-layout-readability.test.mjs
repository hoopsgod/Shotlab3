import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workspace = await readFile(new URL('../src/components/PlayerOperationalWorkspace.module.css', import.meta.url), 'utf8');
const progress = await readFile(new URL('../src/components/PlayerProgressStory.module.css', import.meta.url), 'utf8');
const home = await readFile(new URL('../src/styles/CommandHierarchy2026.css', import.meta.url), 'utf8');
const component = await readFile(new URL('../src/components/PlayerOperationalWorkspace.jsx', import.meta.url), 'utf8');

const channel = (value) => { const v=value/255; return v<=.04045?v/12.92:((v+.055)/1.055)**2.4; };
const luminance = ([r,g,b]) => .2126*channel(r)+.7152*channel(g)+.0722*channel(b);
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const hex = (value) => [0,2,4].map((offset)=>Number.parseInt(value.slice(1+offset,3+offset),16));

test('Player Phase 1 uses existing Player authorities without a global overflow mask', () => {
  assert.doesNotMatch(component, /PlayerPhase1MobileReadability\.css/);
  assert.doesNotMatch(workspace, /html\s*\{|body\s*\{|overflow-x\s*:\s*hidden/i);
});

test('Player workspace metrics use readable floors and wrap meaningful copy', () => {
  assert.match(workspace, /\.metricLabel,\.metricDetail\{[\s\S]*overflow:visible[\s\S]*text-overflow:clip[\s\S]*white-space:normal[\s\S]*overflow-wrap:anywhere/);
  assert.match(workspace, /data-page-hierarchy="editorial"[\s\S]*\.metricLabel\s*\{[\s\S]*color:#5f6962[\s\S]*font-size:11px/);
  assert.match(workspace, /data-page-hierarchy="editorial"[\s\S]*\.metricDetail\s*\{[\s\S]*color:#59635d[\s\S]*font-size:12px/);
  for (const [foreground,background] of [['#5f6962','#f7f8f4'],['#59635d','#f7f8f4'],['#5f6962','#ffffff'],['#59635d','#ffffff']]) {
    assert.ok(contrast(hex(foreground),hex(background))>=4.5, `${foreground} must remain AA-safe on ${background}`);
  }
});

test('mobile Player filter rails and title support reflow inside the viewport', () => {
  assert.match(workspace, /@media\(max-width:760px\)[\s\S]*filterRail\[data-player-workspace-filter-rail="true"\]\{[^}]*flex-wrap:wrap[^}]*overflow-x:visible[^}]*scroll-snap-type:none/);
  assert.match(workspace, /filterRail\[data-player-workspace-filter-rail="true"\]\s*>\s*\.filterButton\{[^}]*white-space:normal/);
  assert.match(workspace, /teamIdentityTitleStage__identityLine\)\{margin-bottom:6px;font-size:10px\}/);
  assert.match(workspace, /teamIdentityTitleStage__summary\)\{[^}]*display:block[^}]*overflow:visible[^}]*-webkit-line-clamp:unset/);
});

test('Player Progress dark-surface labels are readable and AA-safe', () => {
  assert.match(progress, /heroTopline\s*>\s*span:first-child\s*\{\s*color:\s*#b8c4c8/);
  assert.match(progress, /targetPanelCopy\s*>\s*span\s*\{[^}]*#b8c4c8/);
  assert.match(progress, /metricStrip span\s*\{[^}]*#b8c4c8/);
  assert.match(progress, /metricStrip small\s*\{[^}]*#b8c4c8[^}]*font-size:\s*11px/);
  for (const background of ['#071820','#0b2633','#203945']) assert.ok(contrast(hex('#b8c4c8'),hex(background))>=4.5);
});

test('Player Home progress information wraps instead of ellipsizing', () => {
  assert.match(home, /playerProgressDisclosure\s*>\s*summary strong\s*\{[^}]*overflow:\s*visible[^}]*text-overflow:\s*clip[^}]*white-space:\s*normal/);
});
