import test from 'node:test';
import assert from 'node:assert/strict';
import { enforceCoachMobileIdentityAuthority } from '../scripts/enforce-coach-mobile-identity-authority.mjs';

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
