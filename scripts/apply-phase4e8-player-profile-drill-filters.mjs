import { readFileSync, writeFileSync } from 'node:fs';

const chartsPath = 'src/components/ShotLabCharts.jsx';
const authorityPath = 'public/shotlab-phase4e8-player-profile-drill-filters.css';
const indexPath = 'index.html';

const charts = readFileSync(chartsPath, 'utf8');
const authority = readFileSync(authorityPath, 'utf8');
let index = readFileSync(indexPath, 'utf8');

// Phase 3F runs before this enhancer and already provides durable semantics for
// every Player Profile drill chip. Reuse that contract rather than rewriting UI.
for (const required of [
  'data-testid="player-analytics-drills"',
  'data-analytics-drill={drill.id}',
  'aria-pressed={active}',
  'onClick={() => setSelectedDrillId(drill.id)}',
]) {
  if (!charts.includes(required)) {
    throw new Error(`Phase 4E.8 requires the Phase 3F drill-filter contract: ${required}`);
  }
}

const drillOptionCount = charts.split('data-analytics-drill={drill.id}').length - 1;
if (drillOptionCount !== 1) {
  throw new Error(`Phase 4E.8 expected exactly one shared drill-filter button template, found ${drillOptionCount}.`);
}

const compactAuthority = authority.replace(/\s+/g, '');
for (const required of [
  'player-analytics-drills',
  'data-analytics-drill',
  'min-height:44px!important',
  'box-sizing:border-box!important',
  'touch-action:manipulation!important',
]) {
  if (!compactAuthority.includes(required)) {
    throw new Error(`Phase 4E.8 final geometry authority missing: ${required}`);
  }
}

const phase4e7Link = '  <link id="shotlab-phase4e7-player-profile-source-filters" rel="stylesheet" href="/shotlab-phase4e7-player-profile-source-filters.css" />';
const phase4e8Link = '  <link id="shotlab-phase4e8-player-profile-drill-filters" rel="stylesheet" href="/shotlab-phase4e8-player-profile-drill-filters.css" />';
if (!index.includes(phase4e8Link)) {
  const anchorCount = index.split(phase4e7Link).length - 1;
  if (anchorCount !== 1) {
    throw new Error(`Phase 4E.8 expected the Phase 4E.7 geometry link to exist once before insertion, found ${anchorCount}.`);
  }
  index = index.replace(phase4e7Link, `${phase4e7Link}\n${phase4e8Link}`);
  writeFileSync(indexPath, index);
} else {
  console.log('Phase 4E.8 final stylesheet link already applied.');
}

console.log('Applied Phase 4E.8 Player Profile drill-filter hit-area correction using Phase 3F semantic contracts.');
