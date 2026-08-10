import { readFileSync, writeFileSync } from 'node:fs';

const chartsPath = 'src/components/ShotLabCharts.jsx';
const authorityPath = 'public/shotlab-phase4e7-player-profile-source-filters.css';
const indexPath = 'index.html';

let charts = readFileSync(chartsPath, 'utf8');
const authority = readFileSync(authorityPath, 'utf8');
let index = readFileSync(indexPath, 'utf8');

const groupId = 'id="player-profile-source-filters"';
const groupTestId = 'data-testid="player-profile-source-filters"';
const buttonHook = 'data-player-profile-source-filter';

if (!charts.includes(groupId)) {
  const groupAnchor = '<Card style={{ padding: 12 }}>\n              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>';
  const count = charts.split(groupAnchor).length - 1;
  if (count !== 1) {
    throw new Error(`Phase 4E.7 expected exactly one Player Profile source-filter group anchor, found ${count}.`);
  }
  charts = charts.replace(
    groupAnchor,
    `<Card style={{ padding: 12 }}>\n              <div ${groupId} ${groupTestId} style={{ display: "flex", gap: 8, marginBottom: 12 }}>`,
  );
}

if (!charts.includes(buttonHook)) {
  const buttonAnchor = '<button\n                      key={option.id}\n                      onClick={() => setContext(option.id)}';
  const count = charts.split(buttonAnchor).length - 1;
  if (count !== 1) {
    throw new Error(`Phase 4E.7 expected exactly one shared source-filter button template, found ${count}.`);
  }
  charts = charts.replace(
    buttonAnchor,
    '<button\n                      data-player-profile-source-filter\n                      key={option.id}\n                      onClick={() => setContext(option.id)}',
  );
}

if (!charts.includes(groupId) || !charts.includes(groupTestId) || !charts.includes(buttonHook)) {
  throw new Error('Phase 4E.7 failed to establish the shared Player Profile source-filter hooks.');
}
writeFileSync(chartsPath, charts);

const compactAuthority = authority.replace(/\s+/g, '');
for (const required of [
  '#player-profile-source-filters',
  'data-player-profile-source-filter',
  'min-height:44px!important',
  'box-sizing:border-box!important',
  'touch-action:manipulation!important',
]) {
  if (!compactAuthority.includes(required)) {
    throw new Error(`Phase 4E.7 final geometry authority missing: ${required}`);
  }
}

const phase4e6Link = '  <link id="shotlab-phase4e6-player-profile-tabs-hit-area" rel="stylesheet" href="/shotlab-phase4e6-player-profile-tabs-hit-area.css" />';
const phase4e7Link = '  <link id="shotlab-phase4e7-player-profile-source-filters" rel="stylesheet" href="/shotlab-phase4e7-player-profile-source-filters.css" />';
if (!index.includes(phase4e7Link)) {
  const anchorCount = index.split(phase4e6Link).length - 1;
  if (anchorCount !== 1) {
    throw new Error(`Phase 4E.7 expected the Phase 4E.6 final geometry link to exist once before insertion, found ${anchorCount}.`);
  }
  index = index.replace(phase4e6Link, `${phase4e6Link}\n${phase4e7Link}`);
  writeFileSync(indexPath, index);
} else {
  console.log('Phase 4E.7 final stylesheet link already applied.');
}

console.log('Applied Phase 4E.7 Player Profile source-filter hit-area correction.');
