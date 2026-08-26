import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { promoteCoachCommandCenter, promoteCoachFinalCss } from '../scripts/apply-mobile-coach-signature-stage.mjs';

const command = readFileSync('src/components/CoachCommandCenter.jsx', 'utf8');
const finalCss = readFileSync('src/components/CoachMissionControlFinal.css', 'utf8');
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
