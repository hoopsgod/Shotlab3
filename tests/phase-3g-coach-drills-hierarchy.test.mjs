import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3g-coach-drills-hierarchy.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3g-coach-drills-hierarchy.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/design-system-screenshots.spec.mjs', 'utf8');

test('Phase 3G enhancer is guarded and runs after the accepted Phase 3F transform', () => {
  assert.match(pkg.scripts.dev, /apply-phase3f-profile-intelligence\.mjs[\s\S]*apply-phase3g-coach-drills-hierarchy\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase3f-profile-intelligence\.mjs[\s\S]*apply-phase3g-coach-drills-hierarchy\.mjs/);
  assert.match(enhancer, /expected exactly one anchor/);
  assert.match(enhancer, /Phase 3G Coach Drills hierarchy already applied/);
});

test('Coach Drill library management becomes one closed-by-default native disclosure', () => {
  assert.match(enhancer, /data-testid=\"coach-drills-library-management\"/);
  assert.match(enhancer, /Manage drill library/);
  assert.match(enhancer, /player-facing drills/);
  assert.match(enhancer, /custom program slots/);
  assert.doesNotMatch(enhancer, /<details[^>]*open/);
  assert.match(css, /\.coach-drills-library-disclosure/);
  assert.match(css, /\.coach-drills-library-summary/);
  assert.match(css, /\.coach-drills-library-disclosure\[open\]/);
  assert.match(css, /coach-drills-library-summary-copy > small[\s\S]*opacity: 1 !important/);
  assert.match(css, /coach-drills-library-summary-copy > small[\s\S]*box-shadow: none !important/);
  assert.match(css, /color: #596159 !important/);
});

test('Coach Drills keeps every management capability behind or beside the disclosure', () => {
  assert.match(enhancer, /PROGRAM SHOOTING DRILLS/);
  assert.match(enhancer, /Customize the drills your players see/);
  assert.match(enhancer, /setShowNewDrill\(true\)/);
  assert.match(enhancer, /NEW DRILL/);
  assert.match(enhancer, /removeDrill/);
  assert.match(enhancer, /updateDrill/);
});

test('Drill search, filters, and operational cards use the light native secondary system', () => {
  assert.match(css, /coach-drills-operational-filters/);
  assert.match(css, /background: rgba\(255,255,255,\.94\)/);
  assert.match(css, /button\[aria-pressed=\"true\"\]/);
  assert.match(css, /coach-drills-operational-panel/);
  assert.match(css, /article h2/);
  assert.match(css, /--phase3g-ink: #151915/);
});

test('Drills keeps one decision layer instead of repeating metric evidence twice', () => {
  assert.match(css, /coach-page-dashboard-drills-evidence/);
  assert.match(css, /coach-page-dashboard-drills-decision-brief/);
  assert.match(css, /coach-page-dashboard-drills-evidence[^}]*display: none !important/s);
});

test('duplicate bottom Add Drill CTA is removed visually while the new-drill form remains available', () => {
  assert.match(css, /\.coach-drills-library-disclosure \+ \.btn-v\.cta-primary/);
  assert.match(css, /display: none !important/);
  assert.match(enhancer, /NEW DRILL/);
});

test('Phase 3G authority loads after Phase 3F and keeps accessibility behavior explicit', () => {
  assert.match(html, /shotlab-phase3f-profile-intelligence\.css[\s\S]*shotlab-phase3g-coach-drills-hierarchy\.css/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /touch-action: manipulation/);
});

test('rendered iPhone evidence verifies default and expanded Coach Drills states', () => {
  assert.match(screenshots, /coach-drills-library-management/);
  assert.match(screenshots, /08-coach-drills/);
  assert.match(screenshots, /08b-coach-drills-library-expanded/);
  assert.match(screenshots, /PROGRAM SHOOTING DRILLS/);
});

test('App Store presentation workflow carries the Phase 3G contract and evidence package', () => {
  assert.match(workflow, /tests\/phase-3g-coach-drills-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-(?:3g-coach-drills-hierarchy|3h-coach-players-hierarchy)-evidence/);
});
