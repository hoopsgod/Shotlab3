import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const compactCardSource = fs.readFileSync(new URL('../src/components/CompactLeaderboardPreviewCard.jsx', import.meta.url), 'utf8');

test('player dashboard mounts compact leaderboard preview with rank and top-3 rows', () => {
  assert.match(appSource, /<CompactLeaderboardPreviewCard\s+title="Team Leaders"/);
  assert.match(appSource, /mode="player"/);
  assert.match(appSource, /areaTitle="Leaderboards"/);
  assert.match(appSource, /categoryLabel="Home Shots"/);
  assert.match(appSource, /maxRows=\{3\}/);
  assert.match(compactCardSource, /Your rank: #\$\{playerRank\}/);
});

test('coach dashboard mounts compact leaderboard preview with top-5 rows and clean empty state', () => {
  assert.match(appSource, /<CompactLeaderboardPreviewCard\s+title="Home Shot Leaders"/);
  assert.match(appSource, /mode="coach"/);
  assert.match(appSource, /categoryLabel="Home Shots"/);
  assert.match(appSource, /maxRows=\{5\}/);
  assert.match(compactCardSource, /No team leaderboard data yet\. Players will appear here after they log shots\./);
});

test('dashboard source keeps coach tabs without reintroducing Coaches tab', () => {
  assert.match(appSource, /const coachTabs=\["feed","drills","events","sc","players"\]/);
  assert.equal(appSource.includes('"coaches"'), false);
  assert.equal(appSource.includes('Event Participation'), false);
  assert.equal(appSource.includes('Strength & Conditioning'), false);
});

test('compact preview supports safe empty fallback states', () => {
  assert.match(compactCardSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(compactCardSource, /status === "success" && previewRows.length > 0/);
  assert.match(compactCardSource, /categoryLabel = "Home Shots"/);
  assert.match(compactCardSource, /areaTitle = "Leaderboards"/);
});
