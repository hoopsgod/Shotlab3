import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
let source = readFileSync(appPath, 'utf8');

const marker = 'className="coach-event-manage-action"';
if (source.includes(marker)) {
  console.log('Phase 4C Coach Events manage hit-area already applied.');
  process.exit(0);
}

const oldButton = `<button type="button" onClick={()=>setExpEv(ev.id)} style={{border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:10,fontWeight:900,padding:"4px 0",cursor:"pointer"}}>MANAGE →</button>`;
const occurrences = source.split(oldButton).length - 1;
if (occurrences !== 1) {
  throw new Error(`Phase 4C expected exactly one Coach Events MANAGE button template, found ${occurrences}.`);
}

const newButton = `<button type="button" className="coach-event-manage-action" onClick={()=>setExpEv(ev.id)} style={{border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:10,fontWeight:900,minHeight:44,padding:"10px 0",display:"inline-flex",alignItems:"center",justifyContent:"center",touchAction:"manipulation",cursor:"pointer"}}>MANAGE →</button>`;

source = source.replace(oldButton, newButton);
writeFileSync(appPath, source);
console.log('Applied Phase 4C Coach Events manage hit-area correction.');
