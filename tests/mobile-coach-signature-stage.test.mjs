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
});

test('obsolete secondary-title mutation scripts are not orchestrated', () => {
  assert.doesNotMatch(routeEnhancers, /apply-mobile-route-signature-promotion\.mjs/);
  assert.doesNotMatch(routeEnhancers, /apply-mobile-centered-route-stage\.mjs/);
  assert.match(routeEnhancers, /apply-mobile-premium-secondary-page-system\.mjs[\s\S]*apply-mobile-coach-signature-stage\.mjs[\s\S]*apply-phase4c-coach-event-manage-hit-area\.mjs/);
});

test('Coach Home source owns integrated program identity, premium crest and actionable logo setup', () => {
  assert.match(command, /mcProgramIdentity/);
  assert.match(command, /mcHeroIdentity/);
  assert.match(command, /mcHeroLogoSetup/);
  assert.match(command, /Click here to add your custom team logo/);
  assert.match(command, /data-team-identity-stage="coach-mission-control"/);
  assert.match(command, /className="mcHeroTeamMark"/);
  assert.doesNotMatch(command, /mcHeroTeamMark\{display:none/);
});

test('supporting Coach reconciliation remains idempotent and does not touch title geometry', () => {
  assert.equal(promoteCoachFinalCss(promotedCss), promotedCss);
  assert.match(promotedCss, /\.mcSection \{\n    overflow: visible;\n    border: 0;\n    border-top: 1px solid var\(--mc-hairline-modern\);/);
  assert.match(promotedCss, /\.mcTodayPlan > button \{[\s\S]*min-height: 44px;/);
});

test('supporting Coach reconciliation rejects mixed legacy and final anchors', () => {
  const legacyMetricLedger = '    border-radius: 16px !important;\n    background: rgba(4, 8, 10, .5) !important;';
  const malformed = `${promotedCss}\n${legacyMetricLedger}\n`;
  assert.throws(
    () => promoteCoachFinalCss(malformed),
    /Coach final metric ledger: expected exactly one legacy anchor or one final anchor; found legacy 1, final 1 \(mixed legacy\/final state\)/,
  );
});