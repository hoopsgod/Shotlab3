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
      { selector: '#root', left: 0, right: 390, clientWidth: 390, scrollWidth: 390, persistedScrollLeft: 0, overflowX: 'clip' },
    ],
    fixedActionOffenders: [],
    criticalActions: [],
    ...overrides,
  };
}

test('viewport debugger accepts a centered locked shell', () => {
  assert.deepEqual(findViewportFailures(healthy()), []);
});

test('viewport debugger reports true document overflow', () => {
  const failures = findViewportFailures(healthy({
    documentScrollWidth: 414,
    documentOverflow: 24,
  }));
  assert.ok(failures.some((message) => message.includes('document overflows viewport by 24px')));
});

test('clipped decorative overflow is diagnostic-only when horizontal scroll state cannot persist', () => {
  const failures = findViewportFailures(healthy({
    outerTargets: [
      { selector: '.performance-workspace', left: 0, right: 390, clientWidth: 390, scrollWidth: 443, persistedScrollLeft: 0, overflowX: 'hidden' },
      { selector: '[data-testid="player-daily-command-center"]', left: 20, right: 370, clientWidth: 350, scrollWidth: 443, persistedScrollLeft: 0, overflowX: 'clip' },
    ],
  }));
  assert.deepEqual(failures, []);
});

test('decorative clipped owner may retain internal scroll state without becoming the user scroll owner', () => {
  const failures = findViewportFailures(healthy({
    outerTargets: [
      { selector: '.performance-workspace', left: 0, right: 390, clientWidth: 390, scrollWidth: 443, persistedScrollLeft: 53, overflowX: 'hidden' },
    ],
  }));
  assert.deepEqual(failures, []);
});

test('locked shell retaining horizontal scroll state is a hard failure', () => {
  const failures = findViewportFailures(healthy({
    outerTargets: [
      { selector: '.coach-scroll-container', left: 0, right: 390, clientWidth: 390, scrollWidth: 430, persistedScrollLeft: 40, overflowX: 'hidden' },
    ],
  }));
  assert.ok(failures.some((message) => message.includes('.coach-scroll-container retains horizontal scrollLeft=40')));
});

test('viewport debugger treats an unreachable fixed action as a hard failure', () => {
  const failures = findViewportFailures(healthy({
    fixedActionOffenders: [{ label: 'button.cta-primary', left: 12, right: 378 }],
    criticalActions: [{ label: 'SAVE PRIORITIES', visible: true, inViewport: false }],
  }));
  assert.ok(failures.some((message) => message.includes('fixed/sticky action outside viewport')));
  assert.ok(failures.some((message) => message.includes('critical action is outside viewport: SAVE PRIORITIES')));
});
