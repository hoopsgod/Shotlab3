import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const authenticatedAuthority = readFileSync(new URL('../src/styles/AuthenticatedVisualAuthority2026.css', import.meta.url), 'utf8');
const finalAxis = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const dashboards = readFileSync(new URL('../src/components/CoachInteractiveDashboards.css', import.meta.url), 'utf8');
const missionControlLock = readFileSync(new URL('../src/styles/MissionControlCascadeLock2026.css', import.meta.url), 'utf8');
const registeredViewportSpec = readFileSync(new URL('./e2e/registered-mobile-viewport-lock.spec.mjs', import.meta.url), 'utf8');
const webkitViewportSpec = readFileSync(new URL('./e2e/registered-mobile-webkit-scroll-lock.spec.mjs', import.meta.url), 'utf8');
const parityWorkflow = readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');

test('mobile viewport authority uses a true non-scrollable x boundary and stops overscroll chaining', () => {
  assert.match(centering, /html,\s*\n\s*body,\s*\n\s*#root\s*\{[^}]*overflow-x:\s*hidden;[^}]*overflow-x:\s*clip\s*!important;[^}]*overscroll-behavior-x:\s*none;/);
  assert.match(centering, /\.app-shell\.is-mobile,[\s\S]*\.shell-main,[\s\S]*\.content-wrap,[\s\S]*\.performance-workspace,[\s\S]*\.player-scroll-container,[\s\S]*\.coach-scroll-container[\s\S]*overflow-x:\s*clip\s*!important;/);
  assert.match(centering, /min-width:\s*0/);
  assert.match(centering, /max-width:\s*100%/);
  assert.match(centering, /box-sizing:\s*border-box/);
});

test('final mobile axis keeps Player and Coach on one dedicated 20px rail each', () => {
  assert.match(finalAxis, /--layout-gutter:\s*20px;/);
  assert.match(finalAxis, /--phase4e-mobile-gutter:\s*20px;/);
  assert.match(finalAxis, /performance-shell--player\.is-mobile \.player-scroll-container[^}]*\{[^}]*padding-inline:\s*20px\s*!important;/);

  assert.match(finalAxis, /performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap[\s\S]*padding-inline:\s*0\s*!important/);
  assert.match(finalAxis, /performance-shell--coach\.is-mobile \.performance-workspace--coach\s*\{[^}]*--shotlab-coach-route-wrapper-gutter:\s*var\(--shotlab-mobile-content-rail,\s*20px\);/);
  assert.match(authenticatedAuthority, /--shotlab-coach-route-wrapper-gutter:\s*var\(--shotlab-mobile-content-rail\);/);
  assert.match(authenticatedAuthority, /performance-shell--coach \.secondaryPageShell\s*\{[^}]*padding-inline:\s*0\s*!important/);
  assert.doesNotMatch(authenticatedAuthority, /16px wrapper \+ 4px secondary shell/);

  assert.match(finalAxis, /performance-workspace--coach > div:has\(\[data-testid="coach-command-center-full"\]\)[\s\S]*padding-inline:\s*0\s*!important/);
  assert.match(finalAxis, /performance-shell--player\.is-mobile \[data-visual-role="secondary-page"\][\s\S]*padding-inline:\s*0\s*!important/);
  assert.match(finalAxis, /secondaryPageShell > \.teamIdentityTitleStageFrame,[\s\S]*width:\s*100% !important;[\s\S]*margin-inline:\s*0 !important/);
  assert.doesNotMatch(finalAxis, /calc\(100% - \(var\(--shotlab-mobile-content-rail/);
  assert.doesNotMatch(dashboards, /width:\s*calc\(100% \+/);
  assert.doesNotMatch(dashboards, /margin-inline:\s*calc\(/);
  assert.match(centering, /secondary-page[\s\S]*primary-decision[\s\S]*width:\s*100%\s*!important;[\s\S]*max-width:\s*100%\s*!important;[\s\S]*margin-inline:\s*0\s*!important;/);
});

test('paid Coach onboarding and empty-state grids cannot expand their mobile track', () => {
  assert.match(missionControlLock, /\.mcFocusGrid,[\s\S]*\.mcLowerGrid\s*\{[^}]*width:100%!important;[^}]*max-width:100%!important;[^}]*min-width:0!important;[^}]*grid-template-columns:minmax\(0,1fr\)!important;/);
  assert.match(missionControlLock, /\.mcFocusGrid>\*,[\s\S]*\.mcLowerGrid>\*\s*\{[^}]*min-width:0!important;[^}]*max-width:100%!important;[^}]*box-sizing:border-box!important;/);
  assert.match(authenticatedAuthority, /performance-shell--coach \.secondaryPageShell\s*\{[^}]*width:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*min-width:\s*0\s*!important;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important;/);
  assert.match(authenticatedAuthority, /performance-shell--coach \.secondaryPageShell > \*\s*\{[^}]*min-width:\s*0\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*box-sizing:\s*border-box\s*!important;/);
});

test('shared player and coach page owners cannot become persistent horizontal scroll owners', () => {
  assert.match(centering, /\.player-scroll-container,[\s\S]*\.coach-scroll-container,[\s\S]*\.performance-workspace--coach > div:has\(> \.page\.pageShell\),[\s\S]*\.performance-workspace--coach > div:has\(> \.secondaryPageShell\),[\s\S]*coach-command-center-full[\s\S]*player-daily-command-center[\s\S]*overflow-x:\s*clip\s*!important;/);
  assert.match(centering, /margin-inline:\s*auto;/);
  assert.doesNotMatch(centering, /touch-action:\s*pan-y pinch-zoom/);
  assert.match(registeredViewportSpec, /REGISTERED_CONTENT_RAIL_SELECTORS/);
  assert.match(registeredViewportSpec, /rail\.scrollLeft = 240/);
  assert.match(registeredViewportSpec, /registered content rail must reject persistent horizontal scrollLeft/);
  assert.match(webkitViewportSpec, /rail\.scrollLeft = 240/);
  assert.match(webkitViewportSpec, /railScrollLeft/);
});

test('Coach Home removes the registered parent offset before Mission Control mounts', () => {
  assert.match(missionControlLock, /body\.mission-control-active #root \.performance-workspace--coach,[\s\S]*padding-left:0!important;[^}]*padding-right:0!important;[^}]*box-sizing:border-box!important;[^}]*overflow-x:clip!important;/);
});

test('Coach Home final cascade stays on the visual viewport instead of reviving a 100vw breakout', () => {
  assert.match(missionControlLock, /\[data-testid="coach-command-center-full"\]\.mcShellV3\s*\{[^}]*width:100%!important;[^}]*max-width:100%!important;[^}]*min-width:0!important;[^}]*margin-left:0!important;[^}]*margin-right:0!important;[^}]*overflow-x:clip!important;[^}]*box-sizing:border-box!important;/);
  assert.match(missionControlLock, /\[data-testid="coach-command-center-full"\]\.mcShellV3 \.missionControl\s*\{[^}]*width:100%!important;[^}]*max-width:100%!important;[^}]*min-width:0!important;[^}]*box-sizing:border-box!important;/);
  assert.match(missionControlLock, /\.mcHeroContent\s*\{[^}]*width:100%!important;[^}]*max-width:100%!important;[^}]*min-width:0!important;[^}]*box-sizing:border-box!important;/);
  assert.doesNotMatch(missionControlLock, /\[data-testid="coach-command-center-full"\]\.mcShellV3\{[^}]*width:100vw!important/);
});

test('registered Coach Home browser contract requires a symmetric mobile axis, not containment alone', () => {
  assert.match(registeredViewportSpec, /COACH_HOME_CENTER_AXIS_SELECTORS/);
  assert.match(registeredViewportSpec, /must have symmetric mobile gutters/);
  assert.match(registeredViewportSpec, /leftGutter - rightGutter/);
  assert.match(registeredViewportSpec, /must remain on the intended mobile axis/);
  assert.doesNotMatch(registeredViewportSpec, /COACH_HOME_FULL_BLEED_SELECTORS/);
});

test('registered mobile browser contract emulates touch hardware and verifies root overscroll authority', () => {
  assert.match(registeredViewportSpec, /isMobile:\s*true/);
  assert.match(registeredViewportSpec, /hasTouch:\s*true/);
  assert.match(registeredViewportSpec, /overscrollBehaviorX/);
  assert.match(registeredViewportSpec, /horizontal overscroll authority/);
  assert.match(registeredViewportSpec, /page\.mouse\.wheel\(480, 0\)/);
  assert.match(registeredViewportSpec, /visualViewportOffsetLeft/);
});

test('registered WebKit parity measures visible paid Coach gutters on Home, Players, and Events', () => {
  assert.match(webkitViewportSpec, /expectSymmetricVisualGutters/);
  assert.match(webkitViewportSpec, /coach-players-interactive-dashboard/);
  assert.match(webkitViewportSpec, /coach-events-interactive-dashboard/);
  assert.match(webkitViewportSpec, /leftGutter/);
  assert.match(webkitViewportSpec, /rightGutter/);
  assert.match(webkitViewportSpec, /leftGutter - geometry\.rightGutter/);
  for (const width of ['390', '430']) assert.match(webkitViewportSpec, new RegExp(`width: ${width}`));
});

test('Experience Parity executes Chromium, WebKit, and shared Demo/paid mobile scroll regressions', () => {
  assert.match(parityWorkflow, /tests\/e2e\/registered-mobile-viewport-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /tests\/e2e\/registered-mobile-webkit-scroll-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /tests\/e2e\/mobile-demo-paid-horizontal-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /playwright install --with-deps chromium webkit/);
});
