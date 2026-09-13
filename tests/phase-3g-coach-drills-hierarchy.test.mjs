import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3g-coach-drills-hierarchy.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3g-coach-drills-hierarchy.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const routeEnhancers = readFileSync('scripts/run-route-enhancers.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/design-system-screenshots.spec.mjs', 'utf8');

test('Phase 3G enhancer is guarded and runs after the accepted Phase 3F transform', () => {
  assert.match(pkg.scripts.dev, /run-route-enhancers\.mjs dev/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /run-route-enhancers\.mjs build/);
  assert.match(routeEnhancers, /apply-phase3f-profile-intelligence\.mjs[\s\S]*apply-phase3g-coach-drills-hierarchy\.mjs/);
  assert.match(enhancer, /expected exactly one anchor/);
  assert.match(enhancer, /Phase 3G Coach Drills hierarchy already applied/);
});

test('Coach Drill library management remains one closed-by-default native disclosure', () => {
  assert.match(enhancer, /data-testid=\"coach-drills-library-management\"/);
  assert.match(enhancer, /Manage drill library/);
  assert.match(enhancer, /player-facing drills/);
  assert.match(enhancer, /custom program slots/);
  assert.doesNotMatch(enhancer, /<details[^>]*open/);
  assert.match(css, /\.coach-drills-library-disclosure/);
  assert.match(css, /\.coach-drills-library-summary/);
  assert.match(css, /\.coach-drills-library-disclosure\[open\]/);
  assert.match(css, /coach-drills-library-summary-copy\s*>\s*small[\s\S]*opacity:\s*1\s*!important/);
  assert.match(css, /coach-drills-library-summary-copy\s*>\s*small[\s\S]*box-shadow:\s*none\s*!important/);
  assert.match(css, /color:\s*#596159\s*!important/);
});

test('Coach Drills keeps every management capability behind or beside the disclosure', () => {
  assert.match(enhancer, /PROGRAM SHOOTING DRILLS/);
  assert.match(enhancer, /Customize the drills your players see/);
  assert.match(enhancer, /setShowNewDrill\(true\)/);
  assert.match(enhancer, /NEW DRILL/);
  assert.match(enhancer, /removeDrill/);
  assert.match(enhancer, /updateDrill/);
});

test('Drill search and filters use the Phase 6 editorial utility rail', () => {
  assert.match(css, /coach-drills-operational-filters/);
  assert.match(css, /padding:0!important/);
  assert.match(css, /border:0!important/);
  assert.match(css, /background:transparent!important/);
  assert.match(css, /label[\s\S]*min-height:46px!important[\s\S]*background:#fff!important/);
  assert.match(css, /button\[aria-pressed=\"true\"\]/);
  assert.match(css, /--phase3g-ink:#151915/);
});

test('Drills operational evidence is flatter than the retired card grid', () => {
  assert.match(css, /coach-drills-operational-panel[\s\S]*border-top:1px solid var\(--phase3g-line\)!important/);
  assert.match(css, /coach-drills-operational-panel[\s\S]*article\{[\s\S]*border:0!important[\s\S]*border-radius:0!important[\s\S]*background:transparent!important[\s\S]*box-shadow:none!important/);
  assert.match(css, /article\+article\{border-left:1px solid var\(--phase3g-line\)!important/);
  assert.match(css, /@media \(max-width:720px\)[\s\S]*article\+article\{border-left:0!important;border-top:1px solid var\(--phase3g-line\)!important/);
});

test('Drills keeps one decision layer instead of repeating metric evidence twice', () => {
  assert.match(css, /coach-page-dashboard-drills-evidence/);
  assert.match(css, /coach-page-dashboard-drills-decision-brief/);
  assert.match(css, /coach-page-dashboard-drills-evidence[^}]*display:none!important/s);
});

test('library management uses editorial separators instead of another outer card', () => {
  assert.match(css, /coach-drills-library-disclosure\{[\s\S]*border:0[\s\S]*border-block:1px solid var\(--phase3g-line\)[\s\S]*border-radius:0[\s\S]*background:transparent[\s\S]*box-shadow:none/);
  assert.match(css, /coach-drills-library-summary\{[\s\S]*min-height:64px/);
  assert.match(css, /coach-drills-library-summary strong[\s\S]*Barlow Condensed/);
});

test('duplicate bottom Add Drill CTA is removed visually while the new-drill form remains available', () => {
  assert.match(css, /\.coach-drills-library-disclosure\+\.btn-v\.cta-primary/);
  assert.match(css, /display:none!important/);
  assert.match(enhancer, /NEW DRILL/);
});

test('Phase 3G authority keeps accessibility behavior explicit', () => {
  assert.match(html, /shotlab-phase3f-profile-intelligence\.css[\s\S]*shotlab-phase3g-coach-drills-hierarchy\.css/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /touch-action:manipulation/);
  assert.match(css, /min-height:44px!important/);
});

test('rendered iPhone evidence verifies default and expanded Coach Drills states', () => {
  assert.match(screenshots, /coach-drills-library-management/);
  assert.match(screenshots, /08-coach-drills/);
  assert.match(screenshots, /08b-coach-drills-library-expanded/);
  assert.match(screenshots, /PROGRAM SHOOTING DRILLS/);
});

test('App Store presentation workflow carries the Phase 3G contract and a current evidence package', () => {
  assert.match(workflow, /tests\/phase-3g-coach-drills-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-(?:3g-coach-drills-hierarchy|3h-coach-players-hierarchy|3i-team-store-immersive|3j-coach-events-hierarchy)-evidence/);
});
