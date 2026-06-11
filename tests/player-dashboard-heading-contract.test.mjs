import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const playerHeaderSource = fs.readFileSync(new URL('../src/components/PlayerDashboardHeader.jsx', import.meta.url), 'utf8');
const coachHeaderSource = fs.readFileSync(new URL('../src/components/CoachDashboardHeader.jsx', import.meta.url), 'utf8');
const headerCss = fs.readFileSync(new URL('../src/components/CoachDashboardHeader.module.css', import.meta.url), 'utf8');

test('player dashboard heading uses the same premium structure as CoachDashboardHeader', () => {
  assert.match(appSource, /import PlayerDashboardHeader from "\.\/components\/PlayerDashboardHeader";/);
  assert.match(appSource, /<PlayerDashboardHeader[\s\S]*userName=\{u\.name\}/);
  assert.match(playerHeaderSource, /Demo Player/);
  assert.match(playerHeaderSource, /Player Mode/);
  assert.match(playerHeaderSource, /data-dashboard-header="player-premium"/);
  assert.match(playerHeaderSource, /CoachDashboardHeader\.module\.css/);

  ['header', 'inner', 'identity', 'badge', 'name', 'tagline', 'meta', 'dot', 'brandMark'].forEach((className) => {
    assert.match(playerHeaderSource, new RegExp(`styles\\.${className}`), `${className} should be shared with CoachDashboardHeader`);
    assert.match(coachHeaderSource, new RegExp(`styles\\.${className}`), `${className} should remain in CoachDashboardHeader`);
  });
});

test('player heading renders the large brand mark and no compact app-header controls inside the hero', () => {
  assert.match(playerHeaderSource, /useTeamBranding/);
  assert.match(playerHeaderSource, /branding\?\.logoUrl \|\| branding\?\.logoMarkUrl/);
  assert.match(playerHeaderSource, /<img className=\{styles\.brandMark\}/);
  assert.doesNotMatch(playerHeaderSource, /avatarButton|iconActions|wordmarkPanel|onOpenProfile|profileInitial|Toggle theme|Log out|logout|setTheme/);
});

test('player heading keeps coach-only controls out of the player header', () => {
  assert.doesNotMatch(playerHeaderSource, /Team Branding Settings|joinCode|CoachCommandCenter|Roster|Coach Mode|brandBtn|onOpenTeamBranding/);
  assert.doesNotMatch(appSource.match(/<PlayerDashboardHeader[\s\S]*?\/\>/)?.[0] || '', /Team Branding Settings|openTeamBranding|CoachCommandCenter|regenerateJoinCode|addRosterPlayer/);
});

test('coach dashboard header remains present and wired to coach dashboard behavior', () => {
  assert.match(coachHeaderSource, /export default function CoachDashboardHeader/);
  assert.match(coachHeaderSource, /Team Branding Settings/);
  assert.match(appSource, /<CoachDashboardHeader[\s\S]*onOpenTeamBranding=\{openTeamBranding\}/);
  assert.equal(headerCss.includes('.playerHeader'), false, 'player-only wrapper CSS should not alter CoachDashboardHeader styles');
});

test('existing player behavior handlers remain present outside the heading hero', () => {
  ['addShotLog', 'toggleRsvp', 'toggleScRsvp', 'homeShotsLeaderboard', 'refreshHomeShotsLeaderboard', 'switchTab("profile")', 'setTheme', 'logout'].forEach((handlerName) => {
    assert.equal(appSource.includes(handlerName), true, `${handlerName} should remain present`);
  });
});
