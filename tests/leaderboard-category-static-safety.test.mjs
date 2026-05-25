import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

test('no legacy unsafe leaderboardCategory variable remains in source', () => {
  const matchesRaw = execSync('rg -n "leaderboardCategory" src tests pages layouts || true', { encoding: 'utf8' }).trim();
  const lines = matchesRaw ? matchesRaw.split('\n').filter(Boolean) : [];
  const allowedSelfReference = ['tests/leaderboard-category-static-safety.test.mjs'];
  const disallowed = lines.filter((line) => !allowedSelfReference.some((allowed) => line.startsWith(`${allowed}:`)));
  assert.equal(disallowed.length, 0, `Found unsafe legacy leaderboardCategory references:\n${disallowed.join('\n')}`);
});

test('leaderboards category controls and empty-state copy are present for safe fallback', () => {
  const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(appSource, /const \[activeLeaderboardCategory,setActiveLeaderboardCategory\]=useState\("home_shots"\)/);
  assert.match(appSource, /activeLeaderboardCategory==="home_shots"/);
  assert.match(appSource, /activeLeaderboardCategory==="event_participation"/);
  assert.match(appSource, /activeLeaderboardCategory==="strength_conditioning_participation"/);
  assert.match(appSource, /Coach Custom Drills/);
  assert.match(appSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(appSource, /No team leaderboard data yet\. Players will appear here after they log shots\./);
});
