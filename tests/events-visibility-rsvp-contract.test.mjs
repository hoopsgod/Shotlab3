import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

async function appSource() {
  return readFile(APP_PATH, 'utf8');
}

test('coach-created events are team-scoped', async () => {
  const source = await appSource();

  assert.match(
    source,
    /const addEvent=async ev=>\{if\(user\?\.role!=="coach"\|\|!user\.teamId\)return;await P\("sl:events",\[\.\.\.events,\{\.\.\.ev,id:Date\.now\(\),teamId:user\.teamId,ownerCoachId:user\.email\}\],setEvents\)/,
  );
});

test('players only receive events and RSVPs for their registered team', async () => {
  const source = await appSource();

  assert.match(source, /const scopedEvents=events\.filter\(e=>e\.teamId===user\?\.teamId\);/);
  assert.match(source, /const scopedRsvps=rsvps\.filter\(r=>r\.teamId===user\?\.teamId\);/);
  assert.match(source, /<Player[^>]*events=\{scopedEvents\}[^>]*rsvps=\{scopedRsvps\}/s);
});

test('only registered players on the team can RSVP and RSVP rows are team-scoped', async () => {
  const source = await appSource();

  assert.match(source, /const toggleRsvp=async\(eid\)=>\{if\(!requirePlayer\(user,user\?\.teamId,user\?\.email\)\)return;/);
  assert.match(source, /\{eventId:eid,email:user\.email,playerId:user\.email,teamId:user\.teamId,name:user\.name,ts:Date\.now\(\)\}/);
});
