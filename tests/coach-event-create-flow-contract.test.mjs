import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);
const COMMAND_CENTER_PATH = new URL('../src/components/CoachCommandCenter.jsx', import.meta.url);

async function appSource() {
  return readFile(APP_PATH, 'utf8');
}

async function commandCenterSource() {
  return readFile(COMMAND_CENTER_PATH, 'utf8');
}

function coachEventsMobileMarkup(source) {
  const start = source.indexOf('<div data-testid="coach-events-mobile-page"');
  const end = source.indexOf('{showAdd&&<div className="fade-up"', start);
  assert.notEqual(start, -1, 'Coach Events mobile section marker is missing');
  assert.notEqual(end, -1, 'Coach Events modal boundary is missing');
  return source.slice(start, end);
}

test('coach Create Event quick action opens the events tab and renders the create form state', async () => {
  const source = await appSource();
  const commandCenter = await commandCenterSource();

  assert.match(commandCenter, /\{ label: "Create Practice", icon: "calendar", onClick: onScheduleEvent \}/);
  assert.match(source, /const openEventCreateFlow=useCallback\(\(\)=>\{setEventSaveError\(""\);setTab\("events"\);setSelP\(null\);setExpEv\(null\);setShowAddSC\(false\);setShowAdd\(true\);/);
  assert.match(source, /onScheduleEvent=\{openEventCreateFlow\}/);
  assert.match(source, /const handleToggleAddEvent=openEventCreateFlow;/);
  assert.match(source, /\{showAdd&&<div className="fade-up"/);
  assert.match(source, /role="dialog" aria-modal="true" aria-label="Create event"/);
});

test('coach Events mobile screen renders exactly one visible Create Event CTA above the event list', async () => {
  const source = await appSource();
  const mobileEventsMarkup = coachEventsMobileMarkup(source);

  assert.match(source, /<PageHeader title="EVENTS"[\s\S]*?actionLabel="\+ Create Event" onAction=\{handleToggleAddEvent\}/);
  assert.match(mobileEventsMarkup, /events\.length>0&&<button data-testid="coach-events-mobile-create-event" onClick=\{openEventCreateFlow\}[\s\S]*?>\+ ADD<\/button>/);
  assert.match(mobileEventsMarkup, /events\.length===0\?<section data-testid="coach-events-mobile-empty-state"[\s\S]*?<button data-testid="coach-events-mobile-create-event" onClick=\{openEventCreateFlow\}[\s\S]*?>CREATE FIRST EVENT<\/button>/);
  assert.equal((mobileEventsMarkup.match(/data-testid="coach-events-mobile-create-event"/g) || []).length, 2);
  assert.match(mobileEventsMarkup, /events\.length>0&&<button/);
  assert.match(mobileEventsMarkup, /events\.length===0\?<section/);
  assert.doesNotMatch(mobileEventsMarkup, /handleToggleAddEvent/);
  assert.doesNotMatch(source, /coach-events-top-create-event/);
});

test('coach Events screen keeps the remaining mobile Create Event CTA wired to the working handler', async () => {
  const source = await appSource();

  assert.match(source, /const openEventCreateFlow=useCallback\(\(\)=>\{setEventSaveError\(""\);setTab\("events"\);setSelP\(null\);setExpEv\(null\);setShowAddSC\(false\);setShowAdd\(true\);/);
  assert.match(source, /const handleToggleAddEvent=openEventCreateFlow;/);
  assert.match(source, /<button data-testid="coach-events-mobile-create-event" onClick=\{openEventCreateFlow\} type="button"[\s\S]*?>\+ ADD<\/button>/);
  assert.match(source, /<button data-testid="coach-events-mobile-create-event" onClick=\{openEventCreateFlow\} type="button" className="btn-v cta-primary"[\s\S]*?>CREATE FIRST EVENT<\/button>/);
  assert.doesNotMatch(source, /<button onClick=\{\(\)=>\{setEventSaveError\(""\);handleToggleAddEvent\(\);\}\} className="btn-v cta-primary"[\s\S]*?>\+ CREATE EVENT<\/button>/);
});


test('coach event save persists a valid event locally and adds it to the Events list', async () => {
  const source = await appSource();

  assert.match(source, /const addEvent=async ev=>\{if\(user\?\.role!=="coach"\|\|!user\.teamId\)return\{ok:false\};const eventPayload=\{\.\.\.ev,id:genId\("event"\),teamId:user\.teamId,ownerCoachId:user\.email\};/);
  assert.match(source, /await P\("sl:events",\[\.\.\.events,eventPayload\],setEvents,\{strictLocal:true\}\);trackEvent\("event_created",\{eventType:ev\.type\|\|"run"\}\);return\{ok:true\};/);
  assert.doesNotMatch(source, /await P\("sl:events",\[\.\.\.events,eventPayload\],setEvents,\{strictRemote:true\}\)/);
});

test('valid coach event form submission clears stale save errors before saving', async () => {
  const source = await appSource();

  assert.match(source, /const handleAddEvent=async\(\)=>\{const title=san\(ne\.title\)\.trim\(\),date=String\(ne\.date\|\|""\)\.trim\(\);if\(!title\|\|!date\)\{setEventSaveError\("Event title and date are required\."\);return;\}setEventSaveError\(""\);try\{const result=await addEvent/);
});

test('coach event save validates required fields and keeps visible error feedback in the form', async () => {
  const source = await appSource();

  assert.match(source, /if\(!title\|\|!date\)\{setEventSaveError\("Event title and date are required\."\);return;\}/);
  assert.match(source, /const result=await addEvent\(\{\.\.\.ne,title,date,desc:san\(ne\.desc\),location:san\(ne\.location\)\}\);if\(!result\?\.ok\)\{setEventSaveError\(result\?\.err\|\|"Event could not be saved\. Please try again\."\);return;\}/);
  assert.match(source, /\{eventSaveError&&<div role="alert" style=\{\{marginBottom:12/);
  assert.match(source, /<button className="btn-v cta-primary" onClick=\{handleAddEvent\} style=\{\{width:"100%",margin:0,minHeight:44,height:44,borderRadius:10\}\}>SAVE EVENT<\/button>/);
});
