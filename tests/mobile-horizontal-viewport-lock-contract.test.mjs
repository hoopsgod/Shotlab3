import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shouldContainRegisteredHorizontalGesture } from '../src/lib/mobileHorizontalViewportLock.js';
import { assertDeclaration, mediaBlock, ruleBlock } from './helpers/css-contract.mjs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const authenticatedAuthority = readFileSync(new URL('../src/styles/AuthenticatedVisualAuthority2026.css', import.meta.url), 'utf8');
const finalAxisAuthority = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const guard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../src/components/AuthWorkspace.jsx', import.meta.url), 'utf8');
const parityWorkflow = readFileSync(new URL('../.github/workflows/demo-paid-parity.yml', import.meta.url), 'utf8');
const sharedSpec = readFileSync(new URL('./e2e/mobile-demo-paid-horizontal-lock.spec.mjs', import.meta.url), 'utf8');
const mobileCentering = mediaBlock(centering, '(max-width:760px)');
const documentAxis = ruleBlock(mobileCentering, 'html,body,#root');
const sharedRoleAxis = ruleBlock(mobileCentering, '.app-shell.is-mobile');
const compactCentering = centering.replace(/\s+/g, '');

test('mobile document and shared Demo/paid role shells use one split x-axis authority', () => {
  assert.match(documentAxis, /(?:^|;)\s*overflow-x:\s*hidden(?:;|$)/);
  assert.match(documentAxis, /(?:^|;)\s*overflow-x:\s*clip\s*!important(?:;|$)/);
  assertDeclaration(documentAxis, 'overscroll-behavior-x', 'none');
  for (const selector of [
    '.app-shell.is-mobile',
    '.app-shell.is-mobile>.shell-main',
    '.app-shell.is-mobile>.shell-main>.content-wrap',
    '.performance-workspace',
  ]) {
    assert.ok(compactCentering.includes(selector), `shared mobile x-axis authority missing ${selector}`);
  }
  assertDeclaration(sharedRoleAxis, 'overflow-x', /^clip\s*!important$/);
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

test('Coach ambient decoration has a stable hook and source geometry normalized without extra CSS payload', () => {
  assert.match(app, /className="coach-ambient-glow coach-ambient-glow--top-right"/);
  assert.match(app, /dataTestId="coach-ambient-glow"/);
  assert.match(guard, /COACH_HOME_AMBIENT_LEFT = 'min\(80%, calc\(100% - 125px\)\)'/);
  assert.match(guard, /document\.querySelector\('\[data-testid="coach-ambient-glow"\]'\)/);
  assert.match(guard, /ambient\.style\.left = COACH_HOME_AMBIENT_LEFT/);
  assert.doesNotMatch(finalAxisAuthority, /coach-ambient-glow--top-right/);
});

test('Coach Program Pulse reuses the production surface-variable contract instead of adding protected CSS', () => {
  assert.match(guard, /document\.querySelector\('\[data-testid="coach-program-pulse"\]'\)/);
  assert.match(guard, /\['--sl-surface', 'linear-gradient\(150deg,#0b2231,var\(--team-brand-surface-deep,#06151d\)\)'\]/);
  assert.match(guard, /\['--sl-ink', '#f4f7f8'\]/);
  assert.match(guard, /\['--mc-surface-ink', '#f4f7f8'\]/);
  assert.match(guard, /\['--mc-surface-copy', '#9ba7ad'\]/);
  assert.doesNotMatch(finalAxisAuthority, /coach-program-pulse/);
});

test('shared centering owns generic outer containment while runtime normalizes the dynamic Coach route owner', () => {
  for (const selector of [
    '.app-shell.is-mobile',
    '.app-shell.is-mobile>.shell-main',
    '.app-shell.is-mobile>.shell-main>.content-wrap',
    '.performance-workspace',
    '[data-testid="coach-command-center-full"]',
  ]) assert.ok(compactCentering.includes(selector), `shared mobile x-axis authority missing ${selector}`);

  assert.match(guard, /routeOwner\.classList\.add\('coach-route-scroll-container'\)/);
  assert.match(guard, /width:\s*'100%'/);
  assert.match(guard, /minWidth:\s*'0'/);
  assert.match(guard, /maxWidth:\s*'100%'/);
  assert.match(guard, /overflowX:\s*'clip'/);

  const mobileAxis = mediaBlock(finalAxisAuthority, '(max-width: 767px)');
  assert.doesNotMatch(mobileAxis, /html,\s*body,\s*html body #root,\s*html body #root \.app-shell\.is-mobile/);
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

test('paid mobile entry prevents Safari focus zoom before mounting the shared Coach workspace', () => {
  assert.match(auth, /const inp=\{[^}]*fontSize:16/);
  assert.doesNotMatch(auth, /const inp=\{[^}]*fontSize:(?:1[0-5]|\d)(?:[,}])/);
  assert.match(auth, /const releaseAuthInputFocus=\(\)=>\{[^}]*document\.activeElement[^}]*active\.blur\(\)/);

  const loginStart = auth.indexOf('const doLogin=async()=>');
  const loginEnd = auth.indexOf('const doRegister=async()=>');
  const loginFlow = auth.slice(loginStart, loginEnd);
  assert.ok(loginFlow.indexOf('releaseAuthInputFocus();') < loginFlow.indexOf('await onLogin(id,password)'), 'paid login must release the focused field before the authenticated route transition');
});

test('runtime normalizes the real Coach route owner without CSS :has discovery', () => {
  assert.match(guard, /function findCoachRouteOwner\(\)/);
  assert.match(guard, /Array\.from\(workspace\.children\)/);
  assert.match(guard, /node\.querySelector\('\[data-testid="coach-command-center-full"\]'\)/);
  assert.match(guard, /node\.querySelector\('\.secondaryPageShell'\)/);
  assert.match(guard, /node\.querySelector\('\.page\.pageShell'\)/);
  assert.match(guard, /routeOwner\.classList\.add\('coach-route-scroll-container'\)/);
  assert.match(guard, /routeOwner\.style\.setProperty\('box-sizing', 'border-box'\)/);
  assert.match(guard, /routeOwner\.style\.setProperty\('padding-left', isHome \? '0px' : COACH_MOBILE_RAIL\)/);
  assert.match(guard, /routeOwner\.style\.setProperty\('padding-right', isHome \? '0px' : COACH_MOBILE_RAIL\)/);
  assert.match(guard, /normalizeRegisteredCoachRouteGeometry\(\)/);
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

test('shared browser certification covers current Demo entry and paid Coach at all target widths', () => {
  for (const width of ['320', '375', '390', '430']) assert.match(sharedSpec, new RegExp(`width: ${width}`));
  assert.match(sharedSpec, /for \(const mode of \['demo', 'paid'\]\)/);
  assert.match(sharedSpec, /const role = 'coach'/);
  assert.match(sharedSpec, /page\.goto\('\/\?demo=1'\)/);
  assert.match(sharedSpec, /Coach demo/);
  assert.match(sharedSpec, /Player demo/);
  assert.doesNotMatch(sharedSpec, /\?demo=\$\{role\}/);
  assert.match(sharedSpec, /performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap/);
  assert.match(sharedSpec, /visualViewportCenter/);
  assert.match(sharedSpec, /dashboard must have symmetric visual-viewport gutters/);
  assert.match(sharedSpec, /scrollWidth/);
  assert.match(sharedSpec, /clientWidth \+ 1/);
  assert.match(sharedSpec, /coach-ambient-glow/);
  assert.match(sharedSpec, /forceInvalidHorizontalState/);
  assert.match(sharedSpec, /Input\.dispatchTouchEvent/);
  assert.match(sharedSpec, /defaultPrevented/);
  assert.match(sharedSpec, /preventedCount/);
  assert.match(sharedSpec, /outer horizontal touchmove must be cancelled while finger is down/);
  assert.match(sharedSpec, /during finger pan sample/);
  assert.match(sharedSpec, /expectIntentionalRangeGestureWorks/);
  assert.match(sharedSpec, /range gesture must not be cancelled/);
  assert.match(sharedSpec, /expectVerticalScrollWorks/);
  assert.match(parityWorkflow, /tests\/e2e\/mobile-demo-paid-horizontal-lock\.spec\.mjs/);
});
