import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const secondaryCss = readFileSync('src/components/SecondaryPageSystem.css', 'utf8');
const coachCss = readFileSync('src/styles/CoachInteractiveDashboard.css', 'utf8');
const navigationCss = readFileSync('src/components/MobileNavigationArchitecture.css', 'utf8');
const navigationSource = readFileSync('src/components/MobileNavigation.jsx', 'utf8');
const expertPolishSource = readFileSync('src/lib/expertVisualPolish.js', 'utf8');

test('Phase 3B gives secondary actions tactile pressed, focus, and reduced-motion states', () => {
  assert.match(secondaryCss, /secondaryPageAction:active:not\(:disabled\)/);
  assert.match(secondaryCss, /\[data-visual-role="metric-strip"\]\s*> button\[aria-pressed="true"\]/);
  assert.match(secondaryCss, /secondaryPageDecision button:focus-visible/);
  assert.match(secondaryCss, /prefers-reduced-motion:\s*reduce/);
});

test('Phase 3B makes insight actions deliberate rather than a loose button cluster', () => {
  assert.match(secondaryCss, /\[data-visual-role="insight-actions"\]/);
  assert.match(secondaryCss, /\[data-action-role="tertiary"\]/);
  assert.match(secondaryCss, /min-height: var\(--touch-target, 44px\) !important/);
});

test('Coach management empty states remain on the light native secondary system', () => {
  assert.match(coachCss, /coachDashboardNoResults/);
  assert.match(coachCss, /background: linear-gradient\(145deg, #ffffff, #f7f8f4\)/);
  assert.match(coachCss, /border: 1px dashed rgba\(23, 28, 24, \.16\)/);
  assert.match(coachCss, /coachDashboardOperationalContent::before/);
  assert.match(coachCss, /display: none/);
});

test('More sheet handoff visibly subordinates the native edge dock while preserving accessibility behavior', () => {
  assert.match(navigationSource, /document\.body\.dataset\.navigationSheetOpen = "true"/);
  assert.match(navigationCss, /body\[data-navigation-sheet-open="true"\]/);
  assert.match(navigationCss, /transform: translateY\(4px\) scale\(\.995\) !important/);
  assert.match(navigationCss, /opacity: \.82/);
  assert.doesNotMatch(navigationCss, /translateX\(-50%\)/);
  assert.match(navigationCss, /mobile-navigation-groups.*button:active/s);
  assert.match(navigationCss, /prefers-reduced-motion: reduce/);
});

test('Expert visual polish never converts the full Players decision into a duplicate teaser action', () => {
  assert.match(expertPolishSource, /element\.closest\?\.\('\[data-testid="coach-players-interactive-dashboard"\]'\)/);
  assert.doesNotMatch(expertPolishSource, /fullPlayersSurface\?\.contains\(element\)/);
});

test('Add Player activation copy cannot inherit a legacy paragraph box and its roster action remains intentional', () => {
  assert.match(coachCss, /coach-player-invite-dashboard-section/);
  assert.match(coachCss, /\[class\*="sectionSummary"\]/);
  assert.match(coachCss, /border: 0 !important/);
  assert.match(coachCss, /background: transparent !important/);
  assert.match(coachCss, /\[class\*="sectionAction"\]/);
  assert.match(coachCss, /width: 100% !important/);
});
