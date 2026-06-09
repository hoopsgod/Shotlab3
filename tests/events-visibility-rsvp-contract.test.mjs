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
    /const addEvent=async ev=>\{if\(user\?\.role!=="coach"\|\|!user\.teamId\)return\{ok:false\};const eventPayload=\{\.\.\.ev,id:genId\("event"\),teamId:user\.teamId,ownerCoachId:user\.email\};\s*try\{await P\("sl:events",\[\.\.\.events,eventPayload\],setEvents,\{strictRemote:true\}\);trackEvent\("event_created",\{eventType:ev\.type\|\|"run"\}\);return\{ok:true\};\}catch\(error\)\{/,
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
  assert.match(source, /\{id:genId\("rsvp"\),eventId:eid,email:user\.email,playerId:user\.email,teamId:user\.teamId,name:user\.name,ts:Date\.now\(\)\}/);
});

test('coach events page filters RSVP display by eventId and teamId', async () => {
  const source = await appSource();

  assert.match(
    source,
    /const coachEventRsvpRows=useCallback\(\(eventId\)=>rsvps\.filter\(r=>r\.eventId===eventId&&r\.teamId===u\?\.teamId\),\[rsvps,u\?\.teamId\]\);/,
  );
});

test('coach events cards display RSVP count and attendee labels', async () => {
  const source = await appSource();

  assert.match(source, /\{`\$\{evCoachRsvps\.length\} going`\}/);
  assert.match(source, /\{evCoachRsvpNames\.join\(", "\)\}/);
  assert.match(source, /No RSVPs yet — players can RSVP from their Events page\./);
});

test('coach events RSVP label prefers RSVP name, then roster lookup, then email', async () => {
  const source = await appSource();

  assert.match(source, /const directName=String\(r\?\.name\|\|''\)\.trim\(\);if\(directName\)return directName;/);
  assert.match(source, /const rosterName=rosterNameByEmail\.get\(fallbackEmail\);if\(rosterName&&String\(rosterName\)\.trim\(\)\)return rosterName;/);
  assert.match(source, /return String\(r\?\.email\|\|r\?\.playerId\|\|'Unknown player'\);/);
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


test('regression: addScSession still uses Date.now() id generation', async () => {
  const source = await appSource();

  assert.match(
    source,
    /const addScSession=async\(s\)=>\{if\(user\?\.role!=="coach"\|\|!user\.teamId\)return;await P\("sl:sc-sessions",\[\.\.\.scSessions,\{\.\.\.s,id:Date\.now\(\),teamId:user\.teamId,ownerCoachId:user\.email\}\],setScSessions\);/,
  );
});

test('coach Events screen has an always-visible inline Create Event form', async () => {
  const source = await appSource();

  assert.match(source, /const inlineCreateEventCard=<section data-coach-events-inline-create-card aria-label="Create event"/);
  assert.match(source, /<div className="coachEventsHeaderCard">[\s\S]*?\{inlineCreateEventCard\}[\s\S]*?\{nextEvent&&/);
  assert.match(source, /<span style=\{\{fontFamily:FD,fontSize:13,color:LIGHT,letterSpacing:1\}\}>EVENTS<\/span>[\s\S]*?\{inlineCreateEventCard\}[\s\S]*?\{events\.length===0\?/);
});

test('coach inline Create Event form exposes all required fields', async () => {
  const source = await appSource();

  assert.match(source, /<FF l="EVENT TITLE" v=\{ne\.title\}/);
  assert.match(source, /<FF l="DATE" v=\{ne\.date\}[\s\S]*?tp="date"/);
  assert.match(source, /<FF l="TIME" v=\{ne\.time\}/);
  assert.match(source, /<FF l="LOCATION" v=\{ne\.location\}/);
  assert.match(source, /<FF l="DETAILS \/ DESCRIPTION" v=\{ne\.desc\}[\s\S]*?ta/);
});

test('coach inline Save Event button is wired to handleAddEvent', async () => {
  const source = await appSource();

  assert.match(source, /<button className="btn-v cta-primary" onClick=\{handleAddEvent\}[^>]*>SAVE EVENT<\/button>/);
});

test('coach inline Create Event form renders validation and save errors visibly in the card', async () => {
  const source = await appSource();

  assert.match(source, /setEventValidationError\("Event title and date are required\."\);/);
  assert.match(source, /\{eventValidationError&&<div role="alert"[^>]*>Event title and date are required\.<\/div>\}/);
  assert.match(source, /\{eventSaveError&&<div role="alert"[^>]*>Event could not be saved\. Please try again\.<\/div>\}/);
});

test('coach create event flow is not hidden in PageHeader, event list, empty state, or modal-only UI', async () => {
  const source = await appSource();
  const eventsStart = source.indexOf('{tab==="events"&&');
  const eventsEnd = source.indexOf('{tab==="sc"&&', eventsStart);
  const eventsSource = source.slice(eventsStart, eventsEnd);
  const formIndex = eventsSource.indexOf('{inlineCreateEventCard}');
  const firstEventsLengthIndex = eventsSource.indexOf('events.length');
  const emptyStateIndex = eventsSource.indexOf('{events.length===0');

  assert.doesNotMatch(eventsSource, /PageHeader[^>]*(actionLabel|onAction)/);
  assert.equal(eventsSource.includes('role="dialog" aria-modal="true" aria-label="Create event"'), false);
  assert.ok(formIndex !== -1, 'inline create form renders in the Events tab');
  assert.ok(firstEventsLengthIndex !== -1, 'Events tab still references events.length for list UI');
  assert.ok(formIndex < firstEventsLengthIndex, 'inline create form renders before event-count gated UI');
  assert.ok(emptyStateIndex !== -1, 'Events tab still has an empty state');
  assert.ok(formIndex < emptyStateIndex, 'inline create form renders before the empty state');
});
