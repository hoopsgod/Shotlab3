import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertDeclaration, mediaBlock, ruleBlock } from './helpers/css-contract.mjs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const authenticatedAuthority = readFileSync(new URL('../src/styles/AuthenticatedVisualAuthority2026.css', import.meta.url), 'utf8');
const finalAxis = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const dashboards = readFileSync(new URL('../src/components/CoachInteractiveDashboards.css', import.meta.url), 'utf8');
const missionControlLock = readFileSync(new URL('../src/styles/MissionControlCascadeLock2026.css', import.meta.url), 'utf8');
const coachTitleCss = readFileSync(new URL('../src/components/CoachMissionControlTitleStage.css', import.meta.url), 'utf8');
const coachShellCss = readFileSync(new URL('../src/components/CoachMissionControlShell.css', import.meta.url), 'utf8');
const registeredViewportSpec = readFileSync(new URL('./e2e/registered-mobile-viewport-lock.spec.mjs', import.meta.url), 'utf8');
const webkitViewportSpec = readFileSync(new URL('./e2e/registered-mobile-webkit-scroll-lock.spec.mjs', import.meta.url), 'utf8');
const parityWorkflow = readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '');
const mobileCentering = mediaBlock(centering, '(max-width:760px)');
const documentAxis = ruleBlock(mobileCentering, 'html,body,#root');
const sharedRoleAxis = ruleBlock(mobileCentering, '.app-shell.is-mobile');
const compactCentering = centering.replace(/\s+/g, '');

test('mobile viewport authority uses a true non-scrollable x boundary and stops overscroll chaining', () => {
  assert.match(documentAxis, /(?:^|;)\s*overflow-x:\s*hidden(?:;|$)/);
  assert.match(documentAxis, /(?:^|;)\s*overflow-x:\s*clip\s*!important(?:;|$)/);
  assertDeclaration(documentAxis, 'overscroll-behavior-x', 'none');
  for (const selector of ['.app-shell.is-mobile','.app-shell.is-mobile>.shell-main','.app-shell.is-mobile>.shell-main>.content-wrap','.performance-workspace','.player-scroll-container','.coach-scroll-container']) assert.ok(compactCentering.includes(selector), `shared mobile x-axis authority missing ${selector}`);
  assertDeclaration(sharedRoleAxis, 'overflow-x', /^clip\s*!important$/);
  assertDeclaration(documentAxis, 'min-width', '0');
  assertDeclaration(documentAxis, 'max-width', '100%');
  assertDeclaration(documentAxis, 'box-sizing', 'border-box');
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
  const mobileCoach = mediaBlock(coachTitleCss, '(max-width:700px)');
  const focusGrid = ruleBlock(mobileCoach, '.mcFocusGrid');
  const lowerGrid = ruleBlock(mobileCoach, '.mcLowerGrid');
  assertDeclaration(focusGrid, 'display', 'grid');
  assertDeclaration(focusGrid, 'grid-template-columns', 'minmax(0,1fr)');
  assertDeclaration(lowerGrid, 'display', 'grid');
  assertDeclaration(lowerGrid, 'grid-template-columns', 'minmax(0,1fr)');
  assert.doesNotMatch(stripComments(missionControlLock), /\.mcFocusGrid|\.mcLowerGrid/);
  assert.match(authenticatedAuthority, /performance-shell--coach \.secondaryPageShell\s*\{[^}]*width:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*min-width:\s*0\s*!important;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important;/);
  assert.match(authenticatedAuthority, /performance-shell--coach \.secondaryPageShell > \*\s*\{[^}]*min-width:\s*0\s*!important;[^}]*max-width:\s*100%\s*!important;[^}]*box-sizing:\s*border-box\s*!important;/);
});

test('shared player and coach page owners cannot become persistent horizontal scroll owners', () => {
  for (const selector of ['.player-scroll-container','.coach-scroll-container','.performance-workspace--coach>div:has(>.page.pageShell)','.performance-workspace--coach>div:has(>.secondaryPageShell)','[data-testid="coach-command-center-full"]','[data-testid="player-daily-command-center"]']) assert.ok(compactCentering.includes(selector), `shared mobile x-axis authority missing ${selector}`);
  assertDeclaration(sharedRoleAxis, 'overflow-x', /^clip\s*!important$/);
  assert.match(centering, /margin-inline:\s*auto(?:\s*!important)?(?:;|})/);
  assert.doesNotMatch(centering, /touch-action:\s*pan-y pinch-zoom/);
  assert.match(registeredViewportSpec, /REGISTERED_CONTENT_RAIL_SELECTORS/);
  assert.match(registeredViewportSpec, /rail\.scrollLeft = 240/);
  assert.match(registeredViewportSpec, /registered content rail must reject persistent horizontal scrollLeft/);
  assert.match(webkitViewportSpec, /rail\.scrollLeft = 240/);
  assert.match(webkitViewportSpec, /railScrollLeft/);
  assert.match(registeredViewportSpec, /scrollWidth[^\n]*clientWidth \+ 1/);
  assert.match(registeredViewportSpec, /coach-ambient-glow/);
  assert.match(webkitViewportSpec, /scrollWidth[^\n]*clientWidth \+ 1/);
  assert.match(webkitViewportSpec, /coach-ambient-glow/);
});

test('Coach Home removes the registered parent offset before Mission Control mounts', () => {
  const shellBridge = mediaBlock(coachShellCss, '(max-width:980px)');
  // The final grouped ancestry rule ends with the team-brand owner and applies
  // the same width/max-width/margin/padding declarations to app-shell,
  // shell-main, content-wrap, and the Coach page container.
  const outerOwners = ruleBlock(shellBridge, 'body.mission-control-active .team-brand.coach-mode.page');
  assertDeclaration(outerOwners, 'width', '100%!important');
  assertDeclaration(outerOwners, 'max-width', 'none!important');
  assertDeclaration(outerOwners, 'margin', '0!important');
  assertDeclaration(outerOwners, 'padding', '0!important');
  assert.doesNotMatch(stripComments(missionControlLock), /\.app-shell|\.shell-main|\.content-wrap|\.team-brand\.coach-mode\.page/);
  for (const selector of ['.app-shell.is-mobile','.app-shell.is-mobile>.shell-main','.app-shell.is-mobile>.shell-main>.content-wrap']) assert.ok(compactCentering.includes(selector), `Coach Home parent x-axis authority missing ${selector}`);
  assertDeclaration(sharedRoleAxis, 'overflow-x', /^clip\s*!important$/);
});

test('Coach Home final source authority stays on the visual viewport instead of reviving a 100vw breakout', () => {
  const mobileCoach = mediaBlock(coachTitleCss, '(max-width:700px)');
  const shell = ruleBlock(mobileCoach, '.mcShellV3');
  const missionControl = ruleBlock(mobileCoach, '.missionControl');
  const heroContent = ruleBlock(mobileCoach, '.mcHeroContent');
  assertDeclaration(shell, 'display', 'block');
  assertDeclaration(shell, 'width', '100%');
  assertDeclaration(shell, 'margin', '0');
  assertDeclaration(shell, 'overflow-x', 'hidden');
  assertDeclaration(missionControl, 'max-width', 'none');
  assertDeclaration(missionControl, 'margin', '0');
  assertDeclaration(heroContent, 'width', '100%');
  assert.doesNotMatch(coachTitleCss, /width:\s*100vw/);
  assert.doesNotMatch(stripComments(missionControlLock), /\.mcShellV3|\.missionControl|\.mcHeroContent/);
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
  for (const width of ['320', '375', '390', '430']) assert.match(webkitViewportSpec, new RegExp(`width: ${width}`));
});

test('Experience Parity executes Chromium, WebKit, and shared Demo/paid mobile scroll regressions', () => {
  assert.match(parityWorkflow, /tests\/e2e\/registered-mobile-viewport-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /tests\/e2e\/registered-mobile-webkit-scroll-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /tests\/e2e\/mobile-demo-paid-horizontal-lock\.spec\.mjs/);
  assert.match(parityWorkflow, /playwright install --with-deps chromium webkit/);
});
