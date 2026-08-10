import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
const authorityPath = 'public/shotlab-phase4e10-player-profile-legal-links.css';
const indexPath = 'index.html';

let app = readFileSync(appPath, 'utf8');
const authority = readFileSync(authorityPath, 'utf8');
let index = readFileSync(indexPath, 'utf8');

const sourceAnchor = '<a key={link.href} href={link.href} style={{fontFamily:FB,color:compact?VOLT:MUTED,';
const hookedAnchor = '<a key={link.href} href={link.href} data-player-profile-legal-link={link.href} style={{fontFamily:FB,color:compact?VOLT:MUTED,';

if (!app.includes('data-player-profile-legal-link={link.href}')) {
  const anchorCount = app.split(sourceAnchor).length - 1;
  if (anchorCount !== 1) throw new Error(`Phase 4E.10 expected one shared legal-link template, found ${anchorCount}.`);
  app = app.replace(sourceAnchor, hookedAnchor);
  writeFileSync(appPath, app);
}

for (const required of [
  'data-testid="player-profile-account-data"',
  'data-player-profile-legal-link={link.href}',
  'LEGAL_SUPPORT_LINKS.map',
]) {
  if (!app.includes(required)) throw new Error(`Phase 4E.10 legal-link contract missing: ${required}`);
}

const compactAuthority = authority.replace(/\s+/g, '');
for (const required of ['player-profile-account-data','data-player-profile-legal-link','min-height:44px!important','box-sizing:border-box!important','touch-action:manipulation!important']) {
  if (!compactAuthority.includes(required)) throw new Error(`Phase 4E.10 final geometry authority missing: ${required}`);
}

const phase4e9Link = '  <link id="shotlab-phase4e9-player-profile-privacy-toggle" rel="stylesheet" href="/shotlab-phase4e9-player-profile-privacy-toggle.css" />';
const phase4e10Link = '  <link id="shotlab-phase4e10-player-profile-legal-links" rel="stylesheet" href="/shotlab-phase4e10-player-profile-legal-links.css" />';
if (!index.includes(phase4e10Link)) {
  const anchorCount = index.split(phase4e9Link).length - 1;
  if (anchorCount !== 1) throw new Error(`Phase 4E.10 expected Phase 4E.9 link once, found ${anchorCount}.`);
  index = index.replace(phase4e9Link, `${phase4e9Link}\n${phase4e10Link}`);
  writeFileSync(indexPath, index);
}

console.log('Applied Phase 4E.10 Player Profile legal/support link hit-area correction.');
