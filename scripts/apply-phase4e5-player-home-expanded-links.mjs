import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
const authorityPath = 'public/shotlab-v3-mobile-corrections.css';
let source = readFileSync(appPath, 'utf8');
let authority = readFileSync(authorityPath, 'utf8');

const scheduleMarker = 'data-player-home-expanded-link="schedule"';
const scheduleAnchor = '<button type="button" onClick={()=>switchTab(item.target)} style={{marginTop:8,minHeight:38,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>{item.cta} →</button>';
const scheduleReplacement = '<button type="button" data-player-home-expanded-link="schedule" onClick={()=>switchTab(item.target)} style={{marginTop:8,minHeight:38,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>{item.cta} →</button>';

if (!source.includes(scheduleMarker)) {
  const firstIndex = source.indexOf(scheduleAnchor);
  if (firstIndex < 0 || source.indexOf(scheduleAnchor, firstIndex + scheduleAnchor.length) >= 0) {
    throw new Error('Phase 4E.5 expected exactly one Player Home upcoming-schedule CTA template.');
  }
  source = source.replace(scheduleAnchor, scheduleReplacement);
}

const programMarker = 'data-player-home-expanded-link="program"';
const programAnchor = '<button type="button" onClick={()=>switchTab("duels")} style={{marginTop:9,minHeight:40,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>Open Program →</button>';
const programReplacement = '<button type="button" data-player-home-expanded-link="program" onClick={()=>switchTab("duels")} style={{marginTop:9,minHeight:40,border:0,background:"transparent",color:VOLT,fontFamily:FB,fontSize:11,fontWeight:800,padding:0,cursor:"pointer"}}>Open Program →</button>';

if (!source.includes(programMarker)) {
  const firstIndex = source.indexOf(programAnchor);
  if (firstIndex < 0 || source.indexOf(programAnchor, firstIndex + programAnchor.length) >= 0) {
    throw new Error('Phase 4E.5 expected exactly one Player Home coach-guidance Program CTA.');
  }
  source = source.replace(programAnchor, programReplacement);
}

writeFileSync(appPath, source);

const authorityMarker = 'Phase 4E.5 Player Home expanded-link physical target';
if (!authority.includes(authorityMarker)) {
  authority += `\n\n/* ${authorityMarker}. Limited to the two low-emphasis navigation families\n * revealed through Player Home disclosures; hierarchy, width, and color stay unchanged. */\n.player-home-compact-dashboard button[data-player-home-expanded-link] {\n  min-height: 44px !important;\n  box-sizing: border-box !important;\n  touch-action: manipulation !important;\n}\n`;
  writeFileSync(authorityPath, authority);
} else {
  console.log('Phase 4E.5 final Player Home expanded-link authority already applied.');
}

console.log('Applied Phase 4E.5 Player Home expanded-link hit-area correction.');
