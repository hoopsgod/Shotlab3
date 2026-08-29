import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assertDeclaration, mediaBlock, ruleBlock } from './helpers/css-contract.mjs';

const coachShellCss = fs.readFileSync(new URL('../src/components/CoachMissionControlShell.css', import.meta.url), 'utf8');
const coachTitleCss = fs.readFileSync(new URL('../src/components/CoachMissionControlTitleStage.css', import.meta.url), 'utf8');
const missionControlLock = fs.readFileSync(new URL('../src/styles/MissionControlCascadeLock2026.css', import.meta.url), 'utf8');
const mobileAxisCss = fs.readFileSync(new URL('../src/styles/MobileViewportAxisAuthority.css', import.meta.url), 'utf8');
const registeredViewportSpec = fs.readFileSync(new URL('./e2e/registered-mobile-viewport-lock.spec.mjs', import.meta.url), 'utf8');
const webkitViewportSpec = fs.readFileSync(new URL('./e2e/registered-mobile-webkit-scroll-lock.spec.mjs', import.meta.url), 'utf8');
const demoPaidViewportSpec = fs.readFileSync(new URL('./e2e/mobile-demo-paid-horizontal-lock.spec.mjs', import.meta.url), 'utf8');
const parityWorkflow = fs.readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '');
const compact = (source) => stripComments(source).replace(/\s+/g, ' ');
const compactCentering = compact(mobileAxisCss);
const sharedRoleAxis = ruleBlock(mobileAxisCss, '.performance-shell--coach.is-mobile');
const centering = ruleBlock(mobileAxisCss, '.app-shell.is-mobile');

test('mobile document and shared Demo/paid role shells use one split x-axis authority', () => {
  const root = ruleBlock(mobileAxisCss, 'html');
  assertDeclaration(root, 'overflow-x', /^clip\s*!important$/);
  for (const selector of [
    '.performance-shell--coach.is-mobile',
    '.performance-shell--player.is-mobile',
    '.performance-workspace--coach',
    '.performance-workspace--player',
    '.performance-workspace--coach>div:has(>.secondaryPageShell)',
    '[data-testid="coach-command-center-full"]',
    '[data-testid="player-daily-command-center"]',
  ]) assert.ok(compactCentering.includes(selector), `shared mobile x-axis authority missing ${selector}`);
  assertDeclaration(sharedRoleAxis, 'overflow-x', /^clip\s*!important$/);
  assert.match(centering, /margin-inline:\s*auto(?:\s*!important)?(?:;|})/);
  assert.doesNotMatch(centering, /touch-action:\s*pan-y pinch-zoom/);
  assert.match(registeredViewportSpec, /REGISTERED_CONTENT_RAIL_SELECTORS/);
  assert.match(registeredViewportSpec, /rail\.scrollLeft = 240/);
  assert.match(registeredViewportSpec, /registered content rail must reject persistent horizontal scrollLeft/);
  assert.match(webkitViewportSpec, /rail\.scrollLeft = 240/);
  assert.match(webkitViewportSpec, /railScrollLeft/);
});

test('Coach Home removes the registered parent offset before Mission Control mounts', () => {
  const shellBridge = mediaBlock(coachShellCss, '(max-width:980px)');
  // The first .app-shell rule establishes grid/overflow containment; the second,
  // grouped parent-axis rule owns width/max-width/margin/padding for the entire
  // Coach Home ancestry. Inspect that final geometry rule rather than assuming
  // all declarations live in the first matching selector block.
  const outerOwners = ruleBlock(shellBridge, 'body.mission-control-active .app-shell', 1);
  assertDeclaration(outerOwners, 'width', '100%!important');
  assertDeclaration(outerOwners, 'max-width', 'none!important');
  assertDeclaration(outerOwners, 'margin', '0!important');
  assertDeclaration(outerOwners, 'padding', '0!important');
  assert.doesNotMatch(stripComments(missionControlLock), /\.app-shell|\.shell-main|\.content-wrap|\.team-brand\.coach-mode\.page/);
  for (const selector of [
    '.app-shell.is-mobile',
    '.app-shell.is-mobile>.shell-main',
    '.app-shell.is-mobile>.shell-main>.content-wrap',
  ]) assert.ok(compactCentering.includes(selector), `Coach Home parent x-axis authority missing ${selector}`);
  assertDeclaration(sharedRoleAxis, 'overflow-x', /^clip\s*!important$/);
});

test('Coach Home final source authority stays on the visual viewport instead of reviving a 100vw breakout', () => {
  const mobileCoach = mediaBlock(coachTitleCss, '(max-width:700px)');
  assert.doesNotMatch(mobileCoach, /100vw/);
  assert.doesNotMatch(coachShellCss, /width:\s*100vw\s*!important/);
  assert.match(coachShellCss, /\.mcShellV3\.is-mobile-shell\{[^}]*width:100%!important/);
  assert.match(coachShellCss, /\.mcShellV3\.is-mobile-shell\{[^}]*max-width:100%!important/);
  assert.match(coachShellCss, /\.mcShellV3\.is-mobile-shell\{[^}]*overflow-x:clip!important/);
});

test('registered Coach Home browser contract requires a symmetric mobile axis, not containment alone', () => {
  assert.match(registeredViewportSpec, /coach-command-center-full/);
  assert.match(registeredViewportSpec, /leftGap/);
  assert.match(registeredViewportSpec, /rightGap/);
  assert.match(registeredViewportSpec, /gutterDelta/);
  assert.match(registeredViewportSpec, /toBeLessThanOrEqual\(2\)/);
});

test('registered mobile browser contract emulates touch hardware and verifies root overscroll authority', () => {
  assert.match(registeredViewportSpec, /hasTouch:\s*true/);
  assert.match(registeredViewportSpec, /isMobile:\s*true/);
  assert.match(registeredViewportSpec, /overscrollBehaviorX/);
});

test('registered WebKit parity measures visible paid Coach gutters on Home, Players, and Events', () => {
  assert.match(webkitViewportSpec, /coach-command-center-full/);
  assert.match(webkitViewportSpec, /coach-players-interactive-dashboard/);
  assert.match(webkitViewportSpec, /coach-events-interactive-dashboard/);
  assert.match(webkitViewportSpec, /gutterDelta/);
  assert.match(webkitViewportSpec, /toBeLessThanOrEqual\(2\)/);
});

test('Experience Parity executes Chromium, WebKit, and shared Demo/paid mobile scroll regressions', () => {
  assert.match(parityWorkflow, /registered-mobile-viewport-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /registered-mobile-webkit-scroll-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /mobile-demo-paid-horizontal-lock\.spec\.mjs/);
  assert.match(demoPaidViewportSpec, /Coach demo/);
  assert.match(demoPaidViewportSpec, /Player demo/);
});
