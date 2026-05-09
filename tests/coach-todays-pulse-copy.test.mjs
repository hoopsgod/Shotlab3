import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

test("Today's Pulse inactive player copy handles zero-roster and inactive variants", async () => {
  const source = await readFile(APP_PATH, 'utf8');

  assert.match(source, /if\(totalPlayers<=0\)return"No players yet — invite players to start tracking activity\.";/);
  assert.match(source, /if\(inactivePlayers\.length===0\)return"All players have logged activity this week\.";/);
  assert.match(source, /if\(inactivePlayers\.length===1\)\{/);
  assert.match(source, /hasn't logged activity this week\./);
  assert.match(source, /players haven't logged activity this week:/);
  assert.match(source, /const hasRosterPlayers=ups\.length>0;/);
  assert.match(source, /const pulseIsGood=hasRosterPlayers&&inactive\.length===0;/);
  assert.match(source, /color:pulseIsGood\?VOLT:T\.SUB/);
  assert.match(source, /\{pulseIsGood\?"✓ ":"• "\}\{pulseCopy\}/);

  assert.doesNotMatch(source, /player\{inactive\.length>1\?"s":""\} haven't logged this week/);
});
