import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const titleStage = read('src/components/TeamIdentityTitleStage.jsx');
const visualAuthority = read('src/styles/AuthenticatedVisualAuthority2026.css');
const coachConvergence = read('src/styles/CoachRoleVisualConvergence2026.css');

test('mobile editorial title stages synchronously reset persistent route scroll position', () => {
  assert.match(titleStage, /useLayoutEffect/);
  assert.match(titleStage, /titleFamily !== "editorial"/);
  assert.match(titleStage, /innerWidth > 767/);
  assert.match(titleStage, /stageRef\.current\?\.closest\("\.player-scroll-container,\.coach-scroll-container,\.content-wrap"\)\?\.scrollTo\(0, 0\)/);
  assert.match(titleStage, /document\.scrollingElement\?\.scrollTo\(0, 0\)/);
  assert.match(titleStage, /ref=\{stageRef\}/);
});

test('mobile secondary pages retain a safe top landing instead of collapsing under browser chrome', () => {
  assert.match(visualAuthority, /\.secondaryPageShell\s*\{[\s\S]*padding-top:\s*max\(18px,\s*calc\(env\(safe-area-inset-top,\s*0px\) \+ 8px\)\)\s*!important/);
  assert.match(visualAuthority, /shared-dashboard-back-action \+ \.secondaryPageShell\s*\{[\s\S]*padding-top:\s*max\(14px,\s*calc\(env\(safe-area-inset-top,\s*0px\) \+ 6px\)\)\s*!important/);
  assert.doesNotMatch(visualAuthority, /shared-dashboard-back-action \+ \.secondaryPageShell\s*\{[^}]*padding-top:\s*0\s*!important/);
});

test('Coach secondary titles own premium editorial hierarchy without touching Coach Home', () => {
  assert.match(coachConvergence, /intentionally does not style or reposition[\s\S]*shared title primitive/);
  assert.match(visualAuthority, /performance-shell--coach \[data-visual-role="page-intro"\]\[data-title-stage-family="editorial"\]/);
  assert.match(visualAuthority, /font-family:\s*"Barlow Condensed",\s*"Arial Narrow"/);
  assert.match(visualAuthority, /--identity-crest:\s*clamp\(96px,\s*25vw,\s*108px\)/);
  assert.match(visualAuthority, /@media \(max-width: 390px\)[\s\S]*--identity-crest:\s*84px/);
  assert.match(visualAuthority, /data-visual-role="filter-rail"[\s\S]*button\[aria-pressed="true"\]::after/);
  assert.doesNotMatch(visualAuthority, /coach-command-center-full[^}]*font-family:\s*"Barlow Condensed"/);
});
