import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const authority = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const iphoneSpec = readFileSync(new URL('./e2e/registered-coach-iphone-viewport-authority.spec.mjs', import.meta.url), 'utf8');
const marker = 'Authenticated Coach mobile viewport containment authority.';
const finalAuthority = authority.slice(authority.lastIndexOf(marker));

test('late mobile authority directly contains the document, authenticated shell, and Coach route owner', () => {
  assert.ok(finalAuthority.length > marker.length, 'final authenticated mobile containment block must exist');
  for (const selector of [
    'html,',
    'body,',
    '#root,',
    '.performance-shell--coach.is-mobile,',
    '.performance-shell--coach.is-mobile > .shell-main,',
    '.performance-shell--coach.is-mobile > .shell-main > .content-wrap,',
    '.performance-shell--coach.is-mobile .performance-workspace--coach,',
    '.performance-workspace--coach > div:has([data-testid="coach-command-center-full"]),',
    '.performance-workspace--coach > div:has(> .secondaryPageShell),',
    '.performance-workspace--coach > div:has(> .page.pageShell)',
    '.performance-shell--coach.is-mobile .coach-route-scroll-container',
  ]) assert.ok(finalAuthority.includes(selector), `missing final mobile containment owner ${selector}`);
  assert.match(finalAuthority, /width:\s*100%\s*!important;/);
  assert.match(finalAuthority, /min-width:\s*0\s*!important;/);
  assert.match(finalAuthority, /max-width:\s*100%\s*!important;/);
  assert.match(finalAuthority, /box-sizing:\s*border-box\s*!important;/);
  assert.match(finalAuthority, /overflow-x:\s*clip\s*!important;/);
  assert.match(finalAuthority, /overscroll-behavior-x:\s*none\s*!important;/);
});

test('Coach mobile shell has one top safe-area authority and secondary shells do not add another', () => {
  assert.match(finalAuthority, /--shotlab-auth-mobile-top-start:\s*calc\(env\(safe-area-inset-top,\s*0px\)\s*\+\s*12px\);/);
  assert.match(finalAuthority, /padding-top:\s*var\(--shotlab-auth-mobile-top-start\)\s*!important;/);
  assert.match(finalAuthority, /performance-shell--coach\.is-mobile \.secondaryPageShell,[\s\S]*shared-dashboard-back-action \+ \.secondaryPageShell\s*\{[^}]*padding-top:\s*0\s*!important;/);
});

test('non-horizontal Coach surfaces preserve vertical pan and pinch zoom while horizontal controls remain explicit', () => {
  assert.match(finalAuthority, /touch-action:\s*pan-y pinch-zoom\s*!important;/);
  assert.match(finalAuthority, /touch-action:\s*pan-x pan-y pinch-zoom\s*!important;/);
  assert.match(finalAuthority, /:not\(:has\(:is\(\.h-scroll,\[data-horizontal-scroll\],\[data-scroll-axis="x"\],\[role="slider"\],input\[type="range"\]\)\)\)/);
});

test('iPhone WebKit regression measures visual viewport title safety and sustained finger dragging', () => {
  assert.match(iphoneSpec, /webkit\.launch\(\)/);
  assert.match(iphoneSpec, /iPhone OS 26_0/);
  assert.match(iphoneSpec, /isMobile:\s*true/);
  assert.match(iphoneSpec, /hasTouch:\s*true/);
  assert.match(iphoneSpec, /window\.visualViewport/);
  assert.match(iphoneSpec, /SUSTAINED_TOUCH_STEPS = 12/);
  assert.match(iphoneSpec, /for \(let step = 1; step <= steps; step \+= 1\)/);
  assert.match(iphoneSpec, /defaultPrevented/);
  assert.match(iphoneSpec, /title .* safe-area top/);
  assert.match(iphoneSpec, /visual viewport x/);
  assert.match(iphoneSpec, /touch policy must preserve vertical pan/);
  assert.match(iphoneSpec, /touch policy must preserve pinch zoom/);
});
