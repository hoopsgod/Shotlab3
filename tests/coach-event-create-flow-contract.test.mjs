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

test('coach Events screen always renders primary Create Event CTAs above the event list', async () => {
  const source = await appSource();

  assert.match(source, /<PageHeader title="EVENTS"[\s\S]*?actionLabel="\+ Create Event" onAction=\{handleToggleAddEvent\}/);
  assert.match(source, /<button onClick=\{\(\)=>\{setEventSaveError\(""\);handleToggleAddEvent\(\);\}\} className="btn-v cta-primary" style=\{\{margin:0,minHeight:44,height:44,padding:"0 12px"/);
  assert.doesNotMatch(source, /\{events\.length>0&&<button onClick=\{\(\)=>\{setEventSaveError\(""\);handleToggleAddEvent\(\);\}\} className="btn-v cta-primary"/);
});

test('coach Events screen keeps secondary and empty-state Create Event buttons tappable', async () => {
  const source = await appSource();

  assert.match(source, /<button onClick=\{\(\)=>\{setEventSaveError\(""\);handleToggleAddEvent\(\);\}\} className="btn-v cta-primary" style=\{\{margin:0,minHeight:42,height:42/);
  assert.match(source, /<button onClick=\{\(\)=>\{setEventSaveError\(""\);handleToggleAddEvent\(\);\}\} className="btn-v cta-primary" style=\{\{margin:"12px 0 0",width:"100%",minHeight:46,height:46/);
  assert.match(source, /<button onClick=\{\(\)=>\{setEventSaveError\(""\);handleToggleAddEvent\(\);\}\} className="btn-v cta-primary" style=\{\{margin:"0 0 14px",width:"100%",minHeight:48,height:48/);
  assert.match(source, />\+ CREATE EVENT<\/button>/);
});

test('coach event save validates required fields and keeps visible error feedback in the form', async () => {
  const source = await appSource();

  assert.match(source, /if\(!title\|\|!date\)\{setEventSaveError\("Event title and date are required\."\);return;\}/);
  assert.match(source, /const result=await addEvent\(\{\.\.\.ne,title,date,desc:san\(ne\.desc\),location:san\(ne\.location\)\}\);if\(!result\?\.ok\)\{setEventSaveError\(result\?\.err\|\|"Event could not be saved\. Please try again\."\);return;\}/);
  assert.match(source, /\{eventSaveError&&<div role="alert" style=\{\{marginBottom:12/);
  assert.match(source, /<button className="btn-v cta-primary" onClick=\{handleAddEvent\} style=\{\{width:"100%",margin:0,minHeight:44,height:44,borderRadius:10\}\}>SAVE EVENT<\/button>/);
});
