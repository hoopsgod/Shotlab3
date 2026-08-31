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

test('Coach layout owners fail when intrinsic width exceeds client width', () => {
  const failures = findViewportFailures(healthy({
    role: 'coach',
    outerTargets: [
      { selector: '.performance-workspace', left: 0, right: 390, clientWidth: 390, scrollWidth: 443, persistedScrollLeft: 0, overflowX: 'hidden' },
      { selector: '[data-testid="coach-command-center-full"]', left: 20, right: 370, clientWidth: 350, scrollWidth: 443, persistedScrollLeft: 0, overflowX: 'clip' },
    ],
  }));
  assert.ok(failures.some((message) => message.includes('.performance-workspace owns intrinsic horizontal overflow (390/443)')));
  assert.ok(failures.some((message) => message.includes('[data-testid="coach-command-center-full"] owns intrinsic horizontal overflow (350/443)')));
});

test('Coach clipping and scroll reset cannot excuse intrinsic owner overflow', () => {
  const failures = findViewportFailures(healthy({
    role: 'coach',
    outerTargets: [
      { selector: '.performance-workspace', left: 0, right: 390, clientWidth: 390, scrollWidth: 443, persistedScrollLeft: 53, overflowX: 'hidden' },
    ],
  }));
  assert.ok(failures.some((message) => message.includes('.performance-workspace owns intrinsic horizontal overflow (390/443)')));
});

test('clipped Player decoration is diagnostic-only when the outer axis cannot move', () => {
  const failures = findViewportFailures(healthy({
    role: 'player',
    outerTargets: [
      { selector: '.performance-workspace', left: 0, right: 390, clientWidth: 390, scrollWidth: 443, persistedScrollLeft: 0, overflowX: 'hidden' },
      { selector: '[data-testid="player-daily-command-center"]', left: 20, right: 370, clientWidth: 350, scrollWidth: 443, persistedScrollLeft: 0, overflowX: 'clip' },
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

test('Coach Home ambient decoration must stay inside the viewport', () => {
  const failures = findViewportFailures(healthy({
    role: 'coach',
    label: 'home',
    coachHome: {
      programPulse: { backgroundColor: 'rgb(6, 21, 29)', backgroundImage: 'linear-gradient(rgb(6, 21, 29), rgb(10, 32, 46))', color: 'rgb(244, 247, 248)' },
      ambientGlow: { left: 187, right: 437, width: 250 },
    },
  }));
  assert.ok(failures.some((message) => message.includes('Coach Home ambient glow escapes right (437px of 390px)')));
});

test('viewport debugger treats an unreachable fixed action as a hard failure', () => {
  const failures = findViewportFailures(healthy({
    fixedActionOffenders: [{ label: 'button.cta-primary', left: 12, right: 378 }],
    criticalActions: [{ label: 'SAVE PRIORITIES', visible: true, inViewport: false }],
  }));
  assert.ok(failures.some((message) => message.includes('fixed/sticky action outside viewport')));
  assert.ok(failures.some((message) => message.includes('critical action is outside viewport: SAVE PRIORITIES')));
});
