import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);
const LEADERBOARD_PATH = new URL('../src/components/HomeShotsLeaderboardCard.jsx', import.meta.url);

async function appSource() {
  return readFile(APP_PATH, 'utf8');
}

async function leaderboardSource() {
  return readFile(LEADERBOARD_PATH, 'utf8');
}

test('coach with zero players: Today\'s Pulse shows zero-roster copy and avoids misleading success state', async () => {
  const source = await appSource();

  assert.match(source, /if\(totalPlayers<=0\)return"No players yet — invite players to start tracking activity\.";/);
  assert.match(source, /const pulseIsGood=hasRosterPlayers&&inactive\.length===0;/);
  assert.match(source, /\{pulseIsGood\?"✓ ":"• "\}\{pulseCopy\}/);

  assert.doesNotMatch(source, /const pulseIsGood=inactive\.length===0;/);
});

test('coach with players but no activity: Today\'s Pulse has inactive follow-up copy and not zero-player copy', async () => {
  const source = await appSource();

  assert.match(source, /if\(inactivePlayers\.length===1\)\{/);
  assert.match(source, /hasn't logged activity this week\./);
  assert.match(source, /players haven't logged activity this week:/);

  assert.doesNotMatch(source, /if\(inactivePlayers\.length>0\)return"No players yet — invite players to start tracking activity\.";/);
});

test('coach events empty state asks coach to add first event', async () => {
  const source = await appSource();
  assert.match(source, /No events yet — add your first event to get the team moving\./);
});

test('At Home Shots leaderboard empty state explains no shots logged yet', async () => {
  const source = await leaderboardSource();

  assert.match(source, /No leaderboard data yet\. Log shots to enter the rankings\./);
});

test('player events empty state is present for teams with no events', async () => {
  const source = await appSource();

  assert.match(source, /No events yet — add your first event to get the team moving\./);
  assert.match(source, /No RSVPs yet — players can RSVP from their Events page\./);
});

test('player home with no shot logs does not present completed progress-success treatment', async () => {
  const source = await appSource();

  assert.match(source, /\{my\.length===0&&<Empty t="No shots logged yet" action="Track your makes from any session — gym, driveway, anywhere\. Every shot counts!"\/>\}/);
  assert.match(source, /\{label:"Log At Home Shots",done:hasShotLogs/);
  assert.doesNotMatch(source, /\{label:"Log At Home Shots",done:true/);
});
