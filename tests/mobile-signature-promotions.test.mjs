import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { promoteCoachCommandCenter, promoteCoachFinalCss } from '../scripts/apply-mobile-coach-signature-stage.mjs';
import { reconcileCoachHierarchy } from '../scripts/apply-mobile-coach-cascade-reconciliation.mjs';
import { promoteAuthSignature } from '../scripts/apply-mobile-auth-signature-stage.mjs';
import { promoteMobileRouteSignature } from '../scripts/apply-mobile-route-signature-promotion.mjs';
import { promotePlayerCoachSignal } from '../scripts/apply-mobile-player-coach-signal-signature.mjs';

const routePipeline = readFileSync('scripts/run-route-enhancers.mjs', 'utf8');
const demoBrandingRuntimeFix = readFileSync('scripts/apply-demo-coach-branding-runtime-fix.mjs', 'utf8');
const coachCommand = readFileSync('src/components/CoachCommandCenter.jsx', 'utf8');
const coachFinal = readFileSync('src/components/CoachMissionControlFinal.css', 'utf8');
const coachHierarchy = readFileSync('src/styles/MissionControlHierarchy2026.css', 'utf8');
const playerDailyCss = readFileSync('src/components/PlayerDailyCommandCenter.module.css', 'utf8');
const auth = readFileSync('src/components/AuthWorkspace.jsx', 'utf8');

test('signature promotions run after canonical owners and team identity remains the final presentation authority', () => {
  assert.match(routePipeline, /apply-mobile-premium-secondary-page-system\.mjs[\s\S]*apply-mobile-route-signature-promotion\.mjs[\s\S]*apply-mobile-coach-signature-stage\.mjs[\s\S]*apply-mobile-coach-cascade-reconciliation\.mjs/);
  assert.match(routePipeline, /apply-phase4e11-coach-residual-touch-safety\.mjs[\s\S]*apply-mobile-player-coach-signal-signature\.mjs[\s\S]*apply-mobile-auth-signature-stage\.mjs[\s\S]*apply-team-identity-branding-boundary\.mjs[\s\S]*apply-demo-coach-branding-runtime-fix\.mjs/);
  const finalEnhancers = routePipeline.slice(routePipeline.indexOf('const FINAL_ROUTE_ENHANCERS'), routePipeline.indexOf('const RELEASE_AUTH_RECOVERY_MARKER'));
  const authEntry = "'scripts/apply-mobile-auth-signature-stage.mjs'";
  const identityEntry = "'scripts/apply-team-identity-branding-boundary.mjs'";
  const runtimeEntry = "'scripts/apply-demo-coach-branding-runtime-fix.mjs'";
  assert.equal(finalEnhancers.split(authEntry).length - 1, 1, 'auth signature promotion must appear exactly once in FINAL_ROUTE_ENHANCERS');
  assert.equal(finalEnhancers.split(identityEntry).length - 1, 1, 'team identity boundary must appear exactly once in FINAL_ROUTE_ENHANCERS');
  assert.equal(finalEnhancers.split(runtimeEntry).length - 1, 1, 'Demo branding state reconciliation must appear exactly once in FINAL_ROUTE_ENHANCERS');
  assert.match(finalEnhancers, /'scripts\/apply-mobile-auth-signature-stage\.mjs',[\s\S]*'scripts\/apply-team-identity-branding-boundary\.mjs',[\s\S]*'scripts\/apply-demo-coach-branding-runtime-fix\.mjs',?\s*\]\)/, 'team identity presentation authority must run immediately before the narrow Demo state reconciliation');
  assert.doesNotMatch(demoBrandingRuntimeFix, /\.css|style\.|className=|<style/i, 'Demo state reconciliation must not own presentation styling');
});

test('Coach Home promotion creates one strong first-impression hierarchy', () => {
  const command = promoteCoachCommandCenter(coachCommand);
  const finalCss = promoteCoachFinalCss(coachFinal);
  const hierarchy = reconcileCoachHierarchy(coachHierarchy);
  assert.match(command, /font-size:clamp\(39px,11vw,45px\)!important/);
  assert.match(command, /background:linear-gradient\(126deg,#061923,#0b2d37\)!important/);
  assert.match(finalCss, /min-height: 350px !important;\n    border-radius: 0 !important/);
  assert.match(hierarchy, /background: rgba\(255,255,255,\.055\) !important;/);
  assert.match(hierarchy, /border-top: 1px solid var\(--mc-line\) !important;[\s\S]*background: transparent !important;[\s\S]*box-shadow: none !important;/);
});

test('Coach tactical signature is idempotent after the final team branding boundary', () => {
  const once = promoteCoachCommandCenter(coachCommand);
  const postBranding = once
    .replace(
      'function CourtArtwork({ logoUrl }) {\n  const mark = logoUrl || FALLBACK_LOGO;',
      'function CourtArtwork({ logoUrl, teamName }) {\n  const mark = logoUrl || "";',
    )
    .replace(
      '        <image href={mark} x="214" y="127" width="76" height="76" preserveAspectRatio="xMidYMid meet" opacity=".16" />',
      '        {mark ? <image href={mark} x="214" y="127" width="76" height="76" preserveAspectRatio="xMidYMid meet" opacity=".16" /> : <text x="252" y="169" textAnchor="middle" fill="rgba(245,248,249,.11)" fontSize="28" fontWeight="900">{initials(teamName)}</text>}',
    );
  assert.match(postBranding, /function CourtArtwork\(\{ logoUrl, teamName \}\)/);
  assert.match(postBranding, /id="mcTacticalWash"/);
  assert.match(postBranding, /\{initials\(teamName\)\}<\/text>/);
  assert.doesNotThrow(() => promoteCoachCommandCenter(postBranding));
  assert.equal(promoteCoachCommandCenter(postBranding), postBranding);
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

test('route signature promotion raises masthead scale without adding a second stylesheet', () => {
  const fixture = `grid-template-columns: 30px minmax(0, 1fr);\n    width: 30px;\n    height: 30px;\n    border-radius: 9px;\n.secondaryPageIntro__icon svg { width: 16px; height: 16px; stroke-width: 1.85; }\n    max-width: 11ch;\n    font-size: clamp(31px, 8.5vw, 34px) !important;\n    line-height: .94;\n  .secondaryPageDecision h2 { max-width: 17ch; font-size: clamp(26px, 7.3vw, 31px); line-height: .96; letter-spacing: -.052em; }\n  .secondaryPageIntro { grid-template-columns: 28px minmax(0, 1fr); column-gap: 9px; }\n  .secondaryPageIntro__icon { width: 28px; height: 28px; border-radius: 8px; }\n  .secondaryPageIntro__icon svg { width: 15px; height: 15px; }\n.performance-shell .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle { font-size: 32px !important; }`;
  const promoted = promoteMobileRouteSignature(fixture);
  assert.match(promoted, /grid-template-columns: 46px minmax\(0, 1fr\)/);
  assert.match(promoted, /font-size: clamp\(36px, 10vw, 42px\) !important/);
  assert.match(promoted, /border-radius: 0/);
  assert.match(promoted, /font-size: clamp\(28px, 7\.8vw, 34px\)/);
  assert.match(promoted, /font-size: 36px !important/);
});
