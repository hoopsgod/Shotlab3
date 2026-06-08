import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

const requiredLegalRoutes = [
  '/privacy',
  '/privacy-policy',
  '/terms',
  '/terms-of-use',
  '/support',
  '/delete-account',
  '/data-request',
  '/delete-account-data-request',
];

test('legal/static routes are registered for direct load and aliases', () => {
  for (const route of requiredLegalRoutes) {
    assert.equal(appSource.includes(`"${route}"`), true, `${route} should be registered in App.jsx`);
  }
  assert.match(appSource, /"\/delete-account-data-request":"\/delete-account"/);
  assert.match(appSource, /"\/data-request":"\/delete-account"/);
  assert.match(appSource, /title:"Delete Account \/ Data Request"/);
});

test('legal/static routes clear startup timeout via app-ready event', () => {
  assert.match(appSource, /const markLegalStartupReady=\(\)=>\{/);
  assert.match(appSource, /window\.__shotlabBootMark\?\.\("legal_route_ready",window\.location\.pathname\)/);
  assert.match(appSource, /window\.dispatchEvent\(new CustomEvent\("shotlab:app-ready"\)\)/);
  assert.match(appSource, /useEffect\(\(\)=>\{markLegalStartupReady\(\);\},\[\]\);/);
});

test('legal/static routes render before AppInner boot state and do not show startup error copy', () => {
  const appStart = appSource.indexOf('export default function App(){');
  const appInnerStart = appSource.indexOf('function AppInner(){');
  const appComponentSource = appSource.slice(appStart, appInnerStart);
  assert.ok(appComponentSource.indexOf('if(legalRoute)return <LegalPage page={legalRoute}/>;') < appComponentSource.indexOf('try{return <AppInner/>}'));
  const legalPageStart = appSource.indexOf('function LegalPage({page})');
  const appRootStart = appSource.indexOf('// APP ROOT');
  const legalPageSource = appSource.slice(legalPageStart, appRootStart);
  assert.equal(legalPageSource.includes('SHOTLAB STARTUP ERROR'), false);
  assert.equal(legalPageSource.includes('Startup timeout while loading app state'), false);
});


test('normal app routes dispatch startup watchdog readiness event from top-level App', () => {
  const appStart = appSource.indexOf('export default function App(){');
  const appInnerStart = appSource.indexOf('function AppInner(){');
  assert.notEqual(appStart, -1);
  assert.notEqual(appInnerStart, -1);
  const appComponentSource = appSource.slice(appStart, appInnerStart);
  assert.match(appComponentSource, /useEffect\(\(\) => \{/);
  assert.match(appComponentSource, /window\.__shotlabBootMark\?\.\("app_ready_dispatched"\)/);
  assert.match(appComponentSource, /window\.dispatchEvent\(new Event\("shotlab:app-ready"\)\)/);
  assert.match(appComponentSource, /\} catch \(error\) \{\}/);
  assert.match(appComponentSource, /\}, \[\]\);/);
});


test('legal PR files do not contain merge conflict markers', () => {
  const testSource = readFileSync(new URL('./legal-routes-regression.test.mjs', import.meta.url), 'utf8');
  const markerPattern = /^\s*(?:<{7}|={7}|>{7})(?:\s|$)/m;
  assert.equal(markerPattern.test(appSource), false, 'App.jsx contains a merge conflict marker line');
  assert.equal(markerPattern.test(testSource), false, 'legal regression test contains a merge conflict marker line');
});

test('normal auth, demo, player, and coach entry points remain wired', () => {
  assert.match(appSource, /view==="auth"&&<div className="screen-fade-in"><Auth onLogin=\{login\} onRegister=\{register\} onDemo=\{demoSignIn\}/);
  assert.match(appSource, /view==="player"&&<div className="screen-fade-in"><Player/);
  assert.match(appSource, /view==="coach"&&<div className="screen-fade-in"><Coach/);
  assert.match(appSource, /Demo Player<\/button>/);
  assert.match(appSource, /Demo Coach<\/button>/);
});

test('auth footer legal links use iPhone Safari friendly navigation', () => {
  assert.match(appSource, /const navigateToHref=href=>event=>\{/);
  assert.match(appSource, /window\.location\.assign\(href\)/);
  assert.match(appSource, /touchAction:"manipulation"/);
  assert.match(appSource, /LEGAL_LINKS\.map\(link=><LegalTextLink key=\{link\.href\} link=\{link\}/);
});

test('legal contact constants are app-store ready placeholders with TODO', () => {
  assert.equal(appSource.includes('support@REPLACE-WITH-SHOTLAB-DOMAIN.example'), false);
  assert.equal(appSource.includes('privacy@REPLACE-WITH-SHOTLAB-DOMAIN.example'), false);
  assert.match(appSource, /TODO before App Store submission: replace these with final ShotLab support\/privacy emails\./);
  assert.match(appSource, /const SUPPORT_EMAIL = "YOUR_REAL_SUPPORT_EMAIL_HERE"/);
  assert.match(appSource, /const PRIVACY_EMAIL = "YOUR_REAL_PRIVACY_EMAIL_HERE"/);
});

test('logged-in app exposes legal and support links without changing app flows', () => {
  assert.match(appSource, /function LegalSupportSection\(\{compact=false\}\)/);
  assert.match(appSource, /LEGAL & SUPPORT/);
  assert.match(appSource, /<LegalSupportSection compact\/>/);
  assert.match(appSource, /<LegalSupportSection\/>/);
  assert.match(appSource, /aria-label="Logged-in legal and support pages"/);
});
