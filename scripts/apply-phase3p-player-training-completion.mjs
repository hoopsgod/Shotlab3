import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3p-player-training-completion] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};

const path = 'src/App.jsx';
let source = readFileSync(path, 'utf8');
const marker = '<PlayerTrainingCompletion data={shareData}';
const legacyShareInstruction = '      <div style={{fontFamily:FB,color:T.SUB,fontSize:10,marginTop:12}}>Screenshot your card and share on social media</div>';

if (source.includes(marker)) {
  for (const preserved of [
    'setSaved(true)',
    'setShareData({drill:active.name',
    'addChallenge({to:challTarget',
    'const closeShare=',
    'const sendChallenge=',
    'data-testid="player-training-completion-wrap"',
    'shareCard={<ShareCard data={shareData}/>}',
  ]) {
    if (!source.includes(preserved)) fail(`transformed completion flow is missing ${preserved}`);
  }
  if (source.includes(legacyShareInstruction)) fail('transformed completion flow still exposes the obsolete share-first instruction');
  console.log('Phase 3P Player Training Completion already applied.');
  process.exit(0);
}

const phase3oMarker = 'PlayerTrainingSessionHeader drill={active}';
if (!source.includes(phase3oMarker)) fail('Phase 3O training session must be applied before Phase 3P.');

const importAnchor = 'import PlayerTrainingSessionHeader from "./components/PlayerTrainingSessionHeader.jsx";';
requireOne(source, importAnchor, 'PlayerTrainingSessionHeader import');
source = source.replace(
  importAnchor,
  `${importAnchor}\nimport PlayerTrainingCompletion from "./components/PlayerTrainingCompletion.jsx";`,
);

const savedShell = '{saved&&shareData?<div className="fade-up" style={{padding:"16px 0"}}>';
requireOne(source, savedShell, 'saved completion shell');
source = source.replace(
  savedShell,
  '{saved&&shareData?<div className="fade-up player-training-completion-wrap" data-testid="player-training-completion-wrap" style={{padding:"16px 0"}}>',
);

const legacyCompletion = `      {/* ── SHAREABLE WORKOUT CARD ── */}
      <ShareCard data={shareData}/>
      {/* Challenge button */}
      {!showChallForm?<div style={{display:"flex",gap:8,marginTop:16}}>
        <button className="btn-v cta-primary" onClick={closeShare} style={{width:"100%"}}>DONE</button>
        {shareData?.src!=="program"&&<button className="btn-v cta-primary" onClick={()=>setShowChallForm(true)} style={{width:"100%"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="2.5" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>CHALLENGE
        </button>}
      </div>`;
requireOne(source, legacyCompletion, 'legacy completion actions');
const premiumCompletion = `      {!showChallForm?<PlayerTrainingCompletion data={shareData} shareCard={<ShareCard data={shareData}/>} canChallenge={shareData?.src!=="program"} onContinue={closeShare} onChallenge={()=>setShowChallForm(true)}/>`;
source = source.replace(legacyCompletion, premiumCompletion);

requireOne(source, legacyShareInstruction, 'legacy share instruction');
source = source.replace(legacyShareInstruction, '');

for (const preserved of [
  'setSaved(true)',
  'setConfetti(true)',
  'setShareData({drill:active.name',
  'addChallenge({to:challTarget',
  'const closeShare=',
  'const sendChallenge=',
  'pushCompletionCue({title:activeMode==="program"?"Program drill completed":"Drill completed"',
  '<PlayerTrainingCompletion data={shareData}',
  'shareCard={<ShareCard data={shareData}/>}',
  'data-testid="player-training-completion-wrap"',
]) {
  if (!source.includes(preserved)) fail(`Player completion capability removed: ${preserved}`);
}
if (source.includes(legacyShareInstruction)) fail('obsolete share-first instruction survived Phase 3P transform');

writeFileSync(path, source);
console.log('Applied Phase 3P Player Training Completion hierarchy.');
