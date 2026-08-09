import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const primitives = readFileSync('src/components/CoachDashboardPrimitives.jsx', 'utf8');
const layer = readFileSync('src/components/Phase2PremiumMetricLayer.css', 'utf8');

test('Phase 2 premium metrics preserve dashboard filter semantics', () => {
  assert.match(primitives, /export function InteractiveMetricStrip/);
  assert.match(primitives, /aria-pressed=\{active\}/);
  assert.match(primitives, /onClick=\{\(\) => onSelect\?\.\(item\.key\)\}/);
  assert.match(primitives, /data-premium-metric/);
  assert.match(primitives, /data-premium-metric-tone=\{item\.tone \|\| "neutral"\}/);
});

test('Phase 2 premium metrics use the ShotLab icon family instead of ornamental glyphs', () => {
  assert.match(primitives, /import ShotLabIcon from "\.\/ShotLabIcon"/);
  assert.match(primitives, /metricIconName/);
  assert.match(primitives, /data-premium-metric-icon/);
  assert.match(primitives, /<ShotLabIcon name=\{metricIconName\(item\)\}/);
});

test('Phase 2 premium metrics render truthful evidence when a series exists', () => {
  assert.match(primitives, /metricEvidencePoints/);
  assert.match(primitives, /values\.map\(\(value\) => Number\(value\)\)\.filter\(Number\.isFinite\)/);
  assert.match(primitives, /function PremiumMetricEvidence/);
  assert.match(primitives, /<polyline data-premium-metric-path points=\{points\}/);
  assert.match(primitives, /if \(!points\) return <span data-premium-metric-pulse/);
});

test('Phase 2 premium metric styling remains editorial, mobile safe, and reduced-motion safe', () => {
  assert.match(layer, /\.secondaryPageToolbar \[data-premium-metric\]/);
  assert.match(layer, /\[data-premium-metric-evidence\]/);
  assert.match(layer, /\[data-premium-metric-pulse\]/);
  assert.match(layer, /@media \(max-width: 760px\)/);
  assert.match(layer, /min-height: 118px !important/);
  assert.match(layer, /@media \(prefers-reduced-motion: reduce\)/);
});
