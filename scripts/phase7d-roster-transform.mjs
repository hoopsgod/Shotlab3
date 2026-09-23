import fs from 'node:fs';

const path='src/App.jsx';
let source=fs.readFileSync(path,'utf8');
const start=source.indexOf('function CoachRoster({');
const end=source.indexOf('\n// Text sanitizer',start);
if(start<0||end<0)throw new Error('CoachRoster boundary not found');
const current=source.slice(start,end);
if(current.includes('coachRosterCard__manage')){
  console.log('Phase 7D roster interaction already applied');
  process.exit(0);
}
const stateNeedle='  const [sortBy,setSortBy]=useState("status");';
const stateReplacement='  const [sortBy,setSortBy]=useState("status");\n  const [managePlayer,setManagePlayer]=useState(null);';
if(!current.includes(stateNeedle))throw new Error('sort state anchor not found');
let next=current.replace(stateNeedle,stateReplacement);
const oldActions=`      <div className="coachRosterCard__actions">\n        {p.statusMeta.pill==="INACTIVE"&&<button className="coachRosterCard__nudge" onClick={(e)=>{e.stopPropagation();if(!isNudged)setNudged(n=>[...n,rosterIdentity])}}>\n          {isNudged?"✓ NUDGED":"NUDGE"}\n        </button>}\n        <button className="coachRosterCard__remove" type="button" onClick={()=>onRemovePlayer?.(rosterIdentity)}>REMOVE</button>\n      </div>`;
const newActions=`      <div className="coachRosterCard__actions">\n        {p.statusMeta.pill==="INACTIVE"&&<button className="coachRosterCard__nudge" onClick={(e)=>{e.stopPropagation();if(!isNudged)setNudged(n=>[...n,rosterIdentity])}}>\n          {isNudged?"✓ NUDGED":"NUDGE"}\n        </button>}\n        <div className="coachRosterCard__manage">\n          <button className="coachRosterCard__manageTrigger" type="button" aria-haspopup="menu" aria-expanded={managePlayer===rosterIdentity} aria-label={\`Manage 4{p.name||"player"}\`} onClick={()=>setManagePlayer(current=>current===rosterIdentity?null:rosterIdentity)}>•••</button>\n          {managePlayer===rosterIdentity&&<div className="coachRosterCard__menu" role="menu" aria-label={\`4{p.name||"Player"} management\`}>\n            <button role="menuitem" className="coachRosterCard__remove" type="button" onClick={()=>{setManagePlayer(null);if(window.confirm(\`Remove 4{p.name||"this player"} from the team roster? Their account and historical data will not be deleted.\`))onRemovePlayer?.(rosterIdentity);}}>Remove from team</button>\n          </div>}\n        </div>\n      </div>`;
if(!next.includes(oldActions))throw new Error('roster actions anchor not found');
next=next.replace(oldActions,newActions);
source=source.slice(0,start)+next+source.slice(end);
fs.writeFileSync(path,source);
console.log('Applied Phase 7D contextual roster management');