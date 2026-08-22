import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const finalPolish = readFileSync(new URL('../public/shotlab-phase4e-final-polish.css', import.meta.url), 'utf8');
const missionControlLock = readFileSync(new URL('../src/styles/MissionControlCascadeLock2026.css', import.meta.url), 'utf8');
const registeredViewportSpec = readFileSync(new URL('./e2e/registered-mobile-viewport-lock.spec.mjs', import.meta.url), 'utf8');
const parityWorkflow = readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');

test('mobile centering authority clips the authenticated outer shell instead of allowing document panning', () => {
  assert.match(centering, /html,\s*\n\s*body,\s*\n\s*#root\s*\{[\s\S]*overflow-x:\s*clip/);
  assert.match(centering, /\.app-shell\.is-mobile[\s\S]*\.shell-main[\s\S]*\.content-wrap[\s\S]*\.performance-workspace[\s\S]*overflow-x:\s*clip/);
  assert.match(centering, /min-width:\s*0/);
  assert.match(centering, /max-width:\s*100%/);
});

test('registered player and coach content rails include padding inside the mobile viewport width', () => {
  assert.match(finalPolish, /\.performance-shell \.player-scroll-container,\s*\n\s*\.performance-shell \.coach-scroll-container\s*\{[^}]*box-sizing:\s*border-box!important;[^}]*width:\s*100%!important;[^}]*max-width:\s*100%!important;[^}]*min-width:\s*0!important;[^}]*margin-inline:\s*auto!important;/);
});

test('Coach Home retires the registered secondary-page gutter before Mission Control mounts', () => {
  assert.match(missionControlLock, /body\.mission-control-active #root \.performance-workspace--coach,\s*\n\s*html body\.mission-control-active #root \.performance-shell--coach \.coach-scroll-container\s*\{[^}]*width:100%!important;[^}]*max-width:100%!important;[^}]*min-width:0!important;[^}]*margin-left:0!important;[^}]*margin-right:0!important;[^}]*padding-left:0!important;[^}]*padding-right:0!important;[^}]*box-sizing:border-box!important;[^}]*overflow-x:clip!important;/);
});

test('Coach Home final cascade stays on the visual viewport instead of reviving a 100vw breakout', () => {
  assert.match(missionControlLock, /\[data-testid="coach-command-center-full"\]\.mcShellV3\s*\{[^}]*width:100%!important;[^}]*max-width:100%!important;[^}]*min-width:0!important;[^}]*margin-left:0!important;[^}]*margin-right:0!important;[^}]*overflow-x:clip!important;[^}]*box-sizing:border-box!important;/);
  assert.match(missionControlLock, /\[data-testid="coach-command-center-full"\]\.mcShellV3 \.missionControl\s*\{[^}]*width:100%!important;[^}]*max-width:100%!important;[^}]*min-width:0!important;[^}]*box-sizing:border-box!important;/);
  assert.match(missionControlLock, /\.mcHeroContent\s*\{[^}]*width:100%!important;[^}]*max-width:100%!important;[^}]*min-width:0!important;[^}]*box-sizing:border-box!important;/);
  assert.doesNotMatch(missionControlLock, /\[data-testid="coach-command-center-full"\]\.mcShellV3\{[^}]*width:100vw!important/);
});

test('registered Coach Home browser contract requires true full-bleed viewport alignment, not containment alone', () => {
  assert.match(registeredViewportSpec, /COACH_HOME_FULL_BLEED_SELECTORS/);
  assert.match(registeredViewportSpec, /must start on the viewport axis/);
  assert.match(registeredViewportSpec, /must end on the viewport axis/);
  assert.match(registeredViewportSpec, /must not inherit the secondary-page left gutter on Home/);
});

test('Experience Parity executes the registered secondary-route viewport regression', () => {
  assert.match(parityWorkflow, /tests\/e2e\/registered-mobile-viewport-lock\.spec\.mjs/);
});
