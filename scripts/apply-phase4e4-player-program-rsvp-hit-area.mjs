import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
const authorityPath = 'public/shotlab-v3-mobile-corrections.css';
let source = readFileSync(appPath, 'utf8');
let authority = readFileSync(authorityPath, 'utf8');

const marker = 'data-player-program-rsvp-action';
const anchor = '<button onClick={(e)=>{e.stopPropagation();handleEventRsvp(ev);}} style={{marginTop:14,padding:"11px 0",width:"100%"';

if (!source.includes(marker)) {
  const firstIndex = source.indexOf(anchor);
  if (firstIndex < 0 || source.indexOf(anchor, firstIndex + anchor.length) >= 0) {
    throw new Error('Phase 4E.4 expected exactly one Player Program inline quick-RSVP button template.');
  }
  source = source.replace(
    anchor,
    '<button data-player-program-rsvp-action onClick={(e)=>{e.stopPropagation();handleEventRsvp(ev);}} style={{marginTop:14,padding:"11px 0",width:"100%"',
  );
  writeFileSync(appPath, source);
} else {
  console.log('Phase 4E.4 Player Program RSVP hook already applied.');
}

const authorityMarker = 'Phase 4E.4 Player Program RSVP physical target';
if (!authority.includes(authorityMarker)) {
  authority += `\n\n/* ${authorityMarker}. Verified in the user-reachable expanded Program workspace. */\n.performance-shell[data-workspace-tab="program"] button[data-player-program-rsvp-action] {\n  min-height: 44px !important;\n  box-sizing: border-box !important;\n  touch-action: manipulation !important;\n}\n`;
  writeFileSync(authorityPath, authority);
} else {
  console.log('Phase 4E.4 final Player Program RSVP authority already applied.');
}

console.log('Applied Phase 4E.4 Player Program RSVP hit-area correction.');
