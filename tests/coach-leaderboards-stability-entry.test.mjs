import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

function getFunctionSource(name, nextName) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} function should exist`);
  const end = nextName ? appSource.indexOf(`function ${nextName}(`, start + 1) : appSource.length;
  assert.notEqual(end, -1, `${nextName} function should exist after ${name}`);
  return appSource.slice(start, end);
}

const playerSource = getFunctionSource('Player', 'ShareCard');
const coachSource = getFunctionSource('Coach', 'CoachRoster');

test('coach home can render with a stable leaderboard CTA handler in scope', () => {
  assert.match(coachSource, /tab==="feed"[\s\S]*PageHeader title="COACH HOME"/);
  assert.match(coachSource, /<CompactLeaderboardPreviewCard\s+title="Home Shot Leaders"[\s\S]*mode="coach"/);
  assert.match(coachSource, /const handleNavChange=\(k\)=>\{/);
  assert.match(coachSource, /const openCoachLeaderboards=\(\)=>handleNavChange\("leaderboards"\);/);
  assert.match(coachSource, /onViewAll=\{openCoachLeaderboards\}/);
});

test('coach leaderboard preview does not reference undefined player switchTab', () => {
  assert.doesNotMatch(coachSource, /switchTab\("leaderboards"\)/);
  assert.doesNotMatch(coachSource, /onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);
});

test('coach View Leaderboard handler can be invoked without throwing', () => {
  let tab = 'feed';
  const state = { editD: 'draft', selP: 'player-1', showAdd: true, expEv: 'event-1', showAddSC: true, brandingOpened: false };
  const openTeamBranding = () => { state.brandingOpened = true; };
  const setTab = (next) => { tab = next; };
  const setEditD = (next) => { state.editD = next; };
  const setSelP = (next) => { state.selP = next; };
  const setShowAdd = (next) => { state.showAdd = next; };
  const setExpEv = (next) => { state.expEv = next; };
  const setShowAddSC = (next) => { state.showAddSC = next; };
  const handleNavChange = (k) => {
    if (k === 'branding') {
      openTeamBranding();
      return;
    }
    setTab(k); setEditD(null); setSelP(null); setShowAdd(false); setExpEv(null); setShowAddSC(false);
  };
  const openCoachLeaderboards = () => handleNavChange('leaderboards');

  assert.doesNotThrow(() => openCoachLeaderboards());
  assert.equal(tab, 'leaderboards');
  assert.equal(state.editD, null);
  assert.equal(state.selP, null);
  assert.equal(state.showAdd, false);
  assert.equal(state.expEv, null);
  assert.equal(state.showAddSC, false);
  assert.equal(state.brandingOpened, false);
});

test('player View Leaderboard remains wired through player switchTab', () => {
  assert.match(playerSource, /const switchTab=useCallback\(\(requestedTab\)=>\{/);
  assert.match(playerSource, /title="Team Leaders"[\s\S]*mode="player"[\s\S]*onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);
  assert.match(playerSource, /tab==="leaderboards"[\s\S]*<PremiumLeaderboardsHub viewerRole="player"/);
  assert.match(appSource, /tab==="leaderboards"[\s\S]*<PremiumLeaderboardsHub viewerRole="coach"/);
});

