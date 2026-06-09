import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('S&C ADD SESSION button is wired to an async handler', () => {
  assert.match(source, /const handleAddScLog=async\(\)=>\{/);
  assert.match(source, /<button className="btn-v cta-primary" onClick=\{handleAddScLog\}[^>]*>ADD SESSION<\/button>/);
});

test('S&C top add controls open and focus the coach S&C session form instead of being dead buttons', () => {
  assert.doesNotMatch(source, /<PageHeader title="S&C"[\s\S]*actionLabel=\{showAddSC\?"Close":"Add"\} onAction=\{\(\)=>setShowAddSC\(!showAddSC\)\}/);
  assert.match(source, /const focusCoachScSessionForm=\(\)=>setTimeout\(\(\)=>\{const form=document\.getElementById\("coach-sc-session-form"\);form\?\.scrollIntoView\(\{behavior:"smooth",block:"start"\}\);form\?\.querySelector\("input,select,textarea"\)\?\.focus\?\.\(\{preventScroll:true\}\);\},120\);/);
  assert.match(source, /const openCoachScSessionForm=\(\)=>\{setShowAddSC\(true\);focusCoachScSessionForm\(\);\};/);
  assert.match(source, /<PageHeader title="S&C"[\s\S]*actionLabel=\{showAddSC\?"Close":"Add Session"\} onAction=\{toggleCoachScSessionForm\}/);
  assert.match(source, /<button className="pageHeaderPill pageHeaderPillBrand" onClick=\{openCoachScSessionForm\}>Add Session<\/button>/);
  assert.match(source, /\{showAddSC&&<div id="coach-sc-session-form" className="fade-up"/);
});

test('S&C session handler awaits addScLog before showing success or clearing fields', () => {
  const handler = source.match(/const handleAddScLog=async\(\)=>\{[\s\S]*?\n\};\n\nreturn <div className="fade-up">/)?.[0] || '';
  assert.match(handler, /const result=await addScLog\(\{date,time,place,sport,ts:Date\.now\(\)\}\);/);
  assert.match(handler, /if\(!result\?\.ok\)\{setLogErr\(result\?\.err\|\|"Session could not be saved\. Please try again\."\);return\}/);
  assert.ok(handler.indexOf('const result=await addScLog') < handler.indexOf('setNewLog({date:todayStr(),time:"",place:"School",sport:""})'));
  assert.ok(handler.indexOf('const result=await addScLog') < handler.indexOf('setLogSaved(true)'));
});

test('S&C session handler keeps required field validation before saving', () => {
  assert.match(source, /if\(!date\|\|!time\|\|!place\|\|!sport\)\{setLogSaved\(false\);setLogErr\("Please complete date, time, place, and sport\."\);return\}/);
});

test('successful S&C log persists a row to sl:sc-logs and updates scLogs state', () => {
  assert.match(source, /const addScLog=async\(log\)=>\{[\s\S]*const nextLog=\{\.\.\.log,id:Date\.now\(\),email:user\.email,playerId:user\.email,teamId:user\.teamId,name:user\.name\};/);
  assert.match(source, /const nextLogs=\[nextLog,\.\.\.scLogs\];try\{await DB\.set\("sl:sc-logs",nextLogs,\{strictLocal:true\}\);setScLogs\(nextLogs\);return\{ok:true\};\}/);
});

test('missing player/team context returns a visible S&C panel error instead of silently failing', () => {
  assert.match(source, /if\(!requirePlayer\(user,user\?\.teamId,user\?\.email\)\)return\{ok:false,err:"Player team context is required to log S&C sessions\."\};/);
  assert.match(source, /if\(!result\?\.ok\)\{setLogErr\(result\?\.err\|\|"Session could not be saved\. Please try again\."\);return\}/);
  assert.match(source, /\{logErr&&<div style=\{\{fontFamily:FB,color:"#FF4545",fontSize:11,marginTop:8\}\}>\{logErr\}<\/div>\}/);
});
