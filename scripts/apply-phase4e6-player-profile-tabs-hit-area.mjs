import { readFileSync, writeFileSync } from 'node:fs';

const chartsPath = 'src/components/ShotLabCharts.jsx';
const phase3dPath = 'public/shotlab-phase3d-player-analytics.css';
const phase4e6Path = 'public/shotlab-phase4e6-player-profile-tabs-hit-area.css';
const indexPath = 'index.html';

const charts = readFileSync(chartsPath, 'utf8');
const phase3d = readFileSync(phase3dPath, 'utf8');
const phase4e6 = readFileSync(phase4e6Path, 'utf8');
let index = readFileSync(indexPath, 'utf8');

const requiredContracts = [
  'data-testid="player-analytics-sections"',
  'data-analytics-section={t.id}',
  'aria-pressed={tab === t.id}',
  'flexDirection: "row"',
  '<ShotLabIcon name={t.icon} size={15} />',
];
for (const contract of requiredContracts) {
  if (!charts.includes(contract)) {
    throw new Error(`Phase 4E.6 requires the Phase 3F analytics tab contract: ${contract}`);
  }
}

const sectionMarkerCount = charts.split('data-analytics-section={t.id}').length - 1;
if (sectionMarkerCount !== 1) {
  throw new Error(`Phase 4E.6 expected exactly one shared analytics tab template, found ${sectionMarkerCount}.`);
}

// This script runs after minify-visual-authority-css.mjs in production, so validate
// the durable Phase 3D geometry contract rather than brittle selector whitespace.
if (!phase3d.includes('min-height:42px!important') || !phase3d.includes('data-workspace-tab="profile"')) {
  throw new Error('Phase 4E.6 expected the minified Phase 3D 42px Profile segmented-control authority before applying its bounded override.');
}

for (const required of [
  'div[data-testid="player-analytics-sections"]',
  'button[data-analytics-section]',
  'min-height: 44px !important;',
  'box-sizing: border-box !important;',
  'touch-action: manipulation !important;',
]) {
  if (!phase4e6.includes(required)) {
    throw new Error(`Phase 4E.6 final geometry authority missing: ${required}`);
  }
}

const link = '  <link id="shotlab-phase4e6-player-profile-tabs-hit-area" rel="stylesheet" href="/shotlab-phase4e6-player-profile-tabs-hit-area.css" />';
if (!index.includes(link)) {
  const anchor = '  <link id="shotlab-phase4e-final-polish" rel="stylesheet" href="/shotlab-phase4e-final-polish.css" />';
  const anchorCount = index.split(anchor).length - 1;
  if (anchorCount !== 1) {
    throw new Error(`Phase 4E.6 expected one Phase 4E final-polish link, found ${anchorCount}.`);
  }
  index = index.replace(anchor, `${anchor}\n${link}`);
  writeFileSync(indexPath, index);
} else {
  console.log('Phase 4E.6 final stylesheet link already applied.');
}

console.log('Applied Phase 4E.6 Player Profile analytics-tab hit-area correction after Phase 3D visual authority.');
