import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3q-player-session-closeout] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};

const path = 'src/App.jsx';
let source = readFileSync(path, 'utf8');
const marker = 'completedCount={(shareData?.src==="program"?todayProgramScores:todayS).length}';

if (source.includes(marker)) {
  for (const preserved of [
    '<PlayerTrainingCompletion data={shareData}',
    'onContinue={closeShare}',
    'onChallenge={()=>setShowChallForm(true)}',
    'onViewProgress={()=>{setSaved(false);setActive(null);setShareData(null)',
    'plannedTotal={shareData?.src==="program"?programDrills.length:drills.length}',
    'nextCommitment={events.filter(e=>e.date>=today)',
  ]) {
    if (!source.includes(preserved)) fail(`transformed closeout flow is missing ${preserved}`);
  }
  console.log('Phase 3Q Player Session Closeout already applied.');
  process.exit(0);
}

const phase3pMarker = '<PlayerTrainingCompletion data={shareData}';
if (!source.includes(phase3pMarker)) fail('Phase 3P training completion must be applied before Phase 3Q.');

const callAnchor = '<PlayerTrainingCompletion data={shareData} shareCard={<ShareCard data={shareData}/>} canChallenge={shareData?.src!=="program"} onContinue={closeShare} onChallenge={()=>setShowChallForm(true)}/>';
requireOne(source, callAnchor, 'Phase 3P completion call');
const closeoutCall = '<PlayerTrainingCompletion data={shareData} shareCard={<ShareCard data={shareData}/>} canChallenge={shareData?.src!=="program"} completedCount={(shareData?.src==="program"?todayProgramScores:todayS).length} plannedTotal={shareData?.src==="program"?programDrills.length:drills.length} nextCommitment={events.filter(e=>e.date>=today).sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")))[0]||null} onContinue={closeShare} onChallenge={()=>setShowChallForm(true)} onViewProgress={()=>{setSaved(false);setActive(null);setShareData(null);setShowChallForm(false);setChallTarget("");setChallengeSaveError("");setSubmitting(false);switchTab("profile")}}/>';
source = source.replace(callAnchor, closeoutCall);

for (const preserved of [
  'setSaved(true)',
  'setShareData({drill:active.name',
  'const closeShare=',
  'const sendChallenge=',
  'addChallenge({to:challTarget',
  'completedCount={(shareData?.src==="program"?todayProgramScores:todayS).length}',
  'plannedTotal={shareData?.src==="program"?programDrills.length:drills.length}',
  'nextCommitment={events.filter(e=>e.date>=today)',
  'switchTab("profile")',
]) {
  if (!source.includes(preserved)) fail(`Player session closeout capability removed: ${preserved}`);
}

writeFileSync(path, source);
console.log('Applied Phase 3Q Player Session Closeout context.');
