import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  promoteCoachCommandCenter,
  promotePlayerCoachSignal,
  promoteAuthSignature,
  promoteMobileRouteSignature,
} from '../scripts/lib/route-signature-promotions.mjs';

const coachCommandCenter = fs.readFileSync('src/components/CoachCommandCenter.jsx', 'utf8');
const playerDailyCss = fs.readFileSync('src/components/PlayerDailyCommandCenter.module.css', 'utf8');
const auth = fs.readFileSync('src/components/Auth.jsx', 'utf8');

const applyFinalTeamBrandingFixture = (source) => source
  .replace(
    'function CourtArtwork(){\n  return (',
    'function CourtArtwork({ logoUrl, teamName }){\n  const mark = cleanLogoUrl(logoUrl);\n  return (',
  )
  .replace(
    '        <rect x="178" y="74" width="150" height="150" rx="75" fill="rgba(6,16,22,.45)" stroke="rgba(245,248,249,.2)" strokeWidth="1" />',
    '        <rect x="178" y="74" width="150" height="150" rx="75" fill="rgba(6,16,22,.45)" stroke="rgba(245,248,249,.2)" strokeWidth="1" />\n        <g id="mcTacticalWash">',
  )
  .replace(
    '        <image href={mark} x="214" y="127" width="76" height="76" preserveAspectRatio="xMidYMid meet" opacity=".16" />',
    '        {mark ? <image href={mark} x="214" y="127" width="76" height="76" preserveAspectRatio="xMidYMid meet" opacity=".16" /> : <text x="252" y="169" textAnchor="middle" fill="rgba(245,248,249,.11)" fontSize="28" fontWeight="900">{initials(teamName)}</text>}',
  );

test('Coach Home promotion creates one strong first-impression hierarchy', () => {
  const promoted = promoteCoachCommandCenter(coachCommandCenter);
  assert.match(promoted, /function CourtArtwork\(\{ logoUrl, teamName \}\)/);
  assert.match(promoted, /id="mcTacticalWash"/);
  assert.match(promoted, /\{initials\(teamName\)\}<\/text>/);
});

test('Coach tactical signature is idempotent after the final team branding boundary', () => {
  const promoted = promoteCoachCommandCenter(coachCommandCenter);
  const postBranding = applyFinalTeamBrandingFixture(promoted);
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
