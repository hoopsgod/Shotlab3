import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const finalAxisAuthority = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const guard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const parityWorkflow = readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');
const sharedSpec = readFileSync(new URL('./e2e/mobile-demo-paid-horizontal-lock.spec.mjs', import.meta.url), 'utf8');

test('mobile document and shared Demo/paid page owners use a non-scrollable x boundary', () => {
  assert.match(centering, /html,\s*\n\s*body,\s*\n\s*#root\s*\{[^}]*overflow-x:\s*hidden;[^}]*overflow-x:\s*clip\s*!important;[^}]*overscroll-behavior-x:\s*none;/);
  assert.match(finalAxisAuthority, /#root > \.app-shell\.is-mobile > \.shell-main > \.content-wrap[\s\S]*inline-size:\s*100%\s*!important;[\s\S]*margin-inline:\s*0\s*!important;[\s\S]*padding-inline:\s*0\s*!important;[\s\S]*overflow-x:\s*clip\s*!important;/);
  assert.match(finalAxisAuthority, /performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap,[\s\S]*coach-command-center-full[\s\S]*inline-size:\s*100%\s*!important;[\s\S]*padding-inline:\s*0\s*!important;/);
});

test('final mobile viewport axis authority loads after every authenticated visual layer', () => {
  const phase7 = main.indexOf("await import('./components/Phase7AuthenticatedChrome.css')");
  const finalAxis = main.indexOf("await import('./styles/MobileViewportAxisAuthority2026.css')");
  assert.ok(phase7 >= 0, 'Phase 7 authenticated chrome import must exist');
  assert.ok(finalAxis > phase7, 'mobile viewport axis authority must load after Phase 7');
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

test('shared browser certification covers Demo and paid Coach/Player at all target widths against the visual viewport axis', () => {
  for (const width of ['320', '375', '390', '430']) assert.match(sharedSpec, new RegExp(`width: ${width}`));
  assert.match(sharedSpec, /for \(const mode of \['demo', 'paid'\]\)/);
  assert.match(sharedSpec, /for \(const role of \['coach', 'player'\]\)/);
  assert.match(sharedSpec, /performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap/);
  assert.match(sharedSpec, /visualViewportCenter/);
  assert.match(sharedSpec, /dashboard must have symmetric visual-viewport gutters/);
  assert.match(sharedSpec, /forceInvalidHorizontalState/);
  assert.match(sharedSpec, /Input\.dispatchTouchEvent/);
  assert.match(parityWorkflow, /tests\/e2e\/mobile-demo-paid-horizontal-lock\.spec\.mjs/);
});
