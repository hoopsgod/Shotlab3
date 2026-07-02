import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const compactCardSource = fs.readFileSync(new URL('../src/components/CompactLeaderboardPreviewCard.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('player dashboard mounts compact leaderboard preview with rank and top-3 rows', () => {
  assert.match(appSource, /<CompactLeaderboardPreviewCard\s+title="Team Leaders"/);
  assert.match(appSource, /mode="player"/);
  assert.match(appSource, /areaTitle="Leaderboards"/);
  assert.match(appSource, /categoryLabel="Home Shots"/);
  assert.match(appSource, /const playerDashboardHomeLeaderboardRows=useMemo\(\(\)=>filterActiveTeamLeaderboardRows\(buildAtHomeLeaderboardRows\(\{scores,shotLogs,programDrills,players:playerLeaderboardPlayers,limit:3\}\)/);
  assert.match(appSource, /rows=\{playerDashboardLeaderboardRows\}/);
  assert.match(appSource, /maxRows=\{3\}/);
  assert.match(compactCardSource, /Your rank: #\$\{playerRank\}/);
  assert.match(appSource, /Today's mission[\s\S]*<CompactLeaderboardPreviewCard[\s\S]*aria-label="Coach guidance summary"/);
});

test('coach dashboard mounts compact leaderboard preview with top-5 rows and clean empty state', () => {
  assert.match(appSource, /<CompactLeaderboardPreviewCard\s+title="Home Shot Leaders"/);
  assert.match(appSource, /mode="coach"/);
  assert.match(appSource, /categoryLabel="Home Shots"/);
  assert.match(appSource, /const rawCoachHomeLeaderboardRows=useMemo\(\(\)=>buildAtHomeLeaderboardRows\(\{scores:scopedHomeScores,shotLogs:scopedShotLogs,programDrills,players:appLeaderboardPlayers,limit:HOME_SHOTS_LEADERBOARD_LIMIT\}\)/);
  assert.match(appSource, /const canonicalCoachHomeLeaderboardRows=useMemo\(\(\)=>Array\.isArray\(coachHomeLeaderboardRows\)\?coachHomeLeaderboardRows:\[\]/);
  assert.match(appSource, /rows=\{coachDashboardLeaderboardRows\}/);
  assert.match(appSource, /maxRows=\{5\}/);
  assert.match(compactCardSource, /No team leaderboard data yet\. Players will appear here after they log shots\./);
  assert.match(appSource, /PageHeader title="COACH HOME"[\s\S]*<CompactLeaderboardPreviewCard[\s\S]*Coach setup checklist/);
  assert.equal(appSource.includes("COACH VIEW — FULL ACCESS"), false);
});

test('dashboard source keeps coach tabs without reintroducing Coaches tab', () => {
  assert.match(appSource, /const coachTabs=\["feed","drills","events","sc","players"\]/);
  assert.equal(appSource.includes('k:"coaches"'), false);
});

test('compact preview supports safe empty fallback states', () => {
  assert.match(compactCardSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(compactCardSource, /status === "success" && previewRows.length > 0/);
  assert.match(compactCardSource, /categoryLabel = "Home Shots"/);
  assert.match(compactCardSource, /areaTitle = "Leaderboards"/);
  assert.match(compactCardSource, /View all leaderboards/);
});

test('events pages are not the primary home-shots leaderboard location', () => {
  assert.match(appSource, /tab==="program"/);
  assert.match(appSource, /tab==="events"/);
  assert.match(appSource, /tab==="program"[\s\S]*EventsPanel/);
  assert.match(appSource, /tab==="events"[\s\S]*coach-events-management/);
  assert.match(appSource, /tab==="home"[\s\S]*CompactLeaderboardPreviewCard/);
  assert.match(appSource, /tab==="feed"[\s\S]*CompactLeaderboardPreviewCard/);
  assert.equal(appSource.includes("player-home-shots-leaderboard"), false);
  assert.equal(appSource.includes("coach-home-shots-leaderboard"), false);
});

test('dashboards do not duplicate compact preview with legacy top-10 blocks', () => {
  assert.equal(appSource.includes("TOP 10 PLAYER HOME SHOTS"), false);
  const usageMentions = (appSource.match(/<CompactLeaderboardPreviewCard/g) || []).length;
  assert.equal(usageMentions >= 2, true);
});

test('full leaderboards destination exists and includes all final categories with data-required copy', () => {
  assert.match(appSource, /tab===\"leaderboards\"/);
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole=\"player\"/);
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole=\"coach\"/);
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="coach" leaderboardRows=\{canonicalCoachHomeLeaderboardRows\}[\s\S]*homeScores=\{scores\} shotLogs=\{shotLogs\}/);
  assert.match(hubSource, /At-Home Shots/);
  assert.match(hubSource, /Events Attended/);
  assert.match(hubSource, /Strength & Conditioning/);
  assert.match(hubSource, /Program Drills/);
  assert.match(hubSource, /COMPETITION HUB/);
  assert.match(hubSource, /Track team effort across shots, events, strength work, and coach-assigned drills\./);
  assert.match(hubSource, /Event leaders will appear after players check into team events\./);
  assert.match(hubSource, /Strength leaders will appear after players complete assigned S&C work\./);
  assert.match(hubSource, /Program drill leaders will appear after players log coach-assigned drills\./);
  assert.match(hubSource, /No rankings yet/);
  assert.match(hubSource, /aria-selected=\{active\}/);
  assert.match(hubSource, /onClick=\{\(\) => setActiveLeaderboardCategory\(item.key\)\}/);
  assert.match(hubSource, /activeLeaderboardCategory === 'event_participation'/);
  assert.match(hubSource, /activeLeaderboardCategory === 'strength_conditioning_participation'/);
});


test('player leaderboard hub has a debug guard for filtered player rows', () => {
  assert.match(hubSource, /\[player-leaderboard\] Player leaderboard rows empty despite raw scores/);
  assert.match(hubSource, /rawHomeScoreCount/);
  assert.match(hubSource, /playerScopedProgramRowCount/);
  assert.match(hubSource, /activeLeaderboardCategory/);
});


test('coach leaderboard rows are roster-scoped after raw generation', () => {
  assert.match(appSource, /const rawCoachHomeLeaderboardRows=useMemo\(\(\)=>buildAtHomeLeaderboardRows/);
  assert.match(appSource, /const coachHomeLeaderboardRows=useMemo\(\(\)=>filterActiveTeamLeaderboardRows\(rawCoachHomeLeaderboardRows/);
  assert.match(hubSource, /const programDrillLeaderboardRows = useMemo\(\(\) => filterActiveTeamLeaderboardRows\(rawProgramDrillLeaderboardRows/);
  assert.match(hubSource, /\[leaderboard\] filtered non-roster program row/);
});
