import test from 'node:test';
import assert from 'node:assert/strict';
import { findViewportFailures } from './e2e/support/viewport-debug.mjs';

function healthy(overrides = {}) {
  return {
    viewport: { width: 390, height: 844 },
    documentScrollWidth: 390,
    bodyScrollWidth: 390,
    documentOverflow: 0,
    bodyOverflow: 0,
    windowScrollX: 0,
    rootScrollLeft: 0,
    visualViewportOffsetLeft: 0,
    outerTargets: [
      { selector: '#root', left: 0, right: 390, clientWidth: 390, scrollWidth: 390, overflowX: 'clip' },
    ],
    fixedActionOffenders: [],
    criticalActions: [],
    ...overrides,
  };
}

test('viewport debugger accepts a centered locked shell', () => {
  assert.deepEqual(findViewportFailures(healthy()), []);
});

test('viewport debugger reports document and shell overflow with the owning selector', () => {
  const failures = findViewportFailures(healthy({
    documentScrollWidth: 414,
    documentOverflow: 24,
    outerTargets: [
      { selector: '.coach-scroll-container', left: 0, right: 414, clientWidth: 390, scrollWidth: 414, overflowX: 'clip' },
    ],
  }));
  assert.ok(failures.some((message) => message.includes('document overflows viewport by 24px')));
  assert.ok(failures.some((message) => message.includes('.coach-scroll-container')));
});

test('viewport debugger treats an unreachable fixed action as a hard failure', () => {
  const failures = findViewportFailures(healthy({
    fixedActionOffenders: [{ label: 'button.cta-primary', left: 12, right: 378 }],
    criticalActions: [{ label: 'SAVE PRIORITIES', visible: true, inViewport: false }],
  }));
  assert.ok(failures.some((message) => message.includes('fixed/sticky action outside viewport')));
  assert.ok(failures.some((message) => message.includes('critical action is outside viewport: SAVE PRIORITIES')));
});
