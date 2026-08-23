import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const finalPolish = readFileSync(new URL('../public/shotlab-phase4e-final-polish.css', import.meta.url), 'utf8');
const missionControlLock = readFileSync(new URL('../src/styles/MissionControlCascadeLock2026.css', import.meta.url), 'utf8');
const registeredViewportSpec = readFileSync(new URL('./e2e/registered-mobile-viewport-lock.spec.mjs', import.meta.url), 'utf8');
const webkitViewportSpec = readFileSync(new URL('./e2e/registered-mobile-webkit-scroll-lock.spec.mjs', import.meta.url), 'utf8');
const parityWorkflow = readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');

test('mobile viewport authority prevents root horizontal scrolling and iOS-style overscroll chaining', () => {
  assert.match(centering, /html,\s*\n\s*body\s*\{[^}]*overflow-x:\s*hidden;[^}]*overscroll-behavior-x:\s*none;/);
  assert.match(centering, /#root\s*\{[^}]*overflow-x:\s*clip;[^}]*overscroll-behavior-x:\s*none;/);
  assert.match(centering, /\.app-shell\.is-mobile[\s\S]*\.shell-main[\s\S]*\.content-wrap[\s\S]*\.performance-workspace[\s\S]*overflow-x:\s*clip;[\s\S]*overscroll-behavior-x:\s*none;/);
  assert.match(centering, /min-width:\s*0/);
  assert.match(centering, /max-width:\s*100%/);
});

test('registered player and coach content rails include padding inside the mobile viewport width', () => {
  assert.match(finalPolish, /\.performance-shell \.player-scroll-container,\s*\n\s*\.performance-shell \.coach-scroll-container\s*\{[^}]*box-sizing:\s*border-box!important;[^}]*width:\s*100%!important;[^}]*max-width:\s*100%!important;[^}]*min-width:\s*0!important;[^}]*margin-inline:\s*auto!important;/);
});

test('registered player and coach page rails cannot become persistent horizontal scroll owners', () => {
  assert.match(centering, /\.performance-shell \.player-scroll-container,\s*\n\s*html body #root \.performance-shell \.coach-scroll-container\s*\{[^}]*overflow-x:\s*clip\s*!important;[^}]*overscroll-behavior-x:\s*none\s*!important;/);
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

test('Experience Parity executes Chromium and WebKit registered mobile scroll regressions', () => {
  assert.match(parityWorkflow, /tests\/e2e\/registered-mobile-viewport-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /tests\/e2e\/registered-mobile-webkit-scroll-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /playwright install --with-deps chromium webkit/);
});
