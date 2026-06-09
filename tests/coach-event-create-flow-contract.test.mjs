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

test('coach Create Event quick action opens the events tab and renders the create form state', async () => {
  const source = await appSource();
  const commandCenter = await commandCenterSource();

  assert.match(commandCenter, /\{ key:"scheduleEvent", label:"\+ Create Event", short:"\+ Event", onClick:onScheduleEvent \}/);
  assert.match(source, /const openEventCreateFlow=useCallback\(\(\)=>\{setEventSaveError\(""\);setTab\("events"\);setSelP\(null\);setExpEv\(null\);setShowAddSC\(false\);setShowAdd\(true\);/);
  assert.match(source, /onScheduleEvent=\{openEventCreateFlow\}/);
  assert.match(source, /const handleToggleAddEvent=openEventCreateFlow;/);
  assert.match(source, /\{showAdd&&<div className="fade-up"/);
  assert.match(source, /role="dialog" aria-modal="true" aria-label="Create event"/);
});

test('coach Events mobile screen renders exactly one primary Create Event CTA above the event list', async () => {
  const source = await appSource();
  const mobileEventsMarkup = source.slice(
    source.indexOf('    </>:<>'),
    source.indexOf('    {showAdd&&<div className="fade-up"'),
  );

  assert.match(source, /<PageHeader title="EVENTS"[\s\S]*?actionLabel="\+ Create Event" onAction=\{handleToggleAddEvent\}/);
  assert.match(mobileEventsMarkup, /<span style=\{\{fontFamily:FD,fontSize:13,color:LIGHT,letterSpacing:1\}\}>EVENTS<\/span>[\s\S]*?<button data-testid="coach-events-mobile-create-event" onClick=\{openEventCreateFlow\} className="btn-v cta-primary"[\s\S]*?>\+ CREATE EVENT<\/button>[\s\S]*?\{events\.length===0\?/);
  assert.equal((mobileEventsMarkup.match(/>\+ CREATE EVENT<\/button>/g) || []).length, 1);
  assert.doesNotMatch(source, /coach-events-top-create-event/);
});

test('coach Events screen keeps the remaining mobile Create Event CTA wired to the working handler', async () => {
  const source = await appSource();

  assert.match(source, /const openEventCreateFlow=useCallback\(\(\)=>\{setEventSaveError\(""\);setTab\("events"\);setSelP\(null\);setExpEv\(null\);setShowAddSC\(false\);setShowAdd\(true\);/);
  assert.match(source, /const handleToggleAddEvent=openEventCreateFlow;/);
  assert.match(source, /<button data-testid="coach-events-mobile-create-event" onClick=\{openEventCreateFlow\} className="btn-v cta-primary"[\s\S]*?>\+ CREATE EVENT<\/button>/);
  assert.doesNotMatch(source, /<button onClick=\{\(\)=>\{setEventSaveError\(""\);handleToggleAddEvent\(\);\}\} className="btn-v cta-primary"[\s\S]*?>\+ CREATE EVENT<\/button>/);
});

test('coach event save validates required fields and keeps visible error feedback in the form', async () => {
  const source = await appSource();

  assert.match(source, /if\(!title\|\|!date\)\{setEventSaveError\("Event title and date are required\."\);return;\}/);
  assert.match(source, /const result=await addEvent\(\{\.\.\.ne,title,date,desc:san\(ne\.desc\),location:san\(ne\.location\)\}\);if\(!result\?\.ok\)\{setEventSaveError\(result\?\.err\|\|"Event could not be saved\. Please try again\."\);return;\}/);
  assert.match(source, /\{eventSaveError&&<div role="alert" style=\{\{marginBottom:12/);
  assert.match(source, /<button className="btn-v cta-primary" onClick=\{handleAddEvent\} style=\{\{width:"100%",margin:0,minHeight:44,height:44,borderRadius:10\}\}>SAVE EVENT<\/button>/);
});
