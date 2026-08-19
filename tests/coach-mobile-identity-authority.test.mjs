import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { enforceCoachMobileIdentityAuthority } from '../scripts/enforce-coach-mobile-identity-authority.mjs';

const foundationCss = fs.readFileSync(new URL('../public/shotlab-v3-foundation.css', import.meta.url), 'utf8');
const sessionIntegrityCss = fs.readFileSync(new URL('../public/shotlab-v15-session-integrity.css', import.meta.url), 'utf8');

test('final production reconciliation removes obsolete Coach identity geometry but preserves the component owner', () => {
  const source = `
body.mission-control-active .mcHeroTeamMark{width:68px!important;height:68px!important;max-width:68px!important}
html body #root [data-testid="coach-primary-objective"]{max-height:318px!important;overflow:hidden!important}
html body #root [data-testid="coach-primary-objective"] h1{font-size:39.375px!important;color:#111!important}
body.mission-control-active .mcProgramIdentity{color:#17242b!important;font-size:11px!important}
.mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"]{min-height:428px;max-height:none}
.mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroTeamMark{width:112px;height:112px;max-width:112px;max-height:112px}
.mcShellV3 .mcHero[data-team-identity-stage="coach-mission-control"] h1{font-size:48px;color:#f8fbfc}
`;
  const { css, changed } = enforceCoachMobileIdentityAuthority(source);
  assert.ok(changed >= 4);
  assert.doesNotMatch(css, /mcHeroTeamMark\{width:68px/);
  assert.doesNotMatch(css, /max-height:318px/);
  assert.doesNotMatch(css, /font-size:39\.375px/);
  assert.doesNotMatch(css, /mcProgramIdentity\{color:#17242b/);
  assert.match(css, /data-team-identity-stage="coach-mission-control"[^}]*min-height:428px/);
  assert.match(css, /data-team-identity-stage="coach-mission-control"[^}]*mcHeroTeamMark\{width:112px;height:112px/);
  assert.match(css, /data-team-identity-stage="coach-mission-control"[^}]*h1\{font-size:48px;color:#f8fbfc/);
});

test('production reconciliation preserves minifier-normalized Coach owner selectors', () => {
  const source = `
.mcShellV3 .mcHero[data-team-identity-stage=coach-mission-control]{min-height:428px;overflow:hidden}
.mcShellV3 .mcHero[data-team-identity-stage=coach-mission-control] .mcHeroTeamMark{width:112px;height:112px;max-width:112px;max-height:112px}
.mcShellV3 .mcHeader[data-testid=mission-control-team-header]{min-height:68px;padding:10px 12px;background:#071c28;color:#f5f8f9}
body.mission-control-active .mcHeroTeamMark{width:900px;height:900px}
`;
  const { css } = enforceCoachMobileIdentityAuthority(source);
  assert.match(css, /data-team-identity-stage=coach-mission-control[^}]*min-height:428px;overflow:hidden/);
  assert.match(css, /data-team-identity-stage=coach-mission-control[^}]*mcHeroTeamMark\{width:112px;height:112px;max-width:112px;max-height:112px/);
  assert.match(css, /data-testid=mission-control-team-header[^}]*min-height:68px;padding:10px 12px;background:#071c28;color:#f5f8f9/);
  assert.doesNotMatch(css, /mcHeroTeamMark\{width:900px;height:900px/);
});

test('legacy public layers cannot own Coach Mission Control title or mobile control-bar authority in dev', () => {
  assert.doesNotMatch(foundationCss, /body\.mission-control-active \.mcHero(?:\{|Content\{|TeamMark\{|\s+h1\{)/);
  assert.doesNotMatch(foundationCss, /body\.mission-control-active \.mcEyebrow\{/);
  assert.doesNotMatch(foundationCss, /body\.mission-control-active \.mcHeroContent>p\{/);
  assert.doesNotMatch(foundationCss, /\.mcCourtArtwork[^\n{]*\{display:none!important\}/);
  assert.doesNotMatch(foundationCss, /body\.mission-control-active \.mcHeader\{/);
  assert.doesNotMatch(foundationCss, /body\.mission-control-active \.mc(?:MobileMenu|Bell|TeamSelect)(?:,|\{)/);
  assert.doesNotMatch(sessionIntegrityCss, /\[data-testid="coach-primary-objective"\][^{]*\{[^}]*max-height:/s);
  assert.doesNotMatch(sessionIntegrityCss, /\[data-testid="coach-primary-objective"\][^{]*:is\(h1,h2\)[^{]*\{[^}]*font-size:/s);
});
