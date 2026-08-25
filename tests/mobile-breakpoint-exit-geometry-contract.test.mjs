import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const guard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');

test('mobile Coach geometry is cleared when the viewport leaves the mobile breakpoint', () => {
  assert.match(guard, /export function clearRegisteredCoachRouteGeometry\(\)/);
  assert.match(guard, /querySelectorAll\('\.coach-route-scroll-container'\)/);
  assert.match(guard, /classList\.remove\('coach-route-scroll-container'\)/);
  assert.match(guard, /COACH_ROUTE_GEOMETRY_PROPERTIES\.forEach\(\(property\) => routeOwner\.style\.removeProperty\(property\)\)/);
  assert.match(guard, /if \(!isMobileViewport\(\)\) return clearRegisteredCoachRouteGeometry\(\);/);
  assert.doesNotMatch(guard, /if \(!isMobileViewport\(\) \|\| rafId != null\) return;/);
  assert.match(guard, /window\.addEventListener\('resize', scheduleCorrection/);
  assert.match(guard, /clearRegisteredCoachRouteGeometry\(\);\n\s*};\n}/);
});
