import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const centering = readFileSync(new URL('../public/shotlab-mobile-centering-reconciliation.css', import.meta.url), 'utf8');
const guard = readFileSync(new URL('../src/lib/mobileHorizontalViewportLock.js', import.meta.url), 'utf8');

test('shared mobile centering owners do not suppress nested horizontal controls', () => {
  assert.doesNotMatch(
    centering,
    /touch-action:\s*pan-y\s+pinch-zoom/i,
    'shared workspace ancestors must not reject horizontal gestures owned by nested filter rails',
  );
  assert.match(guard, /INTENTIONAL_HORIZONTAL_GESTURE_SELECTOR/);
  assert.match(guard, /ownsHorizontalScroll/);
  assert.match(guard, /targetIsHorizontalOwner/);
});
