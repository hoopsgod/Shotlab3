import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const guard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const parityWorkflow = readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');
const sharedSpec = readFileSync(new URL('./e2e/mobile-demo-paid-horizontal-lock.spec.mjs', import.meta.url), 'utf8');

test('mobile document and shared Demo/paid page owners use a non-scrollable x boundary', () => {
  assert.match(centering, /html,\s*\n\s*body,\s*\n\s*#root\s*\{[^}]*overflow-x:\s*hidden;[^}]*overflow-x:\s*clip\s*!important;[^}]*overscroll-behavior-x:\s*none;/);
  assert.match(centering, /\.player-scroll-container,[\s\S]*\.coach-scroll-container,[\s\S]*\.coach-route-scroll-container,[\s\S]*\.coach-home-dashboard,[\s\S]*coach-command-center-full[\s\S]*player-daily-command-center[\s\S]*overflow-x:\s*clip\s*!important;/);
  assert.match(centering, /touch-action:\s*pan-y pinch-zoom/);
});

test('runtime installs one shared guard that resets invalid outer scrollLeft without touching arbitrary descendants', () => {
  assert.match(main, /import \{ installMobileHorizontalViewportLock \} from ['"]\.\/lib\/mobileHorizontalViewportLock\.js['"]/);
  assert.match(main, /installMobileHorizontalViewportLock\(\)/);
  assert.match(guard, /LOCKED_VERTICAL_OWNER_SELECTORS/);
  assert.match(guard, /\.player-scroll-container/);
  assert.match(guard, /\.coach-scroll-container/);
  assert.match(guard, /coach-command-center-full/);
  assert.match(guard, /player-daily-command-center/);
  assert.match(guard, /node\.scrollLeft = 0/);
  assert.match(guard, /document\.addEventListener\('scroll', handleCapturedScroll, true\)/);
  assert.match(guard, /window\.addEventListener\('touchend', scheduleCorrection/);
  assert.doesNotMatch(guard, /querySelectorAll\(['"]\*['"]\)/);
});

test('shared browser certification covers Demo and paid Coach/Player at all target mobile widths with forced and touch panning', () => {
  for (const width of ['320', '375', '390', '430']) assert.match(sharedSpec, new RegExp(`width: ${width}`));
  assert.match(sharedSpec, /for \(const mode of \['demo', 'paid'\]\)/);
  assert.match(sharedSpec, /for \(const role of \['coach', 'player'\]\)/);
  assert.match(sharedSpec, /forceInvalidHorizontalState/);
  assert.match(sharedSpec, /Input\.dispatchTouchEvent/);
  assert.match(sharedSpec, /dashboard lost center axis after finger pan/);
  assert.match(parityWorkflow, /tests\/e2e\/mobile-demo-paid-horizontal-lock\.spec\.mjs/);
});
