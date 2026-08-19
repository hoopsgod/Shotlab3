import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
const authorityPath = 'public/shotlab-v3-mobile-corrections.css';
let source = readFileSync(appPath, 'utf8');
let authority = readFileSync(authorityPath, 'utf8');

const compactCss = (value) => String(value || '').replace(/\s+/g, '');
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
const safeSelector = 'html body #root .performance-shell.performance-shell--player[data-workspace-tab="program"] button[data-player-program-rsvp-action]';
const safeTarget = `${safeSelector} {
  min-height: 46px !important;
  height: 46px !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
}`;

const compactAuthority = compactCss(authority);
const compactSafeSelector = compactCss(safeSelector);
if (compactAuthority.includes(compactSafeSelector)) {
  console.log('Phase 4E.4 final Player Program RSVP physical target already applied.');
} else if (authority.includes(legacyTarget)) {
  authority = authority.replace(legacyTarget, safeTarget);
  writeFileSync(authorityPath, authority);
  console.log('Phase 4E.4 upgraded legacy Player Program RSVP target with final-cascade safety margin.');
} else if (authority.includes(intermediateTarget)) {
  authority = authority.replace(intermediateTarget, safeTarget);
  writeFileSync(authorityPath, authority);
  console.log('Phase 4E.4 promoted Player Program RSVP target above later cascade overrides.');
} else if (compactAuthority.includes(compactCss(legacyTarget)) || compactAuthority.includes(compactCss(intermediateTarget))) {
  throw new Error('Phase 4E.4 found a minified legacy RSVP target that must be normalized before the final contract can be installed.');
} else if (authority.includes(authorityMarker)) {
  throw new Error('Phase 4E.4 RSVP marker exists but the physical target contract is malformed.');
} else {
  authority += `\n\n/* ${authorityMarker}. Touch-safety contract only; title composition remains source-owned. */\n${safeTarget}\n`;
  writeFileSync(authorityPath, authority);
}

console.log('Applied Phase 4E.4 Player Program RSVP hit-area correction.');
