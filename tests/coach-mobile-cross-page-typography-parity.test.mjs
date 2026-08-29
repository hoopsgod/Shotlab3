import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shared = readFileSync('src/components/TeamIdentityTitleStage.css', 'utf8');
const shell = readFileSync('src/components/CoachMissionControlShell.css', 'utf8');

const normalize = (value) => value.replace(/\s+/g, '');

test('Coach mobile title scale matches the shared mobile page-title system', () => {
  const sharedNormalized = normalize(shared);
  const shellNormalized = normalize(shell);

  assert.match(sharedNormalized, /--identity-title:clamp\(42px,10\.2vw,44px\)/);
  assert.match(sharedNormalized, /font:820var\(--identity-title\)\/\.92/);
  assert.match(sharedNormalized, /font:78011px\/1\.2/);
  assert.match(sharedNormalized, /font:52014px\/1\.45/);

  assert.match(shellNormalized, /\.mcProgramIdentity\{font:78011px\/1\.2/);
  assert.match(shellNormalized, /h1\{font:820clamp\(42px,10\.2vw,44px\)\/\.92/);
  assert.match(shellNormalized, /\.mcHeroContent>p\{font:52014px\/1\.45/);
});

test('Coach mobile utility bar cannot compete visually with the page title', () => {
  const shellNormalized = normalize(shell);
  assert.match(shellNormalized, /\.mcBrandLockup\{visibility:hidden!important\}/);
  assert.match(shellNormalized, /mission-control-team-header[^}]*min-height:52px!important/);
  assert.match(shellNormalized, /-webkit-text-size-adjust:100%!important/);
});
