import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { promoteCoachCommandCenter, promoteCoachFinalCss } from '../scripts/apply-mobile-coach-signature-stage.mjs';
import { reconcileCoachHierarchy } from '../scripts/apply-mobile-coach-cascade-reconciliation.mjs';
import { promoteAuthSignature } from '../scripts/apply-mobile-auth-signature-stage.mjs';
import { promotePlayerCoachSignal } from '../scripts/apply-mobile-player-coach-signal-signature.mjs';

const routePipeline = readFileSync('scripts/run-route-enhancers.mjs', 'utf8');
const coachCommand = readFileSync('src/components/CoachCommandCenter.jsx', 'utf8');
const coachFinal = readFileSync('src/components/CoachMissionControlFinal.css', 'utf8');
const coachHierarchy = readFileSync('src/styles/MissionControlHierarchy2026.css', 'utf8');
const playerDailyCss = readFileSync('src/components/PlayerDailyCommandCenter.module.css', 'utf8');
const auth = readFileSync('src/components/AuthWorkspace.jsx', 'utf8');
const secondary = readFileSync('src/components/SecondaryPageSystem.jsx', 'utf8');
const titleStageCss = readFileSync('src/components/TeamIdentityTitleStage.css', 'utf8');

test('final enhancer pipeline keeps title mutators retired and ends with canonical minification', () => {
  assert.match(routePipeline, /apply-mobile-premium-secondary-page-system\.mjs[\s\S]*apply-mobile-coach-cascade-reconciliation\.mjs/);
  assert.doesNotMatch(routePipeline, /apply-mobile-coach-signature-stage\.mjs/);
  assert.match(routePipeline, /apply-phase4e11-coach-residual-touch-safety\.mjs[\s\S]*apply-mobile-player-coach-signal-signature\.mjs[\s\S]*apply-mobile-player-composition-reconciliation\.mjs[\s\S]*apply-mobile-auth-signature-stage\.mjs[\s\S]*minify-visual-authority-css\.mjs/);
  assert.doesNotMatch(routePipeline, /apply-mobile-route-signature-promotion\.mjs|apply-mobile-centered-route-stage\.mjs|apply-team-identity-coach-hero-mark\.mjs/);
  assert.equal(existsSync('scripts/apply-mobile-route-signature-promotion.mjs'), false);
  assert.equal(existsSync('scripts/apply-mobile-centered-route-stage.mjs'), false);
  assert.equal(existsSync('scripts/apply-team-identity-coach-hero-mark.mjs'), false);
});

test('Coach Home signature enhancer leaves title identity source-owned while retaining non-title support reconciliation', () => {
  const command = promoteCoachCommandCenter(coachCommand);
  const finalCss = promoteCoachFinalCss(coachFinal);
  const hierarchy = reconcileCoachHierarchy(coachHierarchy);
  assert.equal(command, coachCommand);
  assert.equal(finalCss, coachFinal);
  assert.doesNotMatch(finalCss, /\.mcHeroTeamMark|\.mcHero\s+h1|\.mcProgramIdentity|\.mcHeroIdentity/);
  assert.doesNotMatch(hierarchy, /\.mcHeroTeamMark\s*\{[^}]*display:\s*none/s);
  assert.match(coachCommand, /data-team-identity-stage="coach-mission-control"/);
  assert.match(coachCommand, /className="mcProgramIdentity"/);
  assert.match(coachCommand, /className="mcHeroTeamMark"/);
  assert.match(coachCommand, /mcHeroLogoSetup/);
  assert.match(coachCommand, /data-team-logo-fallback=\{mark\}/);
  assert.match(coachCommand, /<small>Add logo<\/small>/);
  assert.doesNotMatch(coachCommand, /Click here to add your custom team logo/);
});

test('Player Coach Assignment uses the ShotLab primary signature rather than a blue article callout', () => {
  const promoted = promotePlayerCoachSignal(playerDailyCss);
  assert.match(promoted, /\.coachSignal::before\s*\{[^}]*background:\s*var\(--coach-signal-accent,var\(--team-brand-primary,var\(--accent\)\)\);/);
  assert.match(promoted, /color:\s*color-mix\(in srgb,var\(--coach-signal-accent,var\(--team-brand-primary,var\(--accent\)\)\) 66%,#354039\);/);
  assert.match(promoted, /font-size:\s*clamp\(21px,4\.8vw,29px\);\s*font-weight:\s*760;\s*line-height:\s*1\.04;/);
});

test('authentication loses the generic frosted card without changing its controls', () => {
  const promoted = promoteAuthSignature(auth);
  assert.match(promoted, /auth-card-enter" style=\{\{background:"transparent",borderRadius:0,padding:"22px 4px 0",border:"0",borderTop:"1px solid rgba\(17,26,33,\.14\)",boxShadow:"none"\}\}/);
  assert.match(promoted, /background:"#FFFFFF",border:"1px solid rgba\(17,26,33,\.14\)"/);
  assert.match(promoted, /fontSize:11,fontWeight:750,letterSpacing:"\.05em",textTransform:"uppercase"/);
  assert.match(promoted, /fontSize:27,fontWeight:780,lineHeight:1\.02/);
});

test('secondary route title scale comes from the shared component instead of promotion transforms', () => {
  assert.match(secondary, /<TeamIdentityTitleStage/);
  assert.match(titleStageCss, /--identity-title:\s*clamp\(42px, 10\.2vw, 44px\)/);
  assert.match(titleStageCss, /teamIdentityTitleStage--longTitle[\s\S]*clamp\(40px, 9\.8vw, 44px\)/);
  assert.doesNotMatch(secondary, /secondaryPageIntro__title|appHeaderTitle/);
});
