import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3g-expanded-intelligence-refinement.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3g-expanded-intelligence.css', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const workflow = readFileSync('.github/workflows/phase3g-expanded-intelligence-readiness.yml', 'utf8');

test('Phase 3G runs after Phase 3F in both dev and production build preparation', () => {
  assert.match(pkg, /apply-phase3f-profile-intelligence\.mjs && node scripts\/apply-phase3g-expanded-intelligence-refinement\.mjs/);
  assert.match(enhancer, /shotlab-phase3f-profile-intelligence/);
  assert.match(enhancer, /shotlab-phase3g-expanded-intelligence/);
});

test('Drill Development becomes a compact index before full drill details', () => {
  assert.match(enhancer, /data-testid="player-profile-drill-index"/);
  assert.match(enhancer, /DEVELOPMENT INDEX/);
  assert.match(enhancer, /Your drills at a glance/);
  assert.match(enhancer, /data-drill-index-name/);
  assert.match(enhancer, /data-drill-index-metrics/);
  assert.match(enhancer, /<strong>\{d\.pb\}<\/strong><small>PB<\/small>/);
  assert.match(enhancer, /<strong>\{d\.avg\}<\/strong><small>AVG<\/small>/);
  assert.match(enhancer, /testId="player-profile-full-drill-details"/);
});

test('Existing detailed drill capability remains available behind nested disclosure', () => {
  assert.match(enhancer, /DRILL BREAKDOWN/);
  assert.match(enhancer, /Sparkline data=\{d\.last10\}/);
  assert.match(enhancer, /player-profile-drill-development/);
  assert.match(enhancer, />PRIVACY<\/div>/);
});

test('Expanded Performance Intelligence has one section authority and compact controls', () => {
  assert.match(css, /player-profile-performance-intelligence/);
  assert.match(css, /player-analytics-heading/);
  assert.match(css, /display:none!important/);
  assert.match(css, /player-analytics-sections/);
});

test('Compact drill index retains source distinction, focus, touch, and reduced motion behavior', () => {
  assert.match(css, /data-source="program"/);
  assert.match(css, /data-source="home"/);
  assert.match(css, /summary:focus-visible/);
  assert.match(css, /touch-action:manipulation/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('Phase 3G owns fresh screenshot evidence', () => {
  assert.match(workflow, /agent\/phase-3f-native-analytics-controls/);
  assert.match(workflow, /tests\/phase-3g-expanded-intelligence-refinement\.test\.mjs/);
  assert.match(workflow, /design-system-screenshots\.spec\.mjs/);
  assert.match(workflow, /shotlab-phase-3g-expanded-intelligence-evidence/);
});
