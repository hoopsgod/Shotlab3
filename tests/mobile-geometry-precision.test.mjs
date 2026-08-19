import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const authority = read('src/styles/AuthenticatedVisualAuthority2026.css');
const metrics = read('src/components/PlayerMetricHierarchy.module.css');
const secondaryPages = read('src/components/SecondaryPageSystem.css');
const centering = read('public/shotlab-mobile-centering-reconciliation.css');
const navigation = read('src/components/MobileNavigation.module.css');

test('mobile geometry authority owns one 20px content rail across player and coach shells', () => {
  assert.match(authority, /--shotlab-mobile-content-rail:\s*var\(--space-5, 20px\)/);
  assert.match(authority, /--layout-gutter:\s*var\(--shotlab-mobile-content-rail\)/);
  assert.match(authority, /\.performance-shell \.player-scroll-container,[\s\S]*\.performance-shell \.coach-scroll-container[\s\S]*padding-inline:\s*var\(--shotlab-mobile-content-rail\) !important/);
  assert.match(authority, /\.performance-shell--player \.player-quick-actions[\s\S]*padding-inline:\s*var\(--shotlab-mobile-content-rail\) !important/);
});

test('secondary mobile pages land beyond bottom navigation with deliberate breathing room', () => {
  assert.match(authority, /--shotlab-mobile-content-landing:\s*var\(--space-6, 24px\)/);
  assert.match(authority, /\.secondaryPageShell[\s\S]*padding-bottom:\s*calc\(var\(--bottom-nav-content-padding, 82px\) \+ var\(--shotlab-mobile-content-landing\)\) !important/);
  assert.match(navigation, /--bottom-nav-content-padding:\s*82px/);
  assert.match(navigation, /env\(safe-area-inset-bottom, 0px\)/);
});

test('full-bleed route performance stages still break the rail symmetrically', () => {
  assert.match(centering, /width:\s*calc\(100% \+ var\(--layout-gutter, 18px\) \+ var\(--layout-gutter, 18px\)\) !important/);
  assert.match(centering, /margin-left:\s*calc\(var\(--layout-gutter, 18px\) \* -1\) !important/);
  assert.match(centering, /margin-right:\s*calc\(var\(--layout-gutter, 18px\) \* -1\) !important/);
  assert.match(secondaryPages, /\.secondaryPageDecision\s*\{/);
});

test('first supporting mobile metric returns to the editorial rail without flattening card internals', () => {
  assert.match(metrics, /\.metricPrimary \+ \.metricSupporting\{[\s\S]*padding-inline-start:2px!important;[\s\S]*border-left:0!important/);
  assert.doesNotMatch(metrics, /data-team-workspace=['"]program['"]/);
  assert.match(metrics, /\.metricSupporting\{[\s\S]*padding:13px 10px 12px!important/);
  assert.match(metrics, /\.metricSupporting \+ \.metricSupporting\{border-left:1px solid/);
});
