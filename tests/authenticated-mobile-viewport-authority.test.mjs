import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const authority = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const guard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');
const iphoneSpec = readFileSync(new URL('./e2e/registered-coach-iphone-viewport-authority.spec.mjs', import.meta.url), 'utf8');

test('structural mobile authority contains roots, authenticated shell ancestry, and every Coach route-owner shape', () => {
  assert.match(centering, /html,body,#root\{[^}]*width:100%;[^}]*min-width:0;[^}]*max-width:100%;[^}]*overflow-x:clip !important;[^}]*overscroll-behavior-x:none/);
  for (const selector of [
    '.app-shell.is-mobile',
    '.app-shell.is-mobile>.shell-main',
    '.app-shell.is-mobile>.shell-main>.content-wrap',
    '.app-shell.is-mobile .performance-workspace',
    '.performance-workspace--coach>div:has(>.page.pageShell)',
    '.performance-workspace--coach>div:has(>.secondaryPageShell)',
    '.performance-workspace--coach>div:has([data-testid="coach-command-center-full"])',
  ]) assert.ok(centering.includes(selector), `missing structural containment owner ${selector}`);
  assert.match(centering, /\{width:100%;min-width:0;max-width:100%;box-sizing:border-box;overflow-x:clip !important\}/);
});

test('runtime owns the authenticated Coach safe-area start and removes nested top competition', () => {
  assert.match(guard, /COACH_AUTHENTICATED_TOP_START = 'calc\(env\(safe-area-inset-top, 0px\) \+ 12px\)'/);
  assert.match(guard, /routeOwner\.style\.setProperty\('padding-top', COACH_AUTHENTICATED_TOP_START\)/);
  assert.match(guard, /querySelectorAll\('\.secondaryPageShell'\)[^\n]*setProperty\('padding-top', '0px'\)/);
  assert.match(guard, /querySelectorAll\('\.secondaryPageShell'\)[^\n]*removeProperty\('padding-top'\)/);
  assert.match(guard, /'padding-top'/);
  assert.doesNotMatch(authority, /safe-area-inset-top/);
});

test('runtime applies pan-y pinch-zoom only to non-horizontal Coach surfaces and cleans it on exit', () => {
  assert.match(guard, /COACH_VERTICAL_TOUCH_SURFACE_SELECTOR/);
  assert.match(guard, /\[data-visual-role="page-intro"\]/);
  assert.match(guard, /\.mcHeroContent/);
  assert.match(guard, /setProperty\('touch-action', 'pan-y pinch-zoom'\)/);
  assert.match(guard, /data-shotlab-vertical-touch/);
  assert.match(guard, /removeProperty\('touch-action'\)/);
  assert.doesNotMatch(authority, /touch-action:\s*pan-y pinch-zoom/);
});

test('obsolete Leaderboards-only top offset cannot compete with the shared safe-area start', () => {
  assert.doesNotMatch(authority, /coach-page-dashboard-leaderboards[^}]*margin-top:\s*14px\s*!important/);
});

test('iPhone WebKit regression measures required authority owners, root overscroll, visual viewport title safety, and sustained finger dragging', () => {
  assert.match(iphoneSpec, /webkit\.launch\(\)/);
  assert.match(iphoneSpec, /iPhone OS 26_0/);
  assert.match(iphoneSpec, /isMobile:\s*true/);
  assert.match(iphoneSpec, /hasTouch:\s*true/);
  assert.match(iphoneSpec, /window\.visualViewport/);
  assert.match(iphoneSpec, /SUSTAINED_TOUCH_STEPS = 12/);
  assert.match(iphoneSpec, /DOCUMENT_OVERSCROLL_OWNERS = new Set\(\['html', 'body', 'root'\]\)/);
  assert.match(iphoneSpec, /routeOwner:\s*'\.performance-shell--coach\.is-mobile \.coach-route-scroll-container'/);
  assert.doesNotMatch(iphoneSpec, /shellMain:|contentWrap:|workspace:/);
  assert.match(iphoneSpec, /for \(let step = 1; step <= steps; step \+= 1\)/);
  assert.match(iphoneSpec, /defaultPrevented/);
  assert.match(iphoneSpec, /title .* safe-area top/);
  assert.match(iphoneSpec, /visual viewport x/);
  assert.match(iphoneSpec, /touch policy must preserve vertical pan/);
  assert.match(iphoneSpec, /touch policy must preserve pinch zoom/);
});
