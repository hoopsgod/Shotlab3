import { readFileSync, writeFileSync } from 'node:fs';

const chartsPath = 'src/components/ShotLabCharts.jsx';
const authorityPath = 'public/shotlab-phase4e7-player-profile-source-filters.css';
const indexPath = 'index.html';

const charts = readFileSync(chartsPath, 'utf8');
const authority = readFileSync(authorityPath, 'utf8');
let index = readFileSync(indexPath, 'utf8');

// Phase 3F runs before this enhancer and already establishes durable semantics for
// the shared AT HOME / PROGRAM controls. Reuse those contracts instead of adding
// another source-mutation layer.
for (const required of [
  'data-testid="player-analytics-contexts"',
  'data-analytics-context-option={option.id}',
  'aria-pressed={activeOption}',
  'onClick={() => setContext(option.id)}',
]) {
  if (!charts.includes(required)) {
    throw new Error(`Phase 4E.7 requires the Phase 3F source-filter contract: ${required}`);
  }
}

const contextOptionCount = charts.split('data-analytics-context-option={option.id}').length - 1;
if (contextOptionCount !== 1) {
  throw new Error(`Phase 4E.7 expected exactly one shared source-filter button template, found ${contextOptionCount}.`);
}

const compactAuthority = authority.replace(/\s+/g, '');
for (const required of [
  'player-analytics-contexts',
  'data-analytics-context-option',
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

console.log('Applied Phase 4E.7 Player Profile source-filter hit-area correction using Phase 3F semantic contracts.');
