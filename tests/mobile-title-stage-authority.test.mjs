import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const stage = read('src/components/TeamIdentityTitleStage.jsx');
const stageCss = read('src/components/TeamIdentityTitleStage.css');
const secondary = read('src/components/SecondaryPageSystem.jsx');
const playerWorkspace = read('src/components/PlayerOperationalWorkspace.jsx');
const playerHome = read('src/components/PlayerDashboardHeader.jsx');
const coachHome = read('src/components/CoachCommandCenter.jsx');
const geometry = read('src/styles/AuthenticatedVisualAuthority2026.css');

const titleRule = stageCss.match(/\.teamIdentityTitleStage__title\s*\{([\s\S]*?)\}/)?.[1] || '';
const longMultiRule = stageCss.match(/\.teamIdentityTitleStage--longTitle\.teamIdentityTitleStage--multiWord \.teamIdentityTitleStage__title\s*\{([\s\S]*?)\}/)?.[1] || '';

test('authenticated mobile title authority exposes exactly identity and editorial families', () => {
  assert.match(stage, /data-title-stage-family=\{titleFamily\}/);
  assert.match(stage, /titleFamily = heroClass === "teamIdentityTitleStage--hero" \? "identity" : "editorial"/);
  assert.match(playerHome, /variant="hero"/);
  assert.match(playerHome, /surface="dark"/);
  assert.match(coachHome, /data-team-identity-stage="coach-mission-control"/);
  assert.match(secondary, /variant="editorial"/);
  assert.match(playerWorkspace, /variant="editorial"/);
});

test('editorial page titles cannot opt into partial-word wrapping', () => {
  assert.match(titleRule, /overflow-wrap:\s*normal/);
  assert.match(titleRule, /word-break:\s*normal/);
  assert.match(titleRule, /hyphens:\s*none/);
  assert.doesNotMatch(titleRule, /anywhere|break-all/);
  assert.doesNotMatch(longMultiRule, /anywhere|break-all/);
  assert.match(stageCss, /teamIdentityTitleStage--singleWord[\s\S]*white-space:\s*nowrap/);
  assert.match(stageCss, /teamIdentityTitleStage--longSingleWord[\s\S]*clamp\(36px,\s*9\.6vw,\s*40px\)/);
});

test('compact editorial stages reserve typography authority over team-mark decoration', () => {
  assert.match(stageCss, /teamIdentityTitleStage--standard[\s\S]*--identity-crest:\s*clamp\(60px,\s*16vw,\s*68px\)/);
  assert.match(stageCss, /teamIdentityTitleStage--standard[\s\S]*--identity-title:\s*clamp\(39px,\s*10\.35vw,\s*44px\)/);
  assert.match(stageCss, /Compact Editorial Stage/);
});

test('Back is a first-class title-stage affordance with accessible semantics and touch target', () => {
  assert.match(stage, /backAction = null/);
  assert.match(stage, /className="teamIdentityTitleStage__back"/);
  assert.match(stage, /aria-label=\{backAction\.ariaLabel \|\| backAction\.label \|\| "Back"\}/);
  assert.match(stageCss, /\.teamIdentityTitleStage__back\s*\{[\s\S]*min-width:\s*44px[\s\S]*min-height:\s*44px/);
  assert.match(secondary, /backAction=null/);
  assert.match(playerWorkspace, /backAction = null/);
});

test('page-level status and actions are integrated into the editorial title composition', () => {
  assert.doesNotMatch(secondary, /TeamIdentitySupportRail/);
  assert.match(secondary, /status=\{status\}/);
  assert.match(secondary, /actions=\{actions\}/);
  assert.doesNotMatch(playerWorkspace, /TeamIdentitySupportRail/);
  assert.match(playerWorkspace, /status=\{model\.status\}/);
  assert.match(playerWorkspace, /actions=\{primaryAction\}/);
});

test('existing 20px meaningful-content rail and bottom safe-area landing remain authoritative', () => {
  assert.match(geometry, /--shotlab-mobile-content-rail:\s*var\(--space-5,\s*20px\)/);
  assert.match(geometry, /padding-inline:\s*var\(--shotlab-mobile-content-rail\)\s*!important/);
  assert.match(geometry, /--shotlab-mobile-content-landing:\s*var\(--space-6,\s*24px\)/);
  assert.match(geometry, /env\(safe-area-inset-bottom,\s*0px\)/);
});

test('page title remains a real level-one heading with discoverable identity metadata', () => {
  assert.match(stage, /<h1 className="teamIdentityTitleStage__title" data-identity-role="page-title">/);
  assert.match(stage, /data-title-word-count=\{titleWords\.length\}/);
  assert.match(stage, /data-title-size=\{titleSize\}/);
});
