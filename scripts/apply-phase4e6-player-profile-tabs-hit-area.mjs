import { readFileSync, writeFileSync } from 'node:fs';

const chartsPath = 'src/components/ShotLabCharts.jsx';
const authorityPath = 'public/shotlab-v3-mobile-corrections.css';
let charts = readFileSync(chartsPath, 'utf8');
let authority = readFileSync(authorityPath, 'utf8');

const requiredContracts = [
  'data-testid="player-analytics-sections"',
  'data-analytics-section={t.id}',
  'aria-pressed={tab === t.id}',
  'flexDirection: "row"',
  '<ShotLabIcon name={t.icon} size={15} />',
];

for (const contract of requiredContracts) {
  if (!charts.includes(contract)) {
    throw new Error(`Phase 4E.6 requires the Phase 3F analytics tab contract before applying the physical target: ${contract}`);
  }
}

const sectionMarkerCount = charts.split('data-analytics-section={t.id}').length - 1;
if (sectionMarkerCount !== 1) {
  throw new Error(`Phase 4E.6 expected exactly one shared analytics tab template, found ${sectionMarkerCount}.`);
}

const inlineMarker = '                minHeight: 44,\n                boxSizing: "border-box",\n                touchAction: "manipulation",';
if (!charts.includes(inlineMarker)) {
  const styleAnchor = '                flex: 1,\n                padding: "9px 4px",\n                background: tab === t.id ? T.lime : "transparent",';
  const anchorCount = charts.split(styleAnchor).length - 1;
  if (anchorCount !== 1) {
    throw new Error(`Phase 4E.6 expected exactly one analytics-tab style anchor, found ${anchorCount}.`);
  }
  charts = charts.replace(
    styleAnchor,
    '                flex: 1,\n                minHeight: 44,\n                boxSizing: "border-box",\n                touchAction: "manipulation",\n                padding: "9px 4px",\n                background: tab === t.id ? T.lime : "transparent",',
  );
  writeFileSync(chartsPath, charts);
} else {
  console.log('Phase 4E.6 inline Player Profile analytics-tab target already applied.');
}

const authorityMarker = 'Phase 4E.6 Player Profile analytics-tab physical target';
if (!authority.includes(authorityMarker)) {
  authority += `\n\n/* ${authorityMarker}. The four Progress / Skills / Streaks / Goals tabs keep their accepted compact visual treatment while meeting the mobile touch baseline. */\n.performance-shell[data-workspace-tab="profile"] [data-testid="player-analytics-sections"] button[data-analytics-section] {\n  min-height: 44px !important;\n  box-sizing: border-box !important;\n  touch-action: manipulation !important;\n}\n`;
  writeFileSync(authorityPath, authority);
} else {
  console.log('Phase 4E.6 final Player Profile analytics-tab authority already applied.');
}

console.log('Applied Phase 4E.6 Player Profile analytics-tab hit-area correction.');
