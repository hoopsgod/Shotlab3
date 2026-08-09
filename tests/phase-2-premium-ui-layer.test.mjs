import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const primitives = readFileSync('src/components/CoachDashboardPrimitives.jsx', 'utf8');
const layer = readFileSync('src/components/Phase2PremiumMetricLayer.css', 'utf8');
const practiceReadinessMigration = readFileSync('scripts/apply-phase5b-practice-readiness.mjs', 'utf8');

test('Phase 2 premium metrics preserve dashboard filter semantics and full accessible labels', () => {
  assert.match(primitives, /export function InteractiveMetricStrip/);
  assert.match(primitives, /aria-pressed=\{active\}/);
  assert.match(primitives, /onClick=\{\(\) => onSelect\?\.\(item\.key\)\}/);
  assert.match(primitives, /const accessibleLabel = `\$\{item\.label\}: \$\{item\.value\}/);
  assert.match(primitives, /aria-label=\{item\.ariaLabel \|\| accessibleLabel\}/);
  assert.match(primitives, /item\.displayLabel \|\| item\.label/);
  assert.match(primitives, /data-premium-metric/);
  assert.match(primitives, /data-premium-metric-tone=\{item\.tone \|\| "neutral"\}/);
});

test('Phase 2 premium metrics use the ShotLab icon family instead of ornamental glyphs', () => {
  assert.match(primitives, /import ShotLabIcon from "\.\/ShotLabIcon"/);
  assert.match(primitives, /metricIconName/);
  assert.match(primitives, /data-premium-metric-icon/);
  assert.match(primitives, /<ShotLabIcon name=\{metricIconName\(item\)\}/);
});

test('Phase 2 premium metrics render truthful evidence and a clearly non-trend placeholder', () => {
  assert.match(primitives, /metricEvidencePoints/);
  assert.match(primitives, /values\.map\(\(value\) => Number\(value\)\)\.filter\(Number\.isFinite\)/);
  assert.match(primitives, /function PremiumMetricEvidence/);
  assert.match(primitives, /<polyline data-premium-metric-path points=\{points\}/);
  assert.match(primitives, /data-premium-metric-placeholder/);
  assert.match(primitives, /no trend series available/);
  assert.match(primitives, /<line data-premium-metric-path x1="0" y1="22" x2="100" y2="22"/);
});

test('Phase 2 premium metric styling remains editorial, mobile safe, and reduced-motion safe', () => {
  assert.match(layer, /\.secondaryPageToolbar \[data-premium-metric\]/);
  assert.match(layer, /\[data-premium-metric-evidence\]/);
  assert.match(layer, /\[data-premium-metric-placeholder\] \[data-premium-metric-path\]/);
  assert.match(layer, /stroke-dasharray: 4 6/);
  assert.match(layer, /@media \(max-width: 760px\)/);
  assert.match(layer, /min-height: 116px !important/);
  assert.match(layer, /font-size: 9px !important/);
  assert.match(layer, /font-size: 30px !important/);
  assert.match(layer, /@media \(prefers-reduced-motion: reduce\)/);
});

test('Phase 2 display labels remain compatible with the truthful Phase 5B RSVP migration', () => {
  assert.match(practiceReadinessMigration, /label: \"Missing RSVPs\", displayLabel: \"RSVP Gaps\"/);
  assert.match(practiceReadinessMigration, /label: \"Awaiting RSVP\", displayLabel: \"RSVP Gaps\"/);
  assert.match(practiceReadinessMigration, /label: \"Response Rate\", displayLabel: \"Response\"/);
  assert.match(practiceReadinessMigration, /briefing\.awaitingResponse/);
  assert.match(practiceReadinessMigration, /briefing\.responded/);
});
