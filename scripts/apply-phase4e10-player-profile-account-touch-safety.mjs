import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
const authorityPath = 'public/shotlab-phase4e10-player-profile-account-touch-safety.css';
const indexPath = 'index.html';

let app = readFileSync(appPath, 'utf8');
const authority = readFileSync(authorityPath, 'utf8');
let index = readFileSync(indexPath, 'utf8');

const privacyBefore = '<button onClick={onToggleLeaderboardVisibility} style={{minWidth:88,height:34,';
const privacyAfter = '<button data-player-profile-privacy-toggle type="button" aria-pressed={!u.hideFromLeaderboards} onClick={onToggleLeaderboardVisibility} style={{minWidth:88,height:34,';
if (!app.includes('data-player-profile-privacy-toggle')) {
  const count = app.split(privacyBefore).length - 1;
  if (count !== 1) throw new Error(`Phase 4E.10 expected one leaderboard privacy toggle, found ${count}.`);
  app = app.replace(privacyBefore, privacyAfter);
}

/* Bright team/VOLT hues are decorative on light controls. The component itself
   must carry a stable readable foreground; CSS remains regression protection,
   not the only thing preventing bright-on-white text. */
const privacyAccentBefore = 'color:u.hideFromLeaderboards?MUTED:VOLT';
const privacyAccentAfter = 'color:u.hideFromLeaderboards?MUTED:"#465717"';
if (!app.includes(privacyAccentAfter)) {
  const count = app.split(privacyAccentBefore).length - 1;
  if (count !== 1) throw new Error(`Phase 4E.10 expected one bright privacy foreground, found ${count}.`);
  app = app.replace(privacyAccentBefore, privacyAccentAfter);
}

const legalBefore = '<a key={link.href} href={link.href} style={{fontFamily:FB,color:compact?VOLT:MUTED,';
const legalAfter = '<a key={link.href} href={link.href} data-player-profile-legal-link={link.href} style={{fontFamily:FB,color:compact?"#465717":MUTED,';
const legalAccessibleExisting = '<a key={link.href} href={link.href} data-player-profile-legal-link={link.href} style={{fontFamily:FB,color:compact?VOLT:MUTED,';
if (!app.includes('data-player-profile-legal-link={link.href}')) {
  const count = app.split(legalBefore).length - 1;
  if (count !== 1) throw new Error(`Phase 4E.10 expected one shared legal-link template, found ${count}.`);
  app = app.replace(legalBefore, legalAfter);
} else if (!app.includes('color:compact?"#465717":MUTED')) {
  const count = app.split(legalAccessibleExisting).length - 1;
  if (count !== 1) throw new Error(`Phase 4E.10 expected one existing legal-link foreground, found ${count}.`);
  app = app.replace(legalAccessibleExisting, legalAfter);
}

for (const required of [
  'data-testid="player-profile-privacy"',
  'data-player-profile-privacy-toggle',
  'aria-pressed={!u.hideFromLeaderboards}',
  'color:u.hideFromLeaderboards?MUTED:"#465717"',
  'testId="player-profile-account-data"',
  'data-player-profile-legal-link={link.href}',
  'color:compact?"#465717":MUTED',
  'data-player-account-data-request',
]) {
  if (!app.includes(required)) throw new Error(`Phase 4E.10 reconciled account contract missing: ${required}`);
}
writeFileSync(appPath, app);

const compactAuthority = authority.replace(/\s+/g, '');
for (const required of [
  'player-profile-privacy',
  'data-player-profile-privacy-toggle',
  'player-profile-account-data',
  'data-player-profile-legal-link',
  'min-height:44px!important',
  'box-sizing:border-box!important',
  'touch-action:manipulation!important',
]) {
  if (!compactAuthority.includes(required)) throw new Error(`Phase 4E.10 geometry authority missing: ${required}`);
}

const phase4e8Link = '  <link id="shotlab-phase4e8-player-profile-drill-filters" rel="stylesheet" href="/shotlab-phase4e8-player-profile-drill-filters.css" />';
const phase4e10Link = '  <link id="shotlab-phase4e10-player-profile-account-touch-safety" rel="stylesheet" href="/shotlab-phase4e10-player-profile-account-touch-safety.css" />';
if (!index.includes(phase4e10Link)) {
  const count = index.split(phase4e8Link).length - 1;
  if (count !== 1) throw new Error(`Phase 4E.10 expected Phase 4E.8 link once, found ${count}.`);
  index = index.replace(phase4e8Link, `${phase4e8Link}\n${phase4e10Link}`);
  writeFileSync(indexPath, index);
}

console.log('Applied Phase 4E.10 reconciled Player Profile account touch-safety correction.');
