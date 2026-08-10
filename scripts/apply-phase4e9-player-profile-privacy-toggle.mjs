import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
const authorityPath = 'public/shotlab-phase4e9-player-profile-privacy-toggle.css';
const indexPath = 'index.html';

let app = readFileSync(appPath, 'utf8');
const authority = readFileSync(authorityPath, 'utf8');
let index = readFileSync(indexPath, 'utf8');

const sourceAnchor = '<button onClick={onToggleLeaderboardVisibility} style={{minWidth:88,height:34,';
const hookedAnchor = '<button data-player-profile-privacy-toggle type="button" aria-pressed={!u.hideFromLeaderboards} onClick={onToggleLeaderboardVisibility} style={{minWidth:88,height:34,';

if (!app.includes('data-player-profile-privacy-toggle')) {
  const anchorCount = app.split(sourceAnchor).length - 1;
  if (anchorCount !== 1) {
    throw new Error(`Phase 4E.9 expected exactly one Player Profile leaderboard privacy toggle, found ${anchorCount}.`);
  }
  app = app.replace(sourceAnchor, hookedAnchor);
  writeFileSync(appPath, app);
} else {
  const hookCount = app.split('data-player-profile-privacy-toggle').length - 1;
  if (hookCount !== 1) {
    throw new Error(`Phase 4E.9 expected exactly one privacy-toggle hook, found ${hookCount}.`);
  }
}

for (const required of [
  'data-testid="player-profile-privacy"',
  'data-player-profile-privacy-toggle',
  'aria-pressed={!u.hideFromLeaderboards}',
  'onClick={onToggleLeaderboardVisibility}',
]) {
  if (!app.includes(required)) {
    throw new Error(`Phase 4E.9 privacy contract missing: ${required}`);
  }
}

const compactAuthority = authority.replace(/\s+/g, '');
for (const required of [
  'player-profile-privacy',
  'data-player-profile-privacy-toggle',
  'min-height:44px!important',
  'box-sizing:border-box!important',
  'touch-action:manipulation!important',
]) {
  if (!compactAuthority.includes(required)) {
    throw new Error(`Phase 4E.9 final geometry authority missing: ${required}`);
  }
}

const phase4e8Link = '  <link id="shotlab-phase4e8-player-profile-drill-filters" rel="stylesheet" href="/shotlab-phase4e8-player-profile-drill-filters.css" />';
const phase4e9Link = '  <link id="shotlab-phase4e9-player-profile-privacy-toggle" rel="stylesheet" href="/shotlab-phase4e9-player-profile-privacy-toggle.css" />';
if (!index.includes(phase4e9Link)) {
  const anchorCount = index.split(phase4e8Link).length - 1;
  if (anchorCount !== 1) {
    throw new Error(`Phase 4E.9 expected the Phase 4E.8 geometry link once before insertion, found ${anchorCount}.`);
  }
  index = index.replace(phase4e8Link, `${phase4e8Link}\n${phase4e9Link}`);
  writeFileSync(indexPath, index);
} else {
  console.log('Phase 4E.9 final stylesheet link already applied.');
}

console.log('Applied Phase 4E.9 Player Profile privacy-toggle hit-area correction.');
