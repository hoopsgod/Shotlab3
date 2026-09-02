import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const dashboards = readFileSync(new URL('../src/components/CoachInteractiveDashboards.css', import.meta.url), 'utf8');
const finalAxis = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const runtimeGuard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');

test('paid Coach mobile containment delegates dynamic route-root shapes to runtime', () => {
  assert.doesNotMatch(
    centering.replace(/\s+/g, ''),
    /\.performance-workspace--coach>div:has\(/,
    'shared CSS must not duplicate dynamic Coach route-owner discovery',
  );
  for (const selector of [
    '[data-testid="coach-command-center-full"]',
    '.secondaryPageShell',
    '.page.pageShell',
  ]) assert.ok(runtimeGuard.includes(selector), `runtime route-owner discovery missing ${selector}`);
  assert.match(runtimeGuard, /routeOwner\.classList\.add\('coach-route-scroll-container'\)/);
  assert.match(runtimeGuard, /overflowX:\s*'clip'/);
});

test('secondary Coach title stages stay on the source rail while final authority bounds the shared grid', () => {
  assert.match(dashboards, /secondaryPageShell > \.teamIdentityTitleStageFrame,[\s\S]*width:\s*100%;[\s\S]*max-width:\s*100%;[\s\S]*margin-inline:\s*0;/);
  assert.doesNotMatch(dashboards, /width:\s*calc\(100% \+/);
  assert.doesNotMatch(dashboards, /margin-inline:\s*calc\(/);
  assert.doesNotMatch(finalAxis, /secondaryPageShell > \.teamIdentityTitleStageFrame,/);
  assert.match(finalAxis, /performance-shell--coach\.is-mobile \.secondaryPageShell\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) !important/);
  assert.match(finalAxis, /performance-shell--coach\.is-mobile \.secondaryPageShell > \*,[\s\S]*\{[^}]*box-sizing:\s*border-box !important;[^}]*min-width:\s*0 !important;[^}]*max-width:\s*100% !important/);
  assert.doesNotMatch(finalAxis, /calc\(100% - \(var\(--shotlab-mobile-content-rail/);
});
