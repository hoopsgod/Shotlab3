import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('public/shotlab-phase3-secondary-cohesion.css', 'utf8');
const acceptanceCss = readFileSync('public/shotlab-phase3-secondary-acceptance.css', 'utf8');
const coachEventsCss = readFileSync('src/components/CoachEventsPremium.css', 'utf8');
const coachSecondaryCss = readFileSync('src/components/CoachSecondaryExperience.css', 'utf8');
const playerHeader = readFileSync('src/components/PlayerDashboardHeader.jsx', 'utf8');
const playerWorkspace = readFileSync('src/components/PlayerOperationalWorkspace.jsx', 'utf8');
const playerWorkspaceCss = readFileSync('src/components/PlayerOperationalWorkspace.module.css', 'utf8');
const titleStage = readFileSync('src/components/TeamIdentityTitleStage.jsx', 'utf8');
const titleCss = readFileSync('src/components/TeamIdentityTitleStage.css', 'utf8');
const brandHierarchyCss = readFileSync('src/components/TeamIdentityBrandHierarchy.css', 'utf8');

test('Phase 3 secondary authorities load after the Phase 2 lock in acceptance order', () => {
  const phase2 = html.indexOf('id="shotlab-phase2-critical"');
  const phase3 = html.indexOf('id="shotlab-phase3-secondary-cohesion"');
  assert.ok(phase2 >= 0, 'Phase 2 critical stylesheet must remain mounted');
  assert.ok(phase3 > phase2, 'Phase 3 cohesion authority must load after Phase 2 critical styles');
  assert.match(html, /href="\/shotlab-phase3-secondary-cohesion\.css"/);
  assert.doesNotMatch(html, /shotlab-phase3-secondary-acceptance\.css/, 'retired Coach acceptance shim must stay unmounted');
});

test('Phase 3 cohesion is player-only now that Coach secondary routes are source-owned', () => {
  for (const selector of [
    'premium-leaderboards-hub',
    'player-career-history',
  ]) {
    assert.match(css, new RegExp(selector));
  }
  for (const retiredCoachSelector of [
    'coach-players-interactive-dashboard',
    'coach-events-interactive-dashboard',
    'coach-drills-management',
  ]) {
    assert.doesNotMatch(css, new RegExp(retiredCoachSelector));
  }
  assert.match(css, /color-scheme:light!important/);
  assert.match(css, /performance-workspace::before/);
  assert.match(css, /performance-workspace::after/);
  assert.match(css, /display:none!important/);
});

test('Player Home is immersive while secondary Player routes use unified title authority with compact team identity', () => {
  assert.match(playerHeader, /<TeamIdentityTitleStage/);
  assert.match(playerHeader, /variant="hero"/);
  assert.match(playerHeader, /surface="dark"/);
  assert.match(playerWorkspace, /<TeamIdentityTitleStage/);
  assert.match(playerWorkspace, /variant="standard"/);
  assert.match(playerWorkspace, /surface="light"/);
  assert.match(playerWorkspace, /dataMobileStage="editorial"/);
  assert.match(playerWorkspace, /brandTreatment="compact"/);
  assert.doesNotMatch(playerWorkspace, /resolveWorkspaceBrandTreatment/);
  assert.match(titleStage, /data-identity-role="team-name"/);
  assert.match(titleStage, /data-identity-role="page-title"/);
  assert.match(titleStage, /data-brand-treatment=\{resolvedBrandTreatment\}/);
  assert.match(titleCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/);
  assert.match(titleCss, /--identity-title:\s*clamp\(42px, 10\.2vw, 44px\)/);
  assert.match(titleCss, /object-fit:\s*contain/);
  assert.match(brandHierarchyCss, /data-title-stage-family="editorial"[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)\s+var\(--identity-crest\)/);
  assert.doesNotMatch(playerHeader, /width:58px!important|font-size:26px!important/);
});

test('Player workspaces own their editorial command and evidence hierarchy', () => {
  assert.match(playerWorkspace, /data-page-hierarchy="editorial"/);
  assert.match(playerWorkspace, /dataLayoutRole="editorial-header"/);
  assert.match(playerWorkspace, /data-layout-role="supporting-evidence"/);
  assert.match(playerWorkspaceCss, /\.commandBar\{[\s\S]*?background:transparent/);
  assert.match(playerWorkspaceCss, /\.metrics\{[\s\S]*?border-block:1px solid/);
  assert.doesNotMatch(acceptanceCss, /\[class\*="commandBar"\]/);
  assert.doesNotMatch(acceptanceCss, /\[data-metric-priority/);
});

test('Rendered Coach Events and Drills canvases are source-owned instead of acceptance-shim owned', () => {
  assert.match(coachEventsCss, /coach-events-mobile-page/);
  assert.match(coachEventsCss, /article\s*\{[\s\S]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.68\)\s*!important/);
  assert.match(coachSecondaryCss, /#coach-drills-management/);
  assert.match(coachSecondaryCss, /overflow-x:\s*clip/);
  assert.ok(acceptanceCss.length > 0, 'retired stylesheet remains available only as historical source');
});

test('Phase 3 keeps mobile safety and accessibility behavior explicit', () => {
  const combined = `${css}\n${acceptanceCss}`;
  assert.match(combined, /env\(safe-area-inset-bottom,0px\)/);
  assert.match(combined, /min-height:44px!important/);
  assert.match(combined, /@media\(max-width:700px\)/);
  assert.match(combined, /@media\(prefers-reduced-motion:reduce\)/);
});
