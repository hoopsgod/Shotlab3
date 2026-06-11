import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const playerHeaderSource = fs.readFileSync(new URL('../src/components/PlayerDashboardHeader.jsx', import.meta.url), 'utf8');
const coachHeaderSource = fs.readFileSync(new URL('../src/components/CoachDashboardHeader.jsx', import.meta.url), 'utf8');
const headerCss = fs.readFileSync(new URL('../src/components/CoachDashboardHeader.module.css', import.meta.url), 'utf8');

const playerHeaderStart = appSource.indexOf('<PlayerDashboardHeader');
const playerHeaderEnd = playerHeaderStart >= 0 ? appSource.indexOf('\n/>', playerHeaderStart) : -1;
const playerHeaderInvocation = playerHeaderStart >= 0 && playerHeaderEnd >= 0 ? appSource.slice(playerHeaderStart, playerHeaderEnd + 3) : '';
const playerFunctionSignature = appSource.match(/function Player\(\{[\s\S]*?\}\)\{/)?.[0] || '';
const playerViewInvocation = appSource.match(/<Player u=\{user\}[\s\S]*?\/>/)?.[0] || '';

test('player dashboard heading renders player identity through premium header system', () => {
  assert.match(appSource, /import PlayerDashboardHeader from "\.\/components\/PlayerDashboardHeader";/);
  assert.match(appSource, /<PlayerDashboardHeader[\s\S]*userName=\{u\.name\}/);
  assert.match(playerHeaderSource, /Demo Player/);
  assert.match(playerHeaderSource, /Player Mode/);
  assert.match(playerHeaderSource, /data-dashboard-header="player-premium"/);
  assert.match(playerHeaderSource, /CoachDashboardHeader\.module\.css/);
  assert.match(headerCss, /\.playerHeader/);
  assert.match(headerCss, /\.playerHeader \.name \{ font-size: clamp\(24px, 8vw, 34px\); \}/);
  assert.doesNotMatch(headerCss, /\n\s*\.name \{ font-size: clamp\(24px, 8vw, 34px\); \}/);
});

test('player heading keeps coach-only controls out of the player header', () => {
  assert.doesNotMatch(playerHeaderSource, /Team Branding Settings|joinCode|CoachCommandCenter|Roster|Coach Mode/);
  assert.doesNotMatch(appSource.match(/<PlayerDashboardHeader[\s\S]*?\/\>/)?.[0] || '', /Team Branding Settings|openTeamBranding|CoachCommandCenter|regenerateJoinCode|addRosterPlayer/);
});

test('coach dashboard header remains present and wired to coach dashboard behavior', () => {
  assert.match(coachHeaderSource, /export default function CoachDashboardHeader/);
  assert.match(coachHeaderSource, /Team Branding Settings/);
  assert.match(appSource, /<CoachDashboardHeader[\s\S]*onOpenTeamBranding=\{openTeamBranding\}/);
});

test('player dashboard behavior handlers remain present', () => {
  ['addShotLog', 'toggleRsvp', 'toggleScRsvp', 'homeShotsLeaderboard', 'refreshHomeShotsLeaderboard'].forEach((handlerName) => {
    assert.equal(appSource.includes(handlerName), true, `${handlerName} should remain present`);
  });
});

test('player quick actions keep profile and logout but remove theme control', () => {
  assert.doesNotMatch(playerHeaderInvocation, /Toggle theme|setTheme|theme=\{theme\}|aria-label="Theme"|>Theme</);
  assert.match(playerHeaderInvocation, /aria-label="Open profile"/);
  assert.match(playerHeaderInvocation, /onClick=\{\(\)=>switchTab\("profile"\)\}/);
  assert.match(playerHeaderInvocation, /aria-label="Log out"/);
  assert.match(playerHeaderInvocation, /onClick=\{logout\}/);
});

test('player source no longer receives or wires setTheme into player quick actions', () => {
  assert.doesNotMatch(playerViewInvocation, /setTheme=\{setTheme\}/);
  assert.doesNotMatch(playerFunctionSignature, /setTheme/);
  assert.doesNotMatch(playerHeaderInvocation, /setTheme/);
});

test('coach remains the theme-control surface', () => {
  assert.match(coachHeaderSource, /Team Branding Settings/);
  assert.match(appSource, /<CoachDashboardHeader[\s\S]*onOpenTeamBranding=\{openTeamBranding\}/);
  assert.match(appSource, /view==="coach-branding"[\s\S]*<CoachTeamBrandingScreen/);
  assert.match(appSource, /Today's Focus Theme/);
});

test('player dashboard header keeps coach-style hero structure and brand mark slot', () => {
  assert.match(playerHeaderSource, /<section className=\{`\$\{styles\.header\} \$\{styles\.playerHeader\}`\}/);
  assert.match(playerHeaderSource, /<div className=\{`\$\{styles\.inner\} \$\{styles\.playerInner\}`\}>/);
  assert.match(playerHeaderSource, /styles\.identityRow/);
  assert.match(playerHeaderSource, /styles\.wordmarkPanel/);
  assert.match(playerHeaderInvocation, /wordmark=\{<BrandWordmark size=\{20\} small\/>\}/);
});
