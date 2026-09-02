import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const authority = read('src/styles/AuthenticatedVisualAuthority2026.css');
const finalAxis = read('src/styles/MobileViewportAxisAuthority2026.css');
const dashboards = read('src/components/CoachInteractiveDashboards.css');
const metrics = read('src/components/PlayerMetricHierarchy.module.css');
const secondaryPages = read('src/components/SecondaryPageSystem.css');
const centering = read('public/shotlab-mobile-centering-reconciliation.css');
const navigation = read('src/components/MobileNavigation.module.css');
const composition = read('scripts/apply-mobile-player-composition-reconciliation.mjs');
const commandHierarchy = read('src/styles/CommandHierarchy2026.css');
const app = read('src/App.jsx');
const brandingPreview = read('src/components/team/TeamBrandingPreview.jsx');

test('mobile geometry authority keeps Player and Coach on dedicated 20px rails', () => {
  assert.match(authority, /--shotlab-mobile-content-rail:\s*var\(--space-5, 20px\)/);
  assert.match(authority, /--shotlab-coach-route-wrapper-gutter:\s*var\(--shotlab-mobile-content-rail\)/);
  assert.match(authority, /--layout-gutter:\s*var\(--shotlab-mobile-content-rail\)/);
  assert.match(authority, /--phase4e-mobile-gutter:\s*var\(--shotlab-mobile-content-rail\)/);
  assert.match(finalAxis, /--layout-gutter:\s*20px/);
  assert.match(finalAxis, /performance-shell--player\.is-mobile \.player-scroll-container[^}]*padding-inline:\s*20px !important/);
  assert.doesNotMatch(finalAxis, /performance-shell--player\.is-mobile \.player-scroll-container\s*\{[^}]*(?:width|max-width|min-width|box-sizing):/);
  assert.match(finalAxis, /performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap[\s\S]*padding-inline:\s*0 !important/);
  assert.match(finalAxis, /performance-shell--coach\.is-mobile \.performance-workspace--coach[^}]*--shotlab-coach-route-wrapper-gutter:\s*var\(--shotlab-mobile-content-rail, 20px\)/);
  assert.match(finalAxis, /performance-shell--player\.is-mobile \.player-quick-actions[\s\S]*padding-inline:\s*0 !important/);
  assert.doesNotMatch(finalAxis, /performance-shell--coach\.is-mobile > \.shell-main > \.content-wrap[^}]*padding-inline:\s*20px !important/);
});

test('Coach secondary routes use one outer rail with bounded mobile grid content', () => {
  assert.match(app, /var\(--shotlab-coach-route-wrapper-gutter, 16px\) 104px/);
  assert.match(authority, /performance-shell--coach \.secondaryPageShell\s*\{[^}]*padding-inline:\s*0 !important/);
  assert.match(finalAxis, /performance-shell--coach\.is-mobile \.secondaryPageShell[^{]*\{[^}]*padding-inline:\s*0 !important/);
  assert.match(finalAxis, /performance-shell--coach\.is-mobile \.secondaryPageShell\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) !important/);
  assert.match(finalAxis, /performance-shell--coach\.is-mobile \.secondaryPageShell > \*,[\s\S]*player-primary-logging-region \.player-logging-input\s*\{[^}]*box-sizing:\s*border-box !important;[^}]*min-width:\s*0 !important;[^}]*max-width:\s*100% !important/);
  assert.match(dashboards, /secondaryPageShell > \.teamIdentityTitleStageFrame,[\s\S]*width:\s*100%;[\s\S]*max-width:\s*100%;[\s\S]*margin-inline:\s*0;/);
  assert.doesNotMatch(dashboards, /width:\s*calc\(100% \+/);
  assert.doesNotMatch(dashboards, /margin-inline:\s*calc\(/);
  assert.doesNotMatch(finalAxis, /calc\(100% - \(var\(--shotlab-mobile-content-rail/);
  assert.doesNotMatch(finalAxis, /secondaryPageShell > \.teamIdentityTitleStageFrame,/);
  assert.match(finalAxis, /performance-shell--player\.is-mobile \[data-visual-role="secondary-page"\][^}]*padding-inline:\s*0 !important/);
});

test('secondary mobile pages land beyond bottom navigation with deliberate breathing room', () => {
  assert.match(authority, /--shotlab-mobile-content-landing:\s*var\(--space-6, 24px\)/);
  assert.match(authority, /\.secondaryPageShell[\s\S]*padding-bottom:\s*calc\([\s\S]*var\(--bottom-nav-content-padding, 82px\)[\s\S]*\+ var\(--shotlab-mobile-content-landing\)[\s\S]*\+ env\(safe-area-inset-bottom, 0px\)[\s\S]*\) !important/);
  assert.match(navigation, /--bottom-nav-content-padding:\s*82px/);
  assert.match(navigation, /min-height:\s*calc\(var\(--mobile-tab-bar-height\) \+ env\(safe-area-inset-bottom, 0px\)\)/);
});

test('mobile route performance stages stay inside the canonical page rail', () => {
  assert.match(centering, /\[data-visual-role="secondary-page"\]\s*>\s*\[data-visual-role="primary-decision"\][\s\S]*width:\s*100% !important;[\s\S]*max-width:\s*100% !important;[\s\S]*margin-inline:\s*0 !important/);
  assert.doesNotMatch(centering, /width:\s*calc\(100% \+ var\(--layout-gutter/);
  assert.doesNotMatch(centering, /margin-left:\s*calc\(var\(--layout-gutter, 18px\) \* -1\)/);
  assert.match(secondaryPages, /\.secondaryPageDecision\s*\{/);
});

test('first supporting mobile metric returns to the editorial rail without flattening card internals', () => {
  assert.match(metrics, /\.metricPrimary \+ \.metricSupporting\{[\s\S]*padding-inline-start:2px!important;[\s\S]*border-left:0!important/);
  assert.doesNotMatch(metrics, /data-team-workspace=['"]program['"]/);
  assert.match(metrics, /\.metricSupporting\{[\s\S]*padding:13px 10px 12px!important/);
  assert.match(metrics, /\.metricSupporting \+ \.metricSupporting\{border-left:1px solid/);
});

test('Player Home optical accents and progress summary do not create secondary left rails', () => {
  assert.match(composition, /\[data-testid="player-coach-priority-signal"\]\{padding-inline:8px 2px!important\}/);
  assert.match(commandHierarchy, /\.playerProgressDisclosure > summary\s*\{[^}]*justify-content:\s*space-between/);
  assert.match(composition, /\.playerProgressDisclosure>summary\{[\s\S]*padding-inline:2px 50px!important/);
  assert.match(composition, /\.playerProgressDisclosure>summary::after\{[\s\S]*right:2px/);
  assert.doesNotMatch(finalAxis, /playerProgressDisclosure > summary\s*\{[^}]*justify-content:/);
  assert.doesNotMatch(composition, /padding-inline:14px 54px!important/);
});

test('Player Train preserves Shot Tracker prominence while returning Training Plan to the scan rail', () => {
  assert.match(composition, /\.player-training-kicker\{justify-content:center!important\}/);
  assert.match(composition, /\.player-training-plan__header\{display:grid!important;justify-items:start!important;text-align:left!important;padding-inline:2px!important\}/);
});

test('Program Branding preview uses one visible identity mark and a mobile-safe Mission Control scale', () => {
  assert.match(brandingPreview, /variant="hero" brandTreatment="compact"[\s\S]*title="Mission Control"/);
  assert.match(brandingPreview, /title="Mission Control"[\s\S]*titleSize="long"/);
  assert.doesNotMatch(brandingPreview, /variant="hero" brandTreatment="hero"[\s\S]*title="Mission Control"/);
});

test('At Home Shot Tracker keeps equal grid tracks and clamps native iOS controls inside normal flow', () => {
  assert.match(commandHierarchy, /\.player-logging-fields\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(commandHierarchy, /\.player-logging-field\s*\{\s*min-width:\s*0/);
  assert.match(commandHierarchy, /\.player-logging-input\s*\{[\s\S]*box-sizing:\s*border-box;[\s\S]*width:\s*100%/);
  assert.match(finalAxis, /\.player-primary-logging-region \.player-logging-field\s*\{[\s\S]*display:\s*flex !important;[\s\S]*flex-direction:\s*column !important/);
  assert.match(finalAxis, /\.player-primary-logging-region \.player-logging-field label\s*\{[^}]*text-align:\s*center !important/);
  assert.match(finalAxis, /player-primary-logging-region \.player-logging-input\s*\{[^}]*box-sizing:\s*border-box !important;[^}]*min-width:\s*0 !important;[^}]*max-width:\s*100% !important/);
  assert.match(finalAxis, /\.player-primary-logging-region \.player-logging-input\s*\{[^}]*height:\s*52px !important;[^}]*min-height:\s*52px !important;[^}]*max-height:\s*52px !important;[^}]*padding-block:\s*0 !important;[^}]*text-align:\s*center !important/);
  assert.match(finalAxis, /\.player-primary-logging-region \.player-logging-input\[type="date"\]\s*\{[^}]*-webkit-appearance:\s*none !important;[^}]*appearance:\s*none !important/);
  assert.match(finalAxis, /player-logging-input\[type="date"\]::-webkit-date-and-time-value\s*\{[\s\S]*width:\s*100%;[\s\S]*text-align:\s*center/);
  assert.doesNotMatch(finalAxis, /player-logging-input\[type="date"\]::-webkit-date-and-time-value\s*\{[^}]*display:\s*block/);
  assert.doesNotMatch(finalAxis, /\.player-primary-logging-region \.player-logging-input\s*\{[^}]*(?:^|[;{]\s*)width:\s*100%/m);
  assert.doesNotMatch(composition, /player-primary-logging-region \.player-logging-(?:field|input)/);
  assert.doesNotMatch(commandHierarchy, /player-primary-logging-region \.player-logging-(?:field|input)/);
  assert.doesNotMatch(composition, /repairShotTrackerInputGeometry/);
});
