import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const authority = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const iphoneSpec = readFileSync(new URL('./e2e/registered-coach-iphone-viewport-authority.spec.mjs', import.meta.url), 'utf8');
const marker = 'Authenticated Coach mobile viewport containment authority.';
const finalAuthority = authority.slice(authority.lastIndexOf(marker));

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

test('Coach mobile route owner has the only safe-area start and secondary shells do not add another', () => {
  assert.match(finalAuthority, /coach-route-scroll-container\s*\{[^}]*padding-top:\s*calc\(env\(safe-area-inset-top,\s*0px\)\s*\+\s*12px\)\s*!important;/);
  assert.match(finalAuthority, /secondaryPageShell\s*\{[^}]*padding-top:\s*0\s*!important;/);
});

test('non-horizontal Coach surfaces preserve vertical pan and pinch zoom without constraining the route ancestor', () => {
  assert.match(finalAuthority, /:is\(\[data-visual-role="page-intro"\],\s*\.mcHeroContent\)\s*\{[^}]*touch-action:\s*pan-y pinch-zoom\s*!important;/);
  assert.doesNotMatch(finalAuthority, /coach-route-scroll-container\s*\{[^}]*touch-action:/);
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
