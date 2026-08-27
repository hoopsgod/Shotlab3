import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const titleStage = read('src/components/TeamIdentityTitleStage.jsx');
const viewportLock = read('src/lib/mobileHorizontalViewportLock.js');
const mobileAxis = read('src/styles/MobileViewportAxisAuthority2026.css');
const visualAuthority = read('src/styles/AuthenticatedVisualAuthority2026.css');
const coachConvergence = read('src/styles/CoachRoleVisualConvergence2026.css');

test('persistent mobile viewport owns route opening position instead of individual title components', () => {
  assert.doesNotMatch(titleStage, /useLayoutEffect|scrollRestoration|scrollTo\(0, 0\)/);
  assert.match(viewportLock, /scrollRestoration[^\n]*= 'manual'/);
  assert.match(viewportLock, /performance-shell\.is-mobile\[data-workspace-tab\]/);
  assert.match(viewportLock, /nextRoute === routeKey/);
  assert.match(viewportLock, /window\.scrollTo\(0, 0\)/);
  assert.match(viewportLock, /\.player-scroll-container, :scope > \.shell-main > \.content-wrap'\)\?\.scrollTo\(0, 0\)/);
  assert.match(mobileAxis, /overflow-anchor:\s*none\s*!important/);
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
