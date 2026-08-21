import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('registered sparse Coach activation remains component-owned', () => {
  const foundation = read('public/shotlab-v3-foundation.css');
  const legacySession = read('public/shotlab-v15-session-integrity.css');
  const reboot = read('src/lib/visualSystemReboot.js');
  const activation = read('src/components/CoachActivationPath.css');

  const foundationSupportRule = foundation.match(/body\.mission-control-active \.mcSection,[^{]+\{/s)?.[0] || '';
  assert.ok(foundationSupportRule, 'expected the legacy V3 support-surface rule');
  assert.doesNotMatch(foundationSupportRule, /\.mcTodayPlan/);

  const rebootSupportRule = reboot.match(/body\.mission-control-active \.mcSection,[^{]+\{/s)?.[0] || '';
  assert.ok(rebootSupportRule, 'expected the runtime reboot support-surface rule');
  assert.doesNotMatch(rebootSupportRule, /\.mcTodayPlan/);

  assert.doesNotMatch(
    legacySession,
    /\[data-testid="coach-onboarding-state"\]/,
    'legacy session CSS must not override the source-owned Coach activation surface',
  );
  assert.match(activation, /\.mcActivationPlan\s*\{[\s\S]*linear-gradient/);
  assert.match(activation, /\.mcActivationPlan \.mcTodayPlanCopy strong\s*\{[\s\S]*color:#fff/);
  assert.match(activation, /@media\(max-width:700px\)/);
  assert.match(activation, /@media\(prefers-reduced-motion:reduce\)/);
});

test('registered Coach without a custom logo uses team-derived monogram identity', () => {
  const commandCenter = read('src/components/CoachCommandCenter.jsx');
  const fallbackCss = read('src/components/CoachTeamMonogramFallback.css');

  assert.doesNotMatch(commandCenter, /Click here to add your custom team logo/);
  assert.match(commandCenter, /const mark = initials\(teamName\)/);
  assert.match(commandCenter, /data-team-logo-fallback=\{mark\}/);
  assert.match(commandCenter, /<strong>\{mark\}<\/strong><small>Add logo<\/small>/);
  assert.match(commandCenter, /<LogoSetupPrompt teamName=\{teamName\} className="mcHeroLogoSetup" \/>/);
  assert.match(fallbackCss, /\.mcHeroTeamMark \.mcTeamFallback/);
  assert.match(fallbackCss, /var\(--team-brand-surface-deep/);
});
