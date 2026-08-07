import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3h-coach-players-hierarchy.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3h-coach-players-hierarchy.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');
const screenshots = readFileSync('tests/e2e/design-system-screenshots.spec.mjs', 'utf8');

test('Phase 3H enhancer runs after Phase 3G and remains guarded and idempotent', () => {
  assert.match(pkg.scripts.dev, /apply-phase3g-coach-drills-hierarchy\.mjs[\s\S]*apply-phase3h-coach-players-hierarchy\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase3g-coach-drills-hierarchy\.mjs[\s\S]*apply-phase3h-coach-players-hierarchy\.mjs/);
  assert.match(enhancer, /expected exactly one anchor/);
  assert.match(enhancer, /Phase 3H Coach Players hierarchy already applied/);
});

test('Coach Players separates account activation, season tools, and roster management into closed native disclosures', () => {
  for (const id of ['coach-player-account-activation', 'coach-player-season-tools', 'coach-player-roster-management']) {
    assert.match(enhancer, new RegExp(`data-testid=\\"${id}\\"`));
  }
  assert.match(enhancer, /Add a player/);
  assert.match(enhancer, /Season tools/);
  assert.match(enhancer, /Roster & player management/);
  assert.doesNotMatch(enhancer, /<details[^>]*open/);
  assert.match(css, /\.coach-player-management-disclosure/);
  assert.match(css, /\.coach-player-management-summary/);
});

test('existing Players command actions open the appropriate hidden management workflow', () => {
  assert.match(enhancer, /document\.getElementById\("coach-player-account-activation"\)/);
  assert.match(enhancer, /document\.getElementById\("coach-player-season-tools"\)/);
  assert.match(enhancer, /disclosure\.open=true/);
  assert.match(enhancer, /scrollIntoView\(\{behavior:\"smooth\",block:\"start\"\}\)/);
});

test('View roster inside account activation opens roster management before scrolling', () => {
  assert.match(enhancer, /document\.getElementById\("coach-player-roster-management"\)/);
  assert.match(enhancer, /document\.getElementById\("coach-roster-operations"\)/);
});

test('Phase 3H preserves player provisioning, season, roster, and player-intelligence capabilities', () => {
  for (const preserved of [
    '<CoachPlayerInviteForm',
    '<CoachSeasonComparisonPanel',
    'data-testid="coach-season-archive"',
    '<NewSeasonWizard',
    '<CoachRoster',
    't="PLAYER DETAILS"',
    'onRemovePlayer={removeRosterPlayer}',
    'onSelectPlayer={openPlayerIntelligence}',
    'Account management — required by App Store §5.1.1(v)',
  ]) {
    assert.ok(enhancer.includes(preserved), `missing preserved marker: ${preserved}`);
  }
});

test('management summaries are protected from legacy boxing and low-contrast cascade', () => {
  assert.match(css, /coach-player-management-summary-copy > small[\s\S]*opacity: 1 !important/);
  assert.match(css, /coach-player-management-summary-copy > small[\s\S]*box-shadow: none !important/);
  assert.match(css, /--phase3h-ink: #151915/);
  assert.match(css, /--phase3h-muted: #5f675f/);
});

test('Phase 3H authority loads after Phase 3G and keeps focus and reduced-motion behavior explicit', () => {
  assert.match(html, /shotlab-phase3g-coach-drills-hierarchy\.css[\s\S]*shotlab-phase3h-coach-players-hierarchy\.css/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /touch-action: manipulation/);
});

test('rendered iPhone evidence verifies default and expanded Players management states', () => {
  assert.match(screenshots, /coach-player-account-activation/);
  assert.match(screenshots, /coach-player-season-tools/);
  assert.match(screenshots, /coach-player-roster-management/);
  assert.match(screenshots, /06-coach-players/);
  assert.match(screenshots, /06b-coach-player-add/);
  assert.match(screenshots, /06c-coach-season-tools/);
  assert.match(screenshots, /06d-coach-roster-management/);
});

test('App Store workflow carries Phase 3H and its evidence package', () => {
  assert.match(workflow, /tests\/phase-3h-coach-players-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-3h-coach-players-hierarchy-evidence/);
});
