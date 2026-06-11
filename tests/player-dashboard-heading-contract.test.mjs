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
const quickActionsStart = appSource.indexOf('className="player-quick-actions"');
const quickActionsEnd = quickActionsStart >= 0 ? appSource.indexOf('</div>', quickActionsStart) : -1;
const playerQuickActions = quickActionsStart >= 0 && quickActionsEnd >= 0 ? appSource.slice(quickActionsStart, quickActionsEnd + 6) : '';
const playerFunctionSignature = appSource.match(/function Player\(\{[\s\S]*?\}\)\{/)?.[0] || '';
const playerViewInvocation = appSource.match(/<Player u=\{user\}[\s\S]*?\/>/)?.[0] || '';

const criticalPlayerBehaviorHandlers = [
  'addShotLog',
  'toggleRsvp',
  'toggleScRsvp',
  'homeShotsLeaderboard',
  'refreshHomeShotsLeaderboard',
];

test('player dashboard heading renders player identity through premium header system', () => {
  assert.match(appSource, /import PlayerDashboardHeader from "\.\/components\/PlayerDashboardHeader";/);
  assert.match(appSource, /<PlayerDashboardHeader[\s\S]*userName=\{u\.name\}/);
  assert.match(playerHeaderSource, /Demo Player/);
  assert.match(playerHeaderSource, /Player Mode/);
  assert.match(playerHeaderSource, /data-dashboard-header="player-premium"/);
  assert.match(playerHeaderSource, /CoachDashboardHeader\.module\.css/);
  assert.match(headerCss, /\.playerHeader/);
  assert.doesNotMatch(headerCss, /\.playerHeader \.name \{ font-size: clamp\(24px, 8vw, 34px\); \}/);
});

test('player heading keeps coach-only controls out of the player header', () => {
  assert.doesNotMatch(playerHeaderSource, /Team Branding Settings|joinCode|CoachCommandCenter|Roster|Coach Mode/);
  assert.doesNotMatch(playerHeaderInvocation, /Team Branding Settings|openTeamBranding|CoachCommandCenter|regenerateJoinCode|addRosterPlayer/);
});

test('coach dashboard header remains present and wired to coach dashboard behavior', () => {
  assert.match(coachHeaderSource, /export default function CoachDashboardHeader/);
  assert.match(coachHeaderSource, /Team Branding Settings/);
  assert.match(appSource, /<CoachDashboardHeader[\s\S]*onOpenTeamBranding=\{openTeamBranding\}/);
});

test('player dashboard behavior handlers remain present', () => {
  criticalPlayerBehaviorHandlers.forEach((handlerName) => {
    assert.equal(appSource.includes(handlerName), true, `${handlerName} should remain present`);
  });
});

test('player quick actions render Profile and Logout only', () => {
  assert.match(playerQuickActions, /aria-label="Player quick actions"/);
  assert.match(playerQuickActions, /aria-label="Open profile"[\s\S]*>Profile<\/button>/);
  assert.match(playerQuickActions, /onClick=\{\(\)=>switchTab\("profile"\)\}/);
  assert.match(playerQuickActions, /aria-label="Log out"[\s\S]*>Logout<\/button>/);
  assert.match(playerQuickActions, /onClick=\{logout\}/);
  assert.equal((playerQuickActions.match(/<button/g) || []).length, 2);
});

test('player quick actions do not render Theme or wire setTheme', () => {
  assert.doesNotMatch(playerQuickActions, /Theme|Toggle theme|setTheme|theme=\{theme\}/);
  assert.doesNotMatch(playerViewInvocation, /setTheme=\{setTheme\}/);
  assert.doesNotMatch(playerFunctionSignature, /setTheme/);
});

test('player dashboard header keeps the 1135 coach-style hero structure with large brand mark', () => {
  assert.match(playerHeaderSource, /useTeamBranding/);
  assert.match(playerHeaderSource, /className=\{`\$\{styles\.header\} \$\{styles\.playerHeader\}`\}/);
  assert.match(playerHeaderSource, /<div className=\{styles\.inner\}>/);
  assert.match(playerHeaderSource, /<div className=\{styles\.identity\}>/);
  assert.match(playerHeaderSource, /<span className=\{styles\.badge\}>Player Mode<\/span>/);
  assert.match(playerHeaderSource, /<h1 className=\{styles\.name\}>/);
  assert.match(playerHeaderSource, /<p className=\{styles\.tagline\}>\{subtitle\}<\/p>/);
  assert.match(playerHeaderSource, /<div className=\{styles\.meta\}>/);
  assert.match(playerHeaderSource, /<img className=\{styles\.brandMark\}/);
});

test('player dashboard header does not include compact avatar or action cluster structure', () => {
  assert.doesNotMatch(playerHeaderSource, /avatarButton|playerActions|wordmarkPanel|profileInitial|iconActions|actions/);
  assert.doesNotMatch(playerHeaderInvocation, /wordmark=|onOpenProfile=|profileInitial=|actions=/);
});

test('coach remains the only branding and theme-control surface', () => {
  assert.match(coachHeaderSource, /Team Branding Settings/);
  assert.match(appSource, /<CoachDashboardHeader[\s\S]*onOpenTeamBranding=\{openTeamBranding\}/);
  assert.match(appSource, /view==="coach-branding"[\s\S]*<CoachTeamBrandingScreen/);
  assert.match(appSource, /Today's Focus Theme/);
  assert.doesNotMatch(playerHeaderSource, /Team Branding Settings|CoachTeamBrandingScreen|Today's Focus Theme/);
  assert.doesNotMatch(playerQuickActions, /Team Branding Settings|CoachTeamBrandingScreen|Today's Focus Theme/);
});

test('theme state remains writable for non-player coach control surfaces', () => {
  assert.match(appSource, /\[theme,setTheme\]=useState\("dark"\)/);
  assert.doesNotMatch(playerViewInvocation, /setTheme=\{setTheme\}/);
});

test('data, auth, and logging behavior wiring remains unchanged', () => {
  criticalPlayerBehaviorHandlers.forEach((handlerName) => {
    assert.match(playerViewInvocation, new RegExp(handlerName));
    assert.match(playerFunctionSignature, new RegExp(handlerName));
  });
  ['login', 'register', 'logout', 'deleteAccount'].forEach((handlerName) => {
    assert.equal(appSource.includes(handlerName), true, `${handlerName} should remain present`);
  });
});
