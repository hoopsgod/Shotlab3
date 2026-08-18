import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
const authorityPath = 'public/shotlab-v3-mobile-corrections.css';
let source = readFileSync(appPath, 'utf8');
let authority = readFileSync(authorityPath, 'utf8');

const compactCss = (value) => String(value || '').replace(/\s+/g, '');
const targets = [
  {
    marker: 'data-player-home-schedule-action',
    description: 'Player Home upcoming-schedule action template',
    anchor: '<button type="button" onClick={()=>switchTab(item.target)} style={{marginTop:8,minHeight:38,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>{item.cta} →</button>',
    replacement: '<button data-player-home-schedule-action type="button" onClick={()=>switchTab(item.target)} style={{marginTop:8,minHeight:38,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>{item.cta} →</button>',
  },
  {
    marker: 'data-player-home-coach-guidance-action',
    description: 'Player Home Coach Guidance Open Program action',
    anchor: '<button type="button" onClick={()=>switchTab("duels")} style={{marginTop:9,minHeight:40,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>Open Program →</button>',
    replacement: '<button data-player-home-coach-guidance-action type="button" onClick={()=>switchTab("duels")} style={{marginTop:9,minHeight:40,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>Open Program →</button>',
  },
];

let sourceChanged = false;
for (const target of targets) {
  if (source.includes(target.marker)) {
    console.log(`Phase 4E.5 ${target.description} hook already applied.`);
    continue;
  }
  const firstIndex = source.indexOf(target.anchor);
  if (firstIndex < 0 || source.indexOf(target.anchor, firstIndex + target.anchor.length) >= 0) {
    throw new Error(`Phase 4E.5 expected exactly one ${target.description}.`);
  }
  source = source.replace(target.anchor, target.replacement);
  sourceChanged = true;
}

if (sourceChanged) writeFileSync(appPath, source);

const authorityMarker = 'Phase 4E.5 Player Home expanded secondary-link physical targets';
const targetRule = `.performance-shell[data-workspace-tab="home"] button[data-player-home-schedule-action],
.performance-shell[data-workspace-tab="home"] button[data-player-home-coach-guidance-action] {
  min-height: 44px !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
}`;
const compactAuthority = compactCss(authority);
const compactTarget = compactCss(targetRule);

if (compactAuthority.includes(compactTarget)) {
  console.log('Phase 4E.5 final Player Home secondary-link physical targets already applied.');
} else if (authority.includes(authorityMarker)) {
  throw new Error('Phase 4E.5 authority marker exists but the secondary-link physical target contract is malformed.');
} else {
  authority += `\n\n/* ${authorityMarker}. Touch-safety contract only; Player title composition remains source-owned. */\n${targetRule}\n`;
  writeFileSync(authorityPath, authority);
}

console.log('Applied Phase 4E.5 Player Home secondary-link hit-area correction.');
