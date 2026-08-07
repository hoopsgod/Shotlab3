import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3o-player-training-session] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};

const path = 'src/App.jsx';
let source = readFileSync(path, 'utf8');
const marker = 'PlayerTrainingSessionHeader drill={active}';

if (source.includes(marker)) {
  for (const preserved of [
    'onClick={handleLog}',
    'disabled={submitting||activeScoreInvalid}',
    'setSaved(true)',
    'addChallenge({to:challTarget',
    'pushCompletionCue({title:activeMode==="program"?"Program drill completed":"Drill completed"',
    'data-testid="player-training-score-zone"',
    'data-testid="player-training-log-score"',
  ]) {
    if (!source.includes(preserved)) fail(`transformed training session is missing ${preserved}`);
  }
  console.log('Phase 3O Player Training Session already applied.');
  process.exit(0);
}

const importAnchor = 'import PlayerCommitmentCenter from "./components/PlayerCommitmentCenter.jsx";';
requireOne(source, importAnchor, 'PlayerCommitmentCenter import');
source = source.replace(
  importAnchor,
  `${importAnchor}\nimport PlayerTrainingSessionHeader from "./components/PlayerTrainingSessionHeader.jsx";`,
);

const activeShell = '{(tab==="home"||tab==="log-drill"||tab==="duels")&&active&&<div className="detail-enter" style={{textAlign:"center",paddingTop:12,position:"relative"}}>';
requireOne(source, activeShell, 'active drill shell');
source = source.replace(
  activeShell,
  '{(tab==="home"||tab==="log-drill"||tab==="duels")&&active&&<div className="detail-enter player-training-session" data-testid="player-training-session" style={{textAlign:"center",paddingTop:12,position:"relative"}}>',
);

const oldIntro = ':<><button onClick={()=>{setActive(null);if(tab==="home")switchTab("log-drill");if(tab==="duels")switchTab("duels")}} style={{background:"none",border:"none",color:activeMode==="program"?CYAN:VOLT,fontFamily:FB,fontSize:13,cursor:"pointer",fontWeight:700,letterSpacing:2,marginBottom:32,padding:"8px 16px"}}>&#8592; BACK</button>\n      <div style={{width:100,height:100,borderRadius:22,background:`linear-gradient(135deg,${SURFACE},${CARD_BG})`,border:`1px solid ${activeMode==="program"?CYAN+"40":BORDER_CLR}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:activeMode==="program"?`0 0 24px ${CYAN}14`:"none"}}><DrillIcon type={active.icon} size={48} color={activeMode==="program"?CYAN:undefined}/></div>\n      <h2 style={{fontFamily:FD,color:activeMode==="program"?CYAN:LIGHT,fontSize:36,letterSpacing:4,margin:"0 0 8px"}}>{active.name}</h2>\n      <p style={{fontFamily:FB,color:activeMode==="program"?CYAN: MUTED,fontSize:14,margin:"0 auto 6px",maxWidth:280,lineHeight:1.6,textShadow:activeMode==="program"?`0 0 18px ${CYAN}22`:"none"}}>{active.desc}</p>';
requireOne(source, oldIntro, 'legacy active drill intro');
const newIntro = ':<><PlayerTrainingSessionHeader drill={active} mode={activeMode} currentIndex={(activeMode==="program"?todayProgramScores:todayS).length+1} total={activeMode==="program"?programDrills.length:drills.length} score={input} onBack={()=>{setActive(null);if(tab==="home")switchTab("log-drill");if(tab==="duels")switchTab("duels")}}/>';
source = source.replace(oldIntro, newIntro);

const scoreInputAnchor = '      {/* Score input with reactive color */}';
requireOne(source, scoreInputAnchor, 'score input zone');
source = source.replace(
  scoreInputAnchor,
  '      <div className="player-training-score-zone" data-testid="player-training-score-zone">\n      <div className="player-training-score-zone-label">LOG YOUR RESULT</div>\n      {/* Score input with reactive color */}',
);

const logScoreAnchor = '      <button className="btn-v cta-primary" onClick={handleLog} disabled={submitting||activeScoreInvalid} style={{maxWidth:300,margin:"0 auto",opacity:(submitting||activeScoreInvalid)?0.55:1,cursor:submitting||activeScoreInvalid?"not-allowed":"pointer"}}>LOG SCORE &#8594;</button>';
requireOne(source, logScoreAnchor, 'log score action');
source = source.replace(
  logScoreAnchor,
  '      <button data-testid="player-training-log-score" className="btn-v cta-primary" onClick={handleLog} disabled={submitting||activeScoreInvalid} style={{width:"100%",maxWidth:"none",margin:"0 auto",opacity:(submitting||activeScoreInvalid)?0.55:1,cursor:submitting||activeScoreInvalid?"not-allowed":"pointer"}}>LOG SCORE &#8594;</button>\n      </div>',
);

for (const preserved of [
  'onClick={handleLog}',
  'disabled={submitting||activeScoreInvalid}',
  'setSaved(true)',
  'addChallenge({to:challTarget',
  'const activeScoreValidation=',
  'const prevBest=activeScores.filter',
  'data-testid="player-training-score-zone"',
  'data-testid="player-training-log-score"',
]) {
  if (!source.includes(preserved)) fail(`Player training capability removed: ${preserved}`);
}

writeFileSync(path, source);
console.log('Applied Phase 3O Player Training Session hierarchy.');
