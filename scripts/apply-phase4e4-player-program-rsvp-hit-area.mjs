import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
const playerPath = 'src/components/PlayerCommitmentCenter.jsx';
const authorityPath = 'public/shotlab-v3-mobile-corrections.css';
let source = readFileSync(appPath, 'utf8');
let player = readFileSync(playerPath, 'utf8');
let authority = readFileSync(authorityPath, 'utf8');

const marker = 'data-player-program-rsvp-action';
const playerAnchor = '<button type="button" onClick={onToggle}>';
const legacyAnchor = '<button onClick={(e)=>{e.stopPropagation();handleEventRsvp(ev);}} style={{marginTop:14,padding:"11px 0",width:"100%"';

if (!player.includes(marker) && player.includes(playerAnchor)) {
  player = player.replace(playerAnchor, '<button type="button" data-player-program-rsvp-action onClick={onToggle}>');
  writeFileSync(playerPath, player);
} else if (!player.includes(marker) && !source.includes(marker)) {
  const firstIndex = source.indexOf(legacyAnchor);
  if (firstIndex < 0 || source.indexOf(legacyAnchor, firstIndex + legacyAnchor.length) >= 0) {
    throw new Error('Phase 4E.4 expected one source-owned or legacy Player Program RSVP action.');
  }
  source = source.replace(legacyAnchor, '<button data-player-program-rsvp-action onClick={(e)=>{e.stopPropagation();handleEventRsvp(ev);}} style={{marginTop:14,padding:"11px 0",width:"100%"');
  writeFileSync(appPath, source);
} else {
  console.log('Phase 4E.4 Player Program RSVP hook already applied.');
}

const authorityMarker = 'Phase 4E.4 Player Program RSVP physical target';
const legacyTarget = `.performance-shell[data-workspace-tab="program"] button[data-player-program-rsvp-action] {
  min-height: 44px !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
}`;
const intermediateTarget = `.performance-shell[data-workspace-tab="program"] button[data-player-program-rsvp-action] {
  min-height: 45px !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
}`;
const safeTarget = `html body #root .performance-shell.performance-shell--player[data-workspace-tab="program"] button[data-player-program-rsvp-action] {
  min-height: 46px !important;
  height: 46px !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
}`;

if (!authority.includes(authorityMarker)) {
  authority += `\n\n/* ${authorityMarker}. Final cascade owner with a 2px physical safety margin above the 44px minimum. */\n${safeTarget}\n`;
  writeFileSync(authorityPath, authority);
} else if (authority.includes(legacyTarget)) {
  authority = authority.replace(legacyTarget, safeTarget);
  writeFileSync(authorityPath, authority);
  console.log('Phase 4E.4 upgraded legacy Player Program RSVP target with final-cascade safety margin.');
} else if (authority.includes(intermediateTarget)) {
  authority = authority.replace(intermediateTarget, safeTarget);
  writeFileSync(authorityPath, authority);
  console.log('Phase 4E.4 promoted Player Program RSVP target above later cascade overrides.');
} else if (!authority.includes(safeTarget)) {
  throw new Error('Phase 4E.4 RSVP marker exists but the physical target contract is unrecognized.');
} else {
  console.log('Phase 4E.4 final Player Program RSVP authority already applied.');
}

console.log('Applied Phase 4E.4 Player Program RSVP hit-area correction.');