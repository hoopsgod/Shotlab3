import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync('index.html', 'utf8');
const profile = readFileSync('src/components/PlayerCareerHistory.jsx', 'utf8');
const profileCss = readFileSync('src/components/PlayerCareerHistory.module.css', 'utf8');
const phaseCss = readFileSync('public/shotlab-phase3e-profile-hierarchy.css', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');
const workflow = readFileSync('.github/workflows/app-store-presentation-readiness.yml', 'utf8');

test('Phase 3E loads after the verified Phase 3D analytics authorities', () => {
  const analytics = index.indexOf('shotlab-phase3d-player-analytics');
  const rootLock = index.indexOf('shotlab-phase3d-analytics-root-lock');
  const hierarchy = index.indexOf('shotlab-phase3e-profile-hierarchy');
  assert.ok(analytics >= 0, 'Phase 3D analytics authority must remain loaded');
  assert.ok(rootLock > analytics, 'Phase 3D rendered root lock must remain after analytics');
  assert.ok(hierarchy > rootLock, 'Phase 3E hierarchy must load after the verified Phase 3D lock');
});

test('Player career history defaults to one native disclosure while Coach athlete history stays expanded', () => {
  assert.match(profile, /const isPlayerView = viewerRole === "player"/);
  assert.match(profile, /const careerContent = \(/);
  assert.match(profile, /if \(!isPlayerView\) return careerContent/);
  assert.match(profile, /<details className=\{styles\.careerDisclosure\} data-testid="player-profile-career-disclosure">/);
  assert.match(profile, /Career history/);
  assert.match(profile, /Verified season record/);
  assert.match(profile, /Coach athlete view/);
});

test('Career disclosure preserves every verified history layer and calculation', () => {
  assert.match(profile, /buildPlayerCareerHistory/);
  assert.match(profile, /buildPlayerCareerMilestoneStory/);
  assert.match(profile, /At-home makes/);
  assert.match(profile, /Program entries/);
  assert.match(profile, /Team participation/);
  assert.match(profile, /Personal records/);
  assert.match(profile, /career-season-list/);
  assert.match(profile, /career-milestone-ladder/);
  assert.match(profile, /player-career-detail-disclosure/);
});

test('Player career presentation stays on the accepted light native system', () => {
  assert.match(profileCss, /\.shell\[data-viewer-role="player"\]\{padding:0;border:0;border-radius:0;background:transparent;box-shadow:none\}/);
  assert.match(profileCss, /\.milestoneCardPlayer\{[\s\S]*?background:color-mix\(in srgb,var\(--accent,#8ea900\) 6%,#faf9f5\)/s);
  assert.match(phaseCss, /\[data-testid="player-profile-career-disclosure"\]/);
  assert.match(phaseCss, /min-height:62px!important/);
  assert.match(phaseCss, /summary:focus-visible/);
  assert.match(phaseCss, /touch-action:manipulation/);
});

test('Phase 3E removes the duplicate Profile identity hero at source and leaves deep analytics intact', () => {
  assert.doesNotMatch(app, /OFFSEASON PLAYER/, 'redundant Profile identity copy must not render from source');
  assert.doesNotMatch(phaseCss, /padding: ?28px 22px/, 'Phase 3E must not rely on hiding the removed hero with a style signature');
  assert.match(app, /OFFSEASON REPORT CARD/);
  assert.match(app, /PLAYER PROGRESS PROFILE/);
  assert.match(app, /INTERPRETED PERFORMANCE TRENDS/);
  assert.match(app, /<ShotLabCharts scores=\{scores\} drills=\{drills\} programDrills=\{programDrills\} user=\{u\} \/>/);
  assert.match(app, /DRILL BREAKDOWN/);
  assert.match(app, /PRIVACY/);
});

test('Phase 3E keeps reduced-motion handling and App Store evidence coverage explicit', () => {
  assert.match(phaseCss, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(workflow, /tests\/phase-3e-profile-information-hierarchy\.test\.mjs/);
  assert.match(workflow, /shotlab-phase-(?:3e-profile-hierarchy|3f-profile-intelligence|3g-coach-drills-hierarchy)-evidence/);
});
