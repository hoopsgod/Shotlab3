import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const shell = fs.readFileSync('src/styles/DesktopHudlWorkspace2026.css', 'utf8');
const home = fs.readFileSync('src/components/CoachMissionControlTitleStage.css', 'utf8');
const players = fs.readFileSync('src/components/SecondaryPageSystem.css', 'utf8');

const desktopBlock = (css) => css.match(/@media\s*\(min-width:1024px\)[\s\S]*?(?=@media|$)/)?.[0] || '';

test('desktop shell establishes one persistent premium workspace frame', () => {
  const css = desktopBlock(shell);
  assert.match(css, /grid-template-columns:\s*232px\s+minmax\(0,1fr\)/);
  assert.match(css, /\.performance-shell\.is-desktop\s*>\s*\.sidebar-nav[^}]*height:100dvh/);
  assert.match(css, /\.performance-shell\.is-desktop\s*>\s*\.shell-main[^}]*min-height:100dvh/);
  assert.match(css, /\.performance-shell\.is-desktop\s+\.content-wrap[^}]*max-width:none/);
});

test('coach home desktop composition prioritizes operational information over hero scale', () => {
  assert.match(home, /@media\(min-width:1024px\)/);
  assert.match(home, /mcHero\[data-team-identity-stage="coach-mission-control"\][^{]*\{[^}]*min-height:244px/);
  assert.match(home, /\.mcAttention[^}]*min-height:244px/);
  assert.match(home, /\.mcTeamHealth[^}]*min-height:180px/);
  assert.match(home, /\.mcActivity[^}]*min-height:180px/);
  assert.match(home, /\.mcNextSession[^}]*min-height:180px/);
});

test('coach players becomes a dense roster workspace on desktop without changing mobile rules', () => {
  const css = desktopBlock(players);
  assert.match(css, /\[data-testid="coach-players-interactive-dashboard"\][^{]*\{[^}]*width:100%/);
  assert.match(css, /\[data-testid="coach-players-interactive-dashboard"\][^{]*\{[^}]*max-width:none/);
  assert.match(css, /\.coachRosterCard[^}]*border-radius:0/);
  assert.match(css, /\.coachRosterCard[^}]*box-shadow:none/);
  assert.match(css, /\.coachRosterCard\s*\+\s*\.coachRosterCard[^}]*border-top/);
});
