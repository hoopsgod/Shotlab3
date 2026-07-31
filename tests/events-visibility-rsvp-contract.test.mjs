import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

async function appSource() {
  return readFile(APP_PATH, 'utf8');
}

function playerEventsPanelSource(source) {
  const start = source.indexOf('function EventsPanel(');
  const end = source.indexOf('// ═══════════════════════════════════════\n// COACH SCREEN', start);
  assert.notEqual(start, -1, 'EventsPanel function should exist');
  assert.notEqual(end, -1, 'Coach screen boundary should exist after EventsPanel');
  return source.slice(start, end);
}

test('coach-created events are team-scoped and saved local-first', async () => {
  const source = await appSource();

  assert.match(
    source,
    /const addEvent=async ev=>\{if\(user\?\.role!=="coach"\|\|!user\.teamId\)return\{ok:false\};const eventPayload=\{\.\.\.ev,id:genId\("event"\),teamId:user\.teamId,ownerCoachId:user\.email\};\s*try\{await P\("sl:events",\[\.\.\.events,eventPayload\],setEvents,\{strictLocal:true\}\);trackEvent\("event_created",\{eventType:ev\.type\|\|"run"\}\);return\{ok:true\};\}catch\(error\)\{/,
  );
  assert.doesNotMatch(source, /P\("sl:events",\[\.\.\.events,eventPayload\],setEvents,\{strictRemote:true\}\)/);
});


test('event persistence has localStorage refresh fallback for local-first saves', async () => {
  const source = await appSource();

  assert.match(source, /const raw = window\.localStorage\?\.getItem\(k\);\s*local = raw \? JSON\.parse\(raw\) : null;/);
  assert.match(source, /window\.localStorage\?\.setItem\(k, serialized\);\s*localPersisted = true;/);
  assert.match(source, /if \(strictLocal && !localPersisted\) throw \(localError \|\| new Error\("local_persist_failed"\)\);/);
});

test('players only receive events and RSVPs for their registered team', async () => {
  const source = await appSource();

  assert.match(source, /const scopedEvents=events\.filter\(e=>e\.teamId===user\?\.teamId\);/);
  assert.match(source, /const scopedRsvps=rsvps\.filter\(r=>r\.teamId===user\?\.teamId\);/);
  assert.match(source, /<Player[^>]*events=\{scopedEvents\}[^>]*rsvps=\{scopedRsvps\}/s);
});


test("player Events panel does not render a WHO'S GOING attendee section", async () => {
  const source = await appSource();
  const panel = playerEventsPanelSource(source);

  assert.doesNotMatch(panel, /WHO['’]S GOING/);
});

test('player Events panel does not render RSVP attendee names or avatar cards', async () => {
  const source = await appSource();
  const panel = playerEventsPanelSource(source);

  assert.doesNotMatch(panel, /attendBoard/);
  assert.doesNotMatch(panel, /evR\.map\(\(r,i\)=>/);
  assert.doesNotMatch(panel, /<Av n=\{r\.name\}[^>]*email=\{r\.email\}/);
});

test('RSVP buttons do not render raw HTML entity text', async () => {
  const source = await appSource();

  assert.doesNotMatch(source, /&#10003; I\'M GOING/);
  assert.doesNotMatch(source, /RSVP NOW &#8594;/);
  assert.doesNotMatch(source, /&#10003; YOU\'RE IN/);
  assert.match(source, /\{going\?"✓ I\'M GOING":"RSVP NOW →"\}/);
  assert.match(source, /\{going\?<>✓ YOU\'RE IN — TAP TO CANCEL<\/>:<><LiftIcon size=\{16\} color=\{BG\}\/> RSVP NOW<\/>\}/);
});

test('only registered players on the team can RSVP and RSVP rows are team-scoped', async () => {
  const source = await appSource();

  assert.match(source, /const toggleRsvp=async\(eid\)=>\{if\(!requirePlayer\(user,user\?\.teamId,user\?\.email\)\)return;/);
  assert.match(source, /\{id:genId\("rsvp"\),eventId:eid,email:user\.email,playerId:user\.email,teamId:user\.teamId,name:user\.name,ts:Date\.now\(\)\}/);
});

test('coach events page filters RSVP display by eventId and teamId', async () => {
  const source = await appSource();

  assert.match(source, /import \{ getCoachEventRsvpRows, getCoachRsvpLabel \} from "\.\/lib\/coachEventRsvpVisibility\.js";/);
  assert.match(source, /const coachEventRsvpRows=useCallback\(\(eventId\)=>getCoachEventRsvpRows\(safeRsvps,eventId,u\?\.teamId\),\[safeRsvps,u\?\.teamId\]\);/);
});

test('coach events cards display RSVP counts and a clear RSVP names section', async () => {
  const source = await appSource();

  assert.match(source, /\{`\$\{evR\.length\} confirmed`\}/);
  assert.match(source, /\{evR\.length\} CONFIRMED/);
  assert.match(source, /\{missingResponses\} NO RESPONSE/);
  assert.match(source, /ATTENDEES \(\{evR\.length\}\)/);
  assert.match(source, /evRsvpPreview\.length>0\?evRsvpPreview\.join\(", "\):"No RSVPs yet — players can RSVP from their Events page\."/);
});

test('coach event card derives RSVP names from rows tied to that event', async () => {
  const source = await appSource();

  assert.match(source, /filteredEvents\.map\(ev=>\{const evR=coachEventRsvpRows\(ev\.id\);const evRsvpPreview=evR\.slice\(0,3\)\.map\(coachRsvpLabel\);/);
  assert.match(source, /const coachRsvpLabel=useCallback\(\(r\)=>getCoachRsvpLabel\(r,rosterNameByEmail\),\[rosterNameByEmail\]\);/);
});

test('coach events RSVP labels use the shared RSVP visibility helper', async () => {
  const source = await appSource();

  assert.match(source, /import \{ getCoachEventRsvpRows, getCoachRsvpLabel \} from "\.\/lib\/coachEventRsvpVisibility\.js";/);
  assert.match(source, /const coachRsvpLabel=useCallback\(\(r\)=>getCoachRsvpLabel\(r,rosterNameByEmail\),\[rosterNameByEmail\]\);/);
  assert.match(source, /evRsvpPreview=evR\.slice\(0,3\)\.map\(coachRsvpLabel\)/);
});

test('event save failures show a visible non-technical coach error', async () => {
  const source = await appSource();

  assert.match(source, /setEventSaveError\("Event could not be saved\. Please try again\."\);/);
  assert.match(source, /\{eventSaveError&&<div role="alert"[^>]*>Event could not be saved\. Please try again\.<\/div>\}/);
});

test('event save failures keep detailed logging in console', async () => {
  const source = await appSource();

  assert.match(source, /console\.error\("event_save_failed",\{error,userEmail:String\(user\?\.email\|\|""\),teamId:String\(user\?\.teamId\|\|""\),eventTitle:String\(ev\?\.title\|\|""\)\}\);/);
});


test('S&C session creation keeps Date.now() ids and requires signed remote persistence', async () => {
  const source = await appSource();

  assert.match(
    source,
    /const addScSession=async\(s\)=>\{if\(user\?\.role!=="coach"\|\|!user\.teamId\)return\{ok:false,error:"Not authorized"\};try\{await P\("sl:sc-sessions",\[\.\.\.scSessions,\{\.\.\.s,id:Date\.now\(\),teamId:user\.teamId,ownerCoachId:user\.email\}\],setScSessions,\{strictRemote:true\}\);/,
  );
});
