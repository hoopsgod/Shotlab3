import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.jsx', 'utf8');
const css = readFileSync('src/styles/Phase2BActionLanguage.css', 'utf8');

test('Phase 2B loads after the accepted hierarchy layers', () => {
  assert.match(main, /MissionControlCascadeLock2026\.css'\)\n    await import\('\.\/styles\/Phase2BActionLanguage\.css'\)/);
});

test('Phase 2B upgrades both intelligence drawers without changing their source actions', () => {
  assert.match(css, /coach-player-intelligence-drawer/);
  assert.match(css, /coach-event-intelligence-drawer/);
  assert.match(css, /\[class\*="drawerActions"\] > button/);
  assert.match(css, /min-height: 50px !important/);
  assert.match(css, /text-transform: none !important/);
  assert.match(css, /button::before/);
  assert.match(css, /button::after/);
  assert.match(css, /content: "→"/);
  assert.match(css, /button:first-child[\s\S]*background: #c8ff1a !important/);
  assert.match(css, /button:last-child[\s\S]*background: rgba\(244, 247, 242, \.045\) !important/);
});

test('Phase 2B replaces generic dashed empty states with purpose-built surfaces', () => {
  assert.match(css, /\[class\*="emptyState"\]/);
  assert.match(css, /border: 1px solid rgba\(244, 247, 242, \.10\) !important/);
  assert.match(css, /text-align: left !important/);
  assert.match(css, /\[class\*="emptyState"\]::before/);
  assert.match(css, /coach-leaderboard-operational-panel/);
  assert.match(css, /background: #f8f9f5 !important/);
  assert.match(css, /background-color: #71851f/);
  assert.doesNotMatch(css, /border:\s*[^;]*dashed/);
});

test('Phase 2B preserves mobile touch and reduced-motion standards', () => {
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*min-height: 52px !important/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /transition-duration: \.01ms !important/);
});
