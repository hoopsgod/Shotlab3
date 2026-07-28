import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');

const legalRoutes = [
  '/privacy',
  '/privacy-policy',
  '/terms',
  '/terms-of-use',
  '/support',
  '/delete-account',
  '/data-request',
  '/delete-account-data-request',
];

test('all static legal/support routes are registered', () => {
  for (const route of legalRoutes) {
    assert.equal(appSource.includes(`"${route}"`), true, `${route} should be present in LEGAL_ROUTES`);
  }
  assert.match(appSource, /const LEGAL_ROUTES=\{/);
  assert.match(appSource, /const getLegalRouteKey=\(path\)=>LEGAL_ROUTES/);
});

test('public legal pages render before AppInner while signed-in deletion retains the in-app flow', () => {
  const legalRouteIndex = appSource.indexOf('const legalRouteKey=typeof window!=="undefined"?getLegalRouteKey(window.location.pathname):null;');
  const publicDecisionIndex = appSource.indexOf('const shouldRenderPublicLegalPage=Boolean(legalRouteKey&&(legalRouteKey!=="delete-account"||!hasStoredShotLabSession()));');
  const legalReturnIndex = appSource.indexOf('if(shouldRenderPublicLegalPage)return <StaticLegalPage pageKey={legalRouteKey}/>;');
  const appInnerReturnIndex = appSource.indexOf('try{return <AppInner/>}');

  assert.notEqual(legalRouteIndex, -1);
  assert.notEqual(publicDecisionIndex, -1);
  assert.notEqual(legalReturnIndex, -1);
  assert.notEqual(appInnerReturnIndex, -1);
  assert.ok(legalRouteIndex < publicDecisionIndex, 'legal route must be resolved before the public decision');
  assert.ok(publicDecisionIndex < legalReturnIndex, 'public decision must precede the legal page return');
  assert.ok(legalReturnIndex < appInnerReturnIndex, 'public legal page return must happen before AppInner render');
  assert.match(appSource, /const hasStoredShotLabSession=\(\)=>/);
  assert.match(appSource, /window\.localStorage\?\.getItem\("sl:session"\)/);
  assert.match(appSource, /data-testid="static-legal-page"/);
  assert.match(appSource, /data-testid="signed-in-delete-account-route"/);
});

test('legal readiness is additive and does not replace the normal app-ready dispatch', () => {
  assert.match(appSource, /window\.__shotlabBootMark\?\.\("app_ready_dispatched"\);\s*window\.dispatchEvent\(new Event\("shotlab:app-ready"\)\);/s);
  assert.match(mainSource, /window\.addEventListener\('shotlab:app-ready', onAppReady, \{ once: true \}\)/);
  assert.match(appSource, /window\.__shotlabBootMark\?\.\("legal_route_ready",pageKey\)/);
  assert.match(appSource, /window\.dispatchEvent\(new CustomEvent\("shotlab:legal-route-ready"/);
});

test('pre-login and logged-in legal/support links are wired', () => {
  assert.match(appSource, /function LegalSupportLinks\(\{compact=false\}\)/);
  assert.match(appSource, /aria-label="Legal and support links"/);
  assert.match(appSource, /<LegalSupportLinks\/>/);
  assert.match(appSource, /LEGAL & SUPPORT/);
  assert.match(appSource, /<LegalSupportLinks compact\/>/);
});

test('auth, demo, player, and coach app routes remain wired', () => {
  const requiredTokens = [
    'view==="auth"&&<div className="screen-fade-in"><Auth',
    'onDemo={demoSignIn}',
    'Demo Player',
    'Demo Coach',
    'view==="player"&&<div className="screen-fade-in"><Player',
    'view==="coach"&&<div className="screen-fade-in"><Coach',
    'view==="coach-branding"&&user?.role==="coach"',
    'setView("coach")',
    'setView("player")',
  ];

  for (const token of requiredTokens) {
    assert.equal(appSource.includes(token), true, `${token} should remain wired`);
  }
});
