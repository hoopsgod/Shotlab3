import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mediaBlock } from './helpers/css-contract.mjs';
import { promoteCoachCommandCenter, promoteCoachFinalCss } from '../scripts/apply-mobile-coach-signature-stage.mjs';

const command = readFileSync('src/components/CoachCommandCenter.jsx', 'utf8');
const finalCss = readFileSync('src/components/CoachMissionControlFinal.css', 'utf8');
const titleCss = readFileSync('src/components/CoachMissionControlTitleStage.css', 'utf8');
const v2Css = readFileSync('src/components/CoachMissionControlV2.css', 'utf8');
const phase5bConfig = readFileSync('vite.phase5b.config.js', 'utf8');
const routeEnhancers = readFileSync('scripts/run-route-enhancers.mjs', 'utf8');
const enhancer = readFileSync('scripts/apply-mobile-coach-signature-stage.mjs', 'utf8');
const promotedCss = promoteCoachFinalCss(finalCss);

test('Coach title authority is no longer rewritten by the signature enhancer', () => {
  assert.equal(promoteCoachCommandCenter(command), command);
  assert.doesNotMatch(enhancer, /Coach mobile hero mark/);
  assert.doesNotMatch(enhancer, /mcHeroTeamMark\{display:none/);
  assert.doesNotMatch(enhancer, /font-size:clamp\(39px,11vw,45px\)/);
  assert.doesNotMatch(enhancer, /mcRealityStrip|mcPrimary|Coach final metric ledger|Coach final metric label/);
});

test('obsolete secondary-title mutation scripts are not orchestrated', () => {
  assert.doesNotMatch(routeEnhancers, /apply-mobile-route-signature-promotion\.mjs/);
  assert.doesNotMatch(routeEnhancers, /apply-mobile-centered-route-stage\.mjs/);
  assert.doesNotMatch(routeEnhancers, /apply-mobile-coach-signature-stage\.mjs/);
});

test('Coach Home source owns integrated program identity, premium crest and actionable no-logo fallback', () => {
  assert.match(command, /mcProgramIdentity/);
  assert.match(command, /mcHeroIdentity/);
  assert.match(command, /mcHeroLogoSetup/);
  assert.match(command, /data-team-logo-fallback=\{mark\}/);
  assert.match(command, /<small>Add logo<\/small>/);
  assert.doesNotMatch(command, /Click here to add your custom team logo/);
  assert.match(command, /data-team-identity-stage="coach-mission-control"/);
  assert.match(command, /className="mcHeroTeamMark"/);
  assert.doesNotMatch(command, /mcHeroTeamMark\{display:none/);
});

test('Coach prototype hierarchy is brand-aware, decision-first and intentionally responsive', () => {
  const desktop = mediaBlock(titleCss, '(min-width:981px)');
  const tablet = mediaBlock(titleCss, '(min-width:701px) and (max-width:980px)');
  const mobile = mediaBlock(titleCss, '(max-width:700px)');

  assert.match(desktop, /grid-column:1\/10/);
  assert.match(desktop, /min-height:330px/);
  assert.match(desktop, /\.mcProgramIdentity\{[^}]*font:760 12px\/1\.2 var\(--mc-native\)/);
  assert.doesNotMatch(desktop, /\.mcProgramIdentity\{[^}]*font:[^}]*Barlow Condensed/);
  assert.match(desktop, / h1\{[^}]*font:800 clamp\(36px,3\.4vw,48px\)\/\.92 "Barlow Condensed"/);
  assert.match(desktop, /clamp\(128px,12vw,168px\)/);

  assert.match(tablet, /min-height:354px/);
  assert.match(tablet, /clamp\(36px,5\.5vw,49px\)\/\.88 "Barlow Condensed"/);
  assert.match(tablet, /clamp\(112px,17vw,142px\)/);
  assert.match(tablet, /font:760 28px\/1 var\(--mc-native\)/);

  assert.match(mobile, /min-height:334px/);
  assert.match(mobile, /--coach-hero-crest:clamp\(104px,29vw,120px\)/);
  assert.match(mobile, /font:780 11px\/1\.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif/);
  assert.match(mobile, /h1\{[^}]*font-family:"Barlow Condensed","Arial Narrow","Helvetica Neue",sans-serif[^}]*font-size:clamp\(36px,9\.4vw,40px\)[^}]*font-weight:800[^}]*line-height:\.94/);
  assert.match(mobile, /\.mcRealityStrip button\{[^}]*min-height:54px[^}]*padding:8px 12px/);
  assert.match(mobile, /\.mcPrimary\{[^}]*min-height:46px[^}]*margin-top:11px/);
  assert.doesNotMatch(mobile, /min-height:382px|clamp\(96px,26vw,108px\)|clamp\(39px,10\.5vw,45px\)/);
});

test('legacy V2 cannot reorder Program Pulse behind athlete attention on mobile', () => {
  assert.doesNotMatch(v2Css, /\.mcTeamHealth\s*\{[^}]*order\s*:/);
  assert.doesNotMatch(v2Css, /\.mcAttention\s*\{[^}]*order\s*:/);
});

test('production build no longer carries a V2 Coach visual rewrite contract', () => {
  assert.doesNotMatch(phase5bConfig, /V2_PRODUCTION_REWRITES|mcDrawerBrand img|mcBrandLockup|mcRailLogo/);
  assert.doesNotMatch(phase5bConfig, /Barlow Condensed|Arial Narrow/);
  assert.match(phase5bConfig, /ownCoachInteractiveStylesInWorkspace/);
});

test('historical Coach reconciliation is retired and remains an identity transform', () => {
  assert.equal(promoteCoachFinalCss(promotedCss), promotedCss);
  assert.equal(promotedCss, finalCss);
  assert.doesNotMatch(enhancer, /replaceOnce|writeFileSync/);
});

test('supporting Coach reconciliation cannot rewrite a historical metric ledger', () => {
  const legacyMetricLedger = '    border-radius: 16px !important;\n    background: rgba(4, 8, 10, .5) !important;';
  const malformed = `${promotedCss}\n${legacyMetricLedger}\n`;
  assert.equal(promoteCoachFinalCss(malformed), malformed);
});
