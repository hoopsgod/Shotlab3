import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const system = readFileSync('src/components/SecondaryPageSystem.jsx', 'utf8');
const rosterLayer = readFileSync('src/styles/Phase2PremiumRosterLayer.css', 'utf8');

test('Phase 2C premium roster layer is loaded through the shared secondary-page bundle', () => {
  assert.match(system, /import "\.\.\/styles\/Phase2PremiumRosterLayer\.css"/);
  assert.match(rosterLayer, /#coach-roster-operations > \.fade-up > \[role="button"\]/);
});

test('Phase 2C roster rows use a deliberate mobile information hierarchy', () => {
  assert.match(rosterLayer, /min-height: 104px !important/);
  assert.match(rosterLayer, /grid-template-areas:/);
  assert.match(rosterLayer, /"avatar details"/);
  assert.match(rosterLayer, /"\. actions"/);
  assert.match(rosterLayer, /font-size: 15px !important/);
});

test('Phase 2C removes only the duplicate legacy roster recap and keeps the working list visible', () => {
  assert.match(rosterLayer, /div:nth-of-type\(2\),/);
  assert.match(rosterLayer, /div:nth-of-type\(3\) \{/);
  assert.match(rosterLayer, /display: none !important/);
  assert.doesNotMatch(rosterLayer, /\[role="button"\][^{]*\{[^}]*display:\s*none/s);
  assert.doesNotMatch(rosterLayer, /visibility:\s*hidden/);
});

test('Phase 2C gives the remaining roster tool a phone-safe control', () => {
  assert.match(rosterLayer, /div:nth-of-type\(4\) select/);
  assert.match(rosterLayer, /min-height: 44px !important/);
  assert.match(rosterLayer, /min-width: 178px !important/);
});

test('Phase 2C preserves safe action targets and keyboard focus', () => {
  assert.match(rosterLayer, /button \{/);
  assert.match(rosterLayer, /:focus-visible/);
  assert.match(rosterLayer, /outline: 3px solid/);
  assert.match(rosterLayer, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(rosterLayer, /pointer-events:\s*none/);
});

test('Phase 2C stays scoped to coach roster presentation', () => {
  assert.match(rosterLayer, /\.performance-shell--coach #coach-roster-operations/);
});
