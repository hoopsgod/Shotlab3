import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const secondaryCss = readFileSync('src/components/SecondaryPageSystem.css', 'utf8');
const coachCss = readFileSync('src/styles/CoachInteractiveDashboard.css', 'utf8');
const navigationCss = readFileSync('src/components/MobileNavigationArchitecture.css', 'utf8');
const navigationSource = readFileSync('src/components/MobileNavigation.jsx', 'utf8');
const expertPolishSource = readFileSync('src/lib/expertVisualPolish.js', 'utf8');

test('Phase 3B gives secondary actions tactile pressed, focus, and reduced-motion states', () => {
  assert.match(secondaryCss, /secondaryPageDecision button:active:not\(:disabled\)/);
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
  assert.match(coachCss, /\.coachDashboardNoResults\{[^}]*border:0;[^}]*border-bottom:1px solid rgba\(16,24,32,\.12\);[^}]*border-radius:0;[^}]*background:transparent;[^}]*box-shadow:none/s);
  assert.match(coachCss, /coachDashboardOperationalContent::before/);
  assert.match(coachCss, /coachDashboardOperationalContent::after\{display:none\}/);
  assert.doesNotMatch(coachCss, /coachDashboardNoResults\{[^}]*linear-gradient/s);
});

test('More sheet handoff visibly subordinates the native edge dock while preserving accessibility behavior', () => {
  assert.match(navigationSource, /document\.body\.dataset\.navigationSheetOpen = "true"/);
  assert.match(navigationCss, /body\[data-navigation-sheet-open="true"\]/);
  assert.match(navigationCss, /transform: translateY\(4px\) scale\(\.995\) !important/);
  assert.match(navigationCss, /body\[data-navigation-sheet-open="true"\][\s\S]*opacity: \.(?:7\d|8\d)/);
  assert.match(navigationCss, /mobile-navigation-overlay[\s\S]*backdrop-filter: blur\(10px\)/);
  assert.doesNotMatch(navigationCss, /translateX\(-50%\)/);
  assert.match(navigationCss, /mobile-navigation-groups.*button:active/s);
  assert.match(navigationCss, /prefers-reduced-motion: reduce[\s\S]*body\[data-navigation-sheet-open="true"\][\s\S]*transform: none !important/);
});

test('Expert visual polish never converts the full Players decision into a duplicate teaser action', () => {
  assert.match(expertPolishSource, /element\.closest\?\.\('\[data-testid="coach-players-interactive-dashboard"\]'\)/);
  assert.doesNotMatch(expertPolishSource, /fullPlayersSurface\?\.contains\(element\)/);
});

test('Add Player activation copy cannot inherit a legacy paragraph box and its roster action remains intentional', () => {
  assert.match(coachCss, /coach-player-invite-dashboard-section/);
  assert.match(coachCss, /\[class\*="sectionSummary"\]\{[^}]*border:0!important;[^}]*border-radius:0!important;[^}]*background:transparent!important;[^}]*box-shadow:none!important/s);
  assert.match(coachCss, /\[class\*="sectionAction"\]\{[^}]*min-height:44px!important;[^}]*background:#fff!important;[^}]*font-weight:720!important/s);
  assert.doesNotMatch(coachCss, /\[class\*="sectionSummary"\]\{[^}]*background:(?!transparent)/s);
});
