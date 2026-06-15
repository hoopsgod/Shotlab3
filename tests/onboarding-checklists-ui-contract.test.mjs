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

test('player getting started checklist copy remains defined for player home activation state', async () => {
  const source = await appSource();
  assert.match(source, /const playerChecklist=\[/);
  assert.match(source, /Join team/);
  assert.match(source, /View upcoming event/);
  assert.match(source, /RSVP to an event/);
  assert.match(source, /Log At Home Shots/);
  assert.match(source, /Check progress/);
});

test('coach setup checklist actionable navigation targets remain wired', async () => {
  const source = await appSource();
  assert.match(source, /Invite or add players",done:ups\.length>0,onClick:\(\)=>setTab\("players"\)/);
  assert.match(source, /Add first event",done:events\.length>0,onClick:\(\)=>setTab\("events"\)/);
  assert.match(source, /aria-label=\{item\.ariaLabel\|\|item\.label\}/);
});

test('player checklist actionable navigation targets remain wired', async () => {
  const source = await appSource();
  assert.match(source, /View upcoming event",done:hasUpcomingEvents,onClick:\(\)=>switchTab\("program"\)/);
  assert.match(source, /RSVP to an event",done:hasRsvped,onClick:\(\)=>switchTab\("program"\)/);
  assert.match(source, /Log At Home Shots",done:hasShotLogs,onClick:\(\)=>switchTab\("log-drill"\)/);
  assert.match(source, /Check progress",done:false,info:true,onClick:\(\)=>switchTab\("profile"\)/);
});

test('event persistence and RSVP logic contract strings remain intact', async () => {
  const source = await appSource();
  assert.match(source, /const scopedEvents=events\.filter\(e=>e\.teamId===user\?\.teamId\);/);
  assert.match(source, /const scopedRsvps=rsvps\.filter\(r=>r\.teamId===user\?\.teamId\);/);
  assert.match(source, /const toggleRsvp=async\(eid\)=>\{if\(!requirePlayer\(user,user\?\.teamId,user\?\.email\)\)return;/);
  assert.match(source, /\{id:genId\("rsvp"\),eventId:eid,email:user\.email,playerId:user\.email,teamId:user\.teamId,name:user\.name,ts:Date\.now\(\)\}/);
  assert.match(source, /const addEvent=async ev=>\{if\(user\?\.role!=="coach"\|\|!user\.teamId\)return\{ok:false\};/);
});


test('coach startup uses safe attendance derivation and no raw undefined attendance references', async () => {
  const source = await appSource();
  assert.doesNotMatch(source, /First attendance flow",done:attendance\.length>0/);
  assert.match(source, /const coachAttendancePct=useMemo\(\(\)=>\{/);
  assert.match(source, /First attendance flow",done:coachAttendancePct>0\|\|safeRsvps\.length>0/);
});

test('coach dashboard derives readiness and attendance from safe arrays', async () => {
  const source = await appSource();
  assert.match(source, /const safeEvents=useMemo\(\(\)=>Array\.isArray\(events\)\?events:\[\],\[events\]\);/);
  assert.match(source, /const safeRsvps=useMemo\(\(\)=>filterActiveTeamPlayerRows\(rsvps,activeTeamPlayerEmailSet\),\[rsvps,activeTeamPlayerEmailSet\]\);/);
  assert.match(source, /const safeScores=useMemo\(\(\)=>filterActiveTeamPlayerRows\(scores,activeTeamPlayerEmailSet\),\[scores,activeTeamPlayerEmailSet\]\);/);
  assert.match(source, /const safeRoster=useMemo\(\(\)=>Array\.isArray\(ups\)\?ups:\[\],\[ups\]\);/);
  assert.match(source, /const readinessCopy=safeRoster\.length===0\?"Roster needs players"/);
  assert.match(source, /const unresolvedNext7Count=next7Events\.reduce/);
  assert.match(source, /const unresolvedGapsLabel=unresolvedNext7Count===0\?"No open gaps"/);
});
