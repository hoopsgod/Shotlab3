import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

async function appSource() {
  return readFile(APP_PATH, 'utf8');
}

test('coach setup checklist copy exists on coach feed', async () => {
  const source = await appSource();
  assert.match(source, /Coach Setup/);
  assert.match(source, /Create or restore team/);
  assert.match(source, /Invite or add players/);
  assert.match(source, /Add first event/);
  assert.match(source, /Review Today's Pulse/);
  assert.match(source, /Check At Home Shots leaderboard/);
});

test('player getting started checklist copy exists on player home', async () => {
  const source = await appSource();
  assert.match(source, /Getting Started/);
  assert.match(source, /Join team/);
  assert.match(source, /View upcoming event/);
  assert.match(source, /RSVP to an event/);
  assert.match(source, /Log At Home Shots/);
  assert.match(source, /Check progress/);
});

test('event persistence and RSVP logic contract strings remain intact', async () => {
  const source = await appSource();
  assert.match(source, /const scopedEvents=events\.filter\(e=>e\.teamId===user\?\.teamId\);/);
  assert.match(source, /const scopedRsvps=rsvps\.filter\(r=>r\.teamId===user\?\.teamId\);/);
  assert.match(source, /const toggleRsvp=async\(eid\)=>\{if\(!requirePlayer\(user,user\?\.teamId,user\?\.email\)\)return;/);
  assert.match(source, /\{id:genId\("rsvp"\),eventId:eid,email:user\.email,playerId:user\.email,teamId:user\.teamId,name:user\.name,ts:Date\.now\(\)\}/);
  assert.match(source, /const addEvent=async ev=>\{if\(user\?\.role!=="coach"\|\|!user\.teamId\)return\{ok:false\};/);
});
