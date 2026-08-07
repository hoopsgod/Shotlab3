import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enhancer = readFileSync('scripts/apply-phase3f-profile-intelligence.mjs', 'utf8');
const css = readFileSync('public/shotlab-phase3f-profile-intelligence.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

test('Phase 3F enhancer is guarded and runs for both dev and production build preparation', () => {
  assert.match(pkg.scripts.dev, /apply-phase3f-profile-intelligence\.mjs/);
  assert.match(pkg.scripts['prepare:route-enhancers'], /apply-phase3f-profile-intelligence\.mjs/);
  assert.match(enhancer, /expected exactly one anchor/);
  assert.match(enhancer, /Phase 3F Profile disclosure already applied/);
  assert.match(enhancer, /Phase 3F analytics controls already applied/);
});

test('Current Progress and one concise Player Readout remain visible before deep intelligence', () => {
  assert.match(enhancer, /data-testid=\"player-profile-current-progress\"/);
  assert.match(enhancer, /data-testid=\"player-profile-readout\"/);
  assert.match(enhancer, /Momentum is \{interpretedTrends\.momentum\}/);
  assert.match(enhancer, /Focus: \{interpretedTrends\.weakArea\}/);
  assert.match(enhancer, /Strength: \{interpretedTrends\.strongestDrill\}/);
  assert.match(css, /\[data-testid=\"player-profile-readout\"\]::before/);
});

test('deep performance and drill history become two closed-by-default ProgressiveDisclosure layers', () => {
  assert.match(enhancer, /ProgressiveDisclosure title=\"Performance intelligence\"/);
  assert.match(enhancer, /testId=\"player-profile-performance-intelligence\"/);
  assert.match(enhancer, /ProgressiveDisclosure title=\"Drill development\"/);
  assert.match(enhancer, /testId=\"player-profile-drill-development\"/);
  assert.doesNotMatch(enhancer, /defaultOpen=\{true\}/);
  assert.match(css, /\[data-testid=\"player-profile-performance-intelligence\"\]/);
  assert.match(css, /\[data-testid=\"player-profile-drill-development\"\]/);
});

test('Phase 3F preserves all Profile capability behind disclosure', () => {
  assert.match(enhancer, /INTERPRETED PERFORMANCE TRENDS/);
  assert.match(enhancer, /<ShotLabCharts scores=\{scores\}/);
  assert.match(enhancer, /DRILL BREAKDOWN/);
  assert.match(enhancer, />PRIVACY<\/div>/);
  assert.match(enhancer, /<AccountTrustActions deleteAccount=\{deleteAccount\}\/\>/);
});

test('analytics navigation uses ShotLab line icons and selected-state semantics instead of emoji tabs', () => {
  assert.match(enhancer, /import ShotLabIcon from \"\.\/ShotLabIcon\"/);
  assert.match(enhancer, /icon: \"chart\"/);
  assert.match(enhancer, /icon: \"target\"/);
  assert.match(enhancer, /icon: \"streak\"/);
  assert.match(enhancer, /icon: \"trophy\"/);
  assert.match(enhancer, /aria-pressed=\{tab === t\.id\}/);
  assert.match(enhancer, /aria-pressed=\{activeOption\}/);
  assert.match(enhancer, /aria-pressed=\{active\}/);
  assert.match(enhancer, /emoji analytics controls remain/);
});

test('analytics calculations and all four intelligence destinations remain intact', () => {
  assert.match(enhancer, /const myScores = useMemo/);
  assert.match(enhancer, /<MakesOverTime/);
  assert.match(enhancer, /<WeeklyVolume/);
  assert.match(enhancer, /<SkillRadar \/>/);
  assert.match(enhancer, /<StreakCalendar \/>/);
  assert.match(enhancer, /<SeasonGoal \/>/);
});

test('Phase 3F presentation authority is loaded after Phase 3E and provides focus/reduced-motion treatment', () => {
  assert.match(html, /shotlab-phase3e-profile-hierarchy\.css[\s\S]*shotlab-phase3f-profile-intelligence\.css/);
  assert.match(css, /button\[aria-pressed=\"true\"\]/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('App Store workflow carries the Phase 3F contract and evidence package', () => {
  assert.match(workflow, /tests\/phase-3f-profile-intelligence\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-(?:3f-profile-intelligence|3g-coach-drills-hierarchy|3h-coach-players-hierarchy|3i-team-store-immersive)-evidence/);
});
