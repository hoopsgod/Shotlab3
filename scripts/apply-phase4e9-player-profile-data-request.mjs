import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
let source = readFileSync(appPath, 'utf8');

const marker = 'data-testid="player-account-data-request"';
const oldAnchor = '<a href={requestHref} onClick={()=>setDataRequestSent(true)} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:42,borderRadius:10,background:VOLT,color:"#000",fontFamily:FD,fontSize:14,letterSpacing:2,textDecoration:"none",touchAction:"manipulation"}}>REQUEST DATA</a>';
const newAnchor = '<a data-testid="player-account-data-request" data-player-account-data-request href={requestHref} onClick={()=>setDataRequestSent(true)} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:44,boxSizing:"border-box",borderRadius:10,background:VOLT,color:"#000",fontFamily:FD,fontSize:14,letterSpacing:2,textDecoration:"none",touchAction:"manipulation"}}>REQUEST DATA</a>';

if (!source.includes(marker)) {
  const count = source.split(oldAnchor).length - 1;
  if (count !== 1) {
    throw new Error(`Phase 4E.9 expected exactly one Player Account data-request action, found ${count}.`);
  }
  source = source.replace(oldAnchor, newAnchor);
  writeFileSync(appPath, source);
} else {
  for (const required of ['data-player-account-data-request', 'minHeight:44', 'boxSizing:"border-box"', 'touchAction:"manipulation"']) {
    if (!source.includes(required)) throw new Error(`Phase 4E.9 transformed data-request action missing: ${required}`);
  }
  console.log('Phase 4E.9 Player Account data-request target already applied.');
}

console.log('Applied Phase 4E.9 Player Profile REQUEST DATA physical target.');
