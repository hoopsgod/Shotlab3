import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const authority = await readFile(new URL('../src/styles/PlayerPhase1MobileReadability.css', import.meta.url), 'utf8');
const workspace = await readFile(new URL('../src/components/PlayerOperationalWorkspace.jsx', import.meta.url), 'utf8');

const channel = (value) => {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
const hex = (value) => {
  const match = String(value).match(/^#([0-9a-f]{6})$/i);
  assert.ok(match, `expected six-digit hex color, received ${value}`);
  return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16));
};
const declaration = (selectorFragment, property) => {
  const selectorIndex = authority.indexOf(selectorFragment);
  assert.notEqual(selectorIndex, -1, `missing selector ${selectorFragment}`);
  const open = authority.indexOf('{', selectorIndex);
  const close = authority.indexOf('}', open);
  const block = authority.slice(open + 1, close);
  const match = block.match(new RegExp(`${property.replace('-', '\\-')}\\s*:\\s*([^;]+)`));
  assert.ok(match, `missing ${property} in ${selectorFragment}`);
  return match[1].trim();
};

test('Player Phase 1 authority is loaded after workspace modules and remains Player-scoped', () => {
  const moduleImport = workspace.indexOf('PlayerMetricHierarchy.module.css');
  const phaseImport = workspace.indexOf('PlayerPhase1MobileReadability.css');
  assert.ok(moduleImport >= 0 && phaseImport > moduleImport, 'Phase 1 authority must load after Player workspace modules');
  assert.doesNotMatch(authority, /\.coach-|data-coach|performance-shell--coach/i);
  assert.doesNotMatch(authority, /html\s*\{|body\s*\{|overflow-x\s*:\s*hidden/i, 'do not mask element-level defects at document level');
});

test('Player workspace metrics use readable floors and wrap meaningful copy', () => {
  assert.match(authority, /data-metric-role="label"[\s\S]*font-size:\s*11px/);
  assert.match(authority, /data-metric-role="detail"[\s\S]*font-size:\s*12px/);
  assert.match(authority, /data-metric-role="label"[\s\S]*white-space:\s*normal/);
  assert.match(authority, /data-metric-role="detail"[\s\S]*white-space:\s*normal/);
  assert.match(authority, /data-metric-role="label"[\s\S]*text-overflow:\s*clip/);
  assert.match(authority, /data-metric-role="detail"[\s\S]*text-overflow:\s*clip/);

  const detailColor = declaration('[data-metric-role="detail"]', 'color');
  const labelColor = declaration('[data-metric-role="label"]', 'color');
  for (const background of ['#ffffff', '#f7f8f4']) {
    assert.ok(contrast(hex(detailColor), hex(background)) >= 4.5, `${detailColor} must remain AA-safe on ${background}`);
    assert.ok(contrast(hex(labelColor), hex(background)) >= 4.5, `${labelColor} must remain AA-safe on ${background}`);
  }
});

test('mobile Player filter rails reflow instead of creating a sideways rail', () => {
  assert.match(authority, /@media\s*\(max-width:\s*760px\)[\s\S]*data-player-workspace-filter-rail[\s\S]*flex-wrap:\s*wrap/);
  assert.match(authority, /data-player-workspace-filter-rail[\s\S]*overflow-x:\s*visible/);
  assert.match(authority, /data-player-workspace-filter-rail[\s\S]*scroll-snap-type:\s*none/);
});

test('Player Progress muted dark-surface labels are readable and AA-safe', () => {
  assert.match(authority, /player-progress-story-hero[\s\S]*color:\s*#b8c4c8/);
  assert.match(authority, /player-progress-story-hero[\s\S]*font-size:\s*11px/);
  const foreground = hex('#b8c4c8');
  for (const background of ['#071820', '#0b2633', '#203945']) {
    assert.ok(contrast(foreground, hex(background)) >= 4.5, `Progress support text must remain AA-safe on ${background}`);
  }
});

test('Player information titles and mobile title-stage support wrap intentionally', () => {
  assert.match(authority, /playerProgressDisclosure[\s\S]*white-space:\s*normal/);
  assert.match(authority, /playerProgressDisclosure[\s\S]*text-overflow:\s*clip/);
  assert.match(authority, /teamIdentityTitleStage__identityLine[\s\S]*font-size:\s*10px/);
  assert.match(authority, /teamIdentityTitleStage__summary[\s\S]*-webkit-line-clamp:\s*unset/);
  assert.match(authority, /teamIdentityTitleStage__summary[\s\S]*white-space:\s*normal/);
});
