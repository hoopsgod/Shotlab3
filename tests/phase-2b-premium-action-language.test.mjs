import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const secondaryPageSystem = readFileSync('src/components/SecondaryPageSystem.jsx', 'utf8');
const actionLayer = readFileSync('src/components/Phase2PremiumActionLayer.css', 'utf8');

test('Phase 2B action layer is attached only to the shared secondary-page system', () => {
  assert.match(secondaryPageSystem, /import "\.\/Phase2PremiumActionLayer\.css"/);
  assert.match(actionLayer, /\.secondaryPageShell/);
  assert.match(actionLayer, /\.secondaryPageEvidence \[class\*="insightActions"\] button/);
  assert.match(actionLayer, /\.secondaryPageShell \[class\*="sectionAction"\]/);
});

test('Phase 2B supporting actions carry a directional icon treatment without changing button semantics', () => {
  assert.match(actionLayer, /button::after/);
  assert.match(actionLayer, /secondaryPageAction--secondary::after/);
  assert.match(actionLayer, /mask: url\("data:image\/svg\+xml/);
  assert.match(actionLayer, /M5 12h14m-6-6 6 6-6 6/);
  assert.doesNotMatch(actionLayer, /pointer-events:\s*none/);
});

test('Phase 2B controls preserve phone-scale touch and focus safety', () => {
  assert.match(actionLayer, /min-height: 44px !important/);
  assert.match(actionLayer, /:focus-visible/);
  assert.match(actionLayer, /outline: 3px solid/);
  assert.match(actionLayer, /max-width: 100%/);
  assert.match(actionLayer, /@media \(max-width: 480px\)/);
  assert.match(actionLayer, /@media \(prefers-reduced-motion: reduce\)/);
});

test('Primary decision actions keep native ShotLab arrow iconography', () => {
  assert.match(secondaryPageSystem, /SecondaryPageDecision/);
  assert.match(secondaryPageSystem, /<ShotLabIcon name="arrow" size=\{16\}\/>/);
  assert.match(secondaryPageSystem, /onClick=\{action\.onClick\}/);
  assert.match(secondaryPageSystem, /disabled=\{action\.disabled\}/);
});
