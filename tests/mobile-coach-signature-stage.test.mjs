import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { promoteCoachCommandCenter, promoteCoachFinalCss } from '../scripts/apply-mobile-coach-signature-stage.mjs';

const command = readFileSync('src/components/CoachCommandCenter.jsx', 'utf8');
const finalCss = readFileSync('src/components/CoachMissionControlFinal.css', 'utf8');
const routeEnhancers = readFileSync('scripts/run-route-enhancers.mjs', 'utf8');

const promotedCommand = promoteCoachCommandCenter(command);
const promotedCss = promoteCoachFinalCss(finalCss);

test('Coach signature stage is part of both dev and build route promotion', () => {
  assert.match(routeEnhancers, /apply-mobile-premium-secondary-page-system\.mjs[\s\S]*apply-mobile-coach-signature-stage\.mjs[\s\S]*apply-phase4c-coach-event-manage-hit-area\.mjs/);
});

test('Coach Home opens with a branded mobile identity stage rather than utility chrome', () => {
  assert.match(promotedCommand, /\.mcHeader\{[^}]*margin-inline:-12px!important/);
  assert.match(promotedCommand, /background:linear-gradient\(126deg,#061923,#0b2d37\)!important/);
  assert.match(promotedCommand, /\.mcHeaderTeamMark img\{width:50px!important;height:50px!important\}/);
  assert.match(promotedCommand, /\.mcBrandCopy small\{color:#c8ff1a!important;font-size:11px!important/);
  assert.match(promotedCommand, /\.mcBrandCopy strong\{[^}]*font-size:22px!important/);
});

test('Coach primary decision has sports-product scale without adding a new CSS authority', () => {
  assert.match(promotedCommand, /\.mcHero h1\{max-width:9\.5ch!important;font-size:clamp\(39px,11vw,45px\)!important;line-height:\.91!important\}/);
  assert.match(promotedCommand, /\.mcHeroTeamMark\{top:22px!important;right:17px!important;width:76px!important;height:76px!important\}/);
  assert.match(promotedCss, /\.mcHero \{\n    min-height: 350px !important;\n    border-radius: 0 !important;/);
  assert.match(promotedCss, /\.mcRealityStrip \{[\s\S]*border-radius: 0 !important;[\s\S]*background: transparent !important;/);
});

test('Coach supporting information becomes editorial and respects mobile readability', () => {
  assert.match(promotedCss, /\.mcSection \{\n    overflow: visible;\n    border: 0;\n    border-top: 1px solid var\(--mc-hairline-modern\);\n    border-radius: 0;\n    background: transparent;\n    box-shadow: none;/);
  assert.match(promotedCss, /\.mcSectionHead small \{\n    font-size: 11px;/);
  assert.match(promotedCss, /\.mcAttentionMeta \{[\s\S]*font-size: 11px !important;/);
  assert.match(promotedCss, /\.mcTodayPlanCopy small \{\n    font-size: 11px;/);
  assert.match(promotedCss, /\.mcTodayPlan > button \{[\s\S]*min-height: 44px;/);
});

test('promotion is idempotent', () => {
  assert.equal(promoteCoachCommandCenter(promotedCommand), promotedCommand);
  assert.equal(promoteCoachFinalCss(promotedCss), promotedCss);
});
