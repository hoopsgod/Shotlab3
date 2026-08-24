import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shouldContainRegisteredHorizontalGesture } from '../src/lib/mobileHorizontalViewportLock.js';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const authenticatedAuthority = readFileSync(new URL('../src/styles/AuthenticatedVisualAuthority2026.css', import.meta.url), 'utf8');
const finalAxisAuthority = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const guard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const parityWorkflow = readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');
const sharedSpec = readFileSync(new URL('./e2e/mobile-demo-paid-horizontal-lock.spec.mjs', import.meta.url), 'utf8');

test('mobile document and shared Demo/paid role shells use one split x-axis authority', () => {
  assert.match(centering, /html,\s*\n\s*body,\s*\n\s*#root\s*\{[^}]*overflow-x:\s*hidden;[^}]*overflow-x:\s*clip\s*!important;[^}]*overscroll-behavior-x:\s*none;/);
  assert.match(centering, /\.app-shell\.is-mobile,[\s\S]*\.shell-main,[\s\S]*\.content-wrap,[\s\S]*\.performance-workspace,[\s\S]*overflow-x:\s*clip\s*!important;[\s\S]*overscroll-behavior-x:\s*none;/);
  assert.match(finalAxisAuthority, /performance-shell--player\.is-mobile \.player-scroll-container[^}]*padding-inline:\s*20px\s*!important/);
  assert.match(finalAxisAuthority, /performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap[\s\S]*padding-inline:\s*0\s*!important/);
  assert.match(finalAxisAuthority, /performance-shell--coach\.is-mobile \.performance-workspace--coach\s*\{[^}]*--shotlab-coach-route-wrapper-gutter:\s*var\(--shotlab-mobile-content-rail,\s*20px\);/);
  assert.match(authenticatedAuthority, /--shotlab-coach-route-wrapper-gutter:\s*var\(--shotlab-mobile-content-rail\);/);
  assert.match(authenticatedAuthority, /performance-shell--coach \.secondaryPageShell\s*\{[^}]*padding-inline:\s*0\s*!important/);
  assert.doesNotMatch(finalAxisAuthority, /performance-shell--coach\.is-mobile :is\([\s\S]*coach-scroll-container[\s\S]*padding-inline:\s*0\s*!important/);
  assert.doesNotMatch(finalAxisAuthority, /performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap[^}]*padding-inline:\s*20px\s*!important/);
  assert.doesNotMatch(finalAxisAuthority, /calc\(100% - 40px\)/);
  assert.doesNotMatch(finalAxisAuthority, /margin-inline:\s*20px\s*!important/);
});

test('final mobile viewport axis authority loads after every authenticated visual layer', () => {
  const phase7 = main.indexOf("await import('./components/Phase7AuthenticatedChrome.css')");
  const finalAxis = main.indexOf("await import('./styles/MobileViewportAxisAuthority2026.css')");
  assert.ok(phase7 >= 0, 'Phase 7 authenticated chrome import must exist');
  assert.ok(finalAxis > phase7, 'mobile viewport axis authority must load after Phase 7');
});

test('runtime blocks horizontal-dominant outer touch movement before Safari can translate the viewport', () => {
  assert.equal(shouldContainRegisteredHorizontalGesture({ deltaX: 42, deltaY: 5 }), true);
  assert.equal(shouldContainRegisteredHorizontalGesture({ deltaX: 42, deltaY: 50 }), false);
  assert.equal(shouldContainRegisteredHorizontalGesture({ deltaX: 5, deltaY: 0 }), false);
  assert.equal(shouldContainRegisteredHorizontalGesture({ deltaX: 42, deltaY: 5, targetIsHorizontalOwner: true }), false);
  assert.match(guard, /INTENTIONAL_HORIZONTAL_GESTURE_SELECTOR/);
  assert.match(guard, /input\[type="range"\]/);
  assert.match(guard, /touchAction\.includes\('pan-x'\)/);
  assert.match(guard, /document\.addEventListener\('touchmove', handleTouchMove, \{ passive: false, capture: true \}\)/);
  assert.match(guard, /event\.cancelable\) event\.preventDefault\(\)/);
  assert.match(guard, /event\.touches\?\.length !== 1/);
});

test('runtime installs one shared guard against invalid outer scrollLeft using the real Coach layout owner', () => {
  assert.match(main, /import \{ installMobileHorizontalViewportLock \} from ['"]\.\/lib\/mobileHorizontalViewportLock\.js['"]/);
  assert.match(main, /installMobileHorizontalViewportLock\(\)/);
  assert.match(guard, /LOCKED_VERTICAL_OWNER_SELECTORS/);
  assert.match(guard, /\.player-scroll-container/);
  assert.match(guard, /\.performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap/);
  assert.doesNotMatch(guard, /\.coach-scroll-container/);
  assert.match(guard, /coach-command-center-full/);
  assert.match(guard, /player-daily-command-center/);
  assert.match(guard, /node\.scrollLeft = 0/);
  assert.match(guard, /document\.addEventListener\('scroll', handleCapturedScroll, true\)/);
  assert.doesNotMatch(guard, /querySelectorAll\(['"]\*['"]\)/);
});

test('shared browser certification covers current Demo entry and paid Coach/Player at all target widths', () => {
  for (const width of ['320', '375', '390', '430']) assert.match(sharedSpec, new RegExp(`width: ${width}`));
  assert.match(sharedSpec, /for \(const mode of \['demo', 'paid'\]\)/);
  assert.match(sharedSpec, /for \(const role of \['coach', 'player'\]\)/);
  assert.match(sharedSpec, /page\.goto\('\/\?demo=1'\)/);
  assert.match(sharedSpec, /Coach demo/);
  assert.match(sharedSpec, /Player demo/);
  assert.doesNotMatch(sharedSpec, /\?demo=\$\{role\}/);
  assert.match(sharedSpec, /performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap/);
  assert.match(sharedSpec, /visualViewportCenter/);
  assert.match(sharedSpec, /dashboard must have symmetric visual-viewport gutters/);
  assert.match(sharedSpec, /forceInvalidHorizontalState/);
  assert.match(sharedSpec, /Input\.dispatchTouchEvent/);
  assert.match(sharedSpec, /defaultPrevented/);
  assert.match(sharedSpec, /preventedCount/);
  assert.match(sharedSpec, /outer horizontal touchmove must be cancelled while finger is down/);
  assert.match(parityWorkflow, /tests\/e2e\/mobile-demo-paid-horizontal-lock\.spec\.mjs/);
});
