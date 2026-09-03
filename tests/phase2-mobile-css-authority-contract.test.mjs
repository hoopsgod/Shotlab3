import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const runtimeGuard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');
const finalAxisAuthority = readFileSync(new URL('../src/styles/MobileViewportAxisAuthority2026.css', import.meta.url), 'utf8');
const secondaryMobile = readFileSync(new URL('../src/components/SecondaryPagePremiumMobile.css', import.meta.url), 'utf8');
const coachEventsMobile = readFileSync(new URL('../src/components/CoachEventsPremium.css', import.meta.url), 'utf8');
const dashboardPrimitives = readFileSync(new URL('../src/components/CoachDashboardPrimitives.jsx', import.meta.url), 'utf8');
const coachDashboards = readFileSync(new URL('../src/components/CoachInteractiveDashboards.jsx', import.meta.url), 'utf8');
const geometryContract = readFileSync(new URL('./e2e/support/mobile-geometry-contract.mjs', import.meta.url), 'utf8');

const compactCentering = centering.replace(/\s+/g, '');

test('Phase 2 keeps generic mobile containment in CSS and dynamic Coach route ownership in runtime', () => {
  for (const selector of [
    '.app-shell.is-mobile',
    '.app-shell.is-mobile>.shell-main',
    '.app-shell.is-mobile>.shell-main>.content-wrap',
    '.app-shell.is-mobile .performance-workspace',
    '.app-shell.is-mobile [data-testid="coach-command-center-full"]',
    '.app-shell.is-mobile [data-testid="player-daily-command-center"]',
  ]) {
    assert.ok(centering.includes(selector), `generic mobile containment missing ${selector}`);
  }

  assert.doesNotMatch(
    compactCentering,
    /\.performance-workspace--coach>div:has\(/,
    'shared centering CSS must not rediscover the dynamic Coach route owner',
  );

  assert.match(runtimeGuard, /function findCoachRouteOwner\(\)/);
  assert.match(runtimeGuard, /Array\.from\(workspace\.children\)/);
  assert.match(runtimeGuard, /routeOwner\.classList\.add\('coach-route-scroll-container'\)/);
  assert.match(runtimeGuard, /width:\s*'100%'/);
  assert.match(runtimeGuard, /minWidth:\s*'0'/);
  assert.match(runtimeGuard, /maxWidth:\s*'100%'/);
  assert.match(runtimeGuard, /overflowX:\s*'clip'/);
  assert.match(
    runtimeGuard,
    /new MutationObserver\(\(\) => \{\s*normalizeRegisteredCoachRouteGeometry\(\);\s*scheduleCorrection\(\);\s*\}\)/,
    'new Coach route wrappers must receive x-axis geometry before the deferred animation-frame correction',
  );
});

test('Coach secondary filters keep one scoped horizontal owner', () => {
  assert.doesNotMatch(
    finalAxisAuthority,
    /\[data-visual-role="filter-rail"\]/,
    'final axis authority must not rediscover shared secondary filter rails',
  );
  assert.match(
    secondaryMobile,
    /\.secondaryPageToolbar\s+\[data-visual-role="filter-rail"\]:not\(\[data-testid="coach-events-filter-rail"\]\)\s*\{[^}]*overflow-x:\s*auto\s*!important/,
  );
  assert.match(
    secondaryMobile,
    /\[data-testid="coach-players-filter-rail"\]\s*\{[^}]*overflow-x:\s*visible\s*!important/,
  );
  assert.match(
    secondaryMobile,
    /\.secondaryPageToolbar\s+\[data-visual-role="filter-rail"\]:not\(\[data-testid="coach-players-filter-rail"\]\):not\(\[data-testid="coach-events-filter-rail"\]\)\s*>\s*\*\s*\{[^}]*min-width:\s*max-content/,
  );
  assert.match(
    coachEventsMobile,
    /\[data-testid="coach-events-filter-rail"\]\s*>\s*div\[role="group"\]\s*\{[^}]*flex-wrap:\s*wrap;[^}]*overflow-x:\s*visible/,
  );
  assert.doesNotMatch(
    coachEventsMobile,
    /\[data-testid="coach-events-filter-rail"\]\s*>\s*div\[role="group"\]\s*\{[^}]*overflow-x:\s*auto/,
  );
  assert.match(dashboardPrimitives, /wrapFilters = false/);
  assert.match(dashboardPrimitives, /style=\{wrapFilters \? \{ flexWrap: "wrap", overflowX: "visible" \} : undefined\}/);
  assert.match(coachDashboards, /testId="coach-events-filter-rail"\s+wrapFilters/);
  assert.match(
    geometryContract,
    /selector:\s*'\[data-testid="coach-players-filter-rail"\]\s*>\s*\[role="group"\]'/,
  );
  assert.doesNotMatch(
    geometryContract,
    /selector:\s*'\[aria-label="Dashboard view filters"\]'/,
  );
});
