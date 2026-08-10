import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.jsx';
const dashboardPath = 'src/components/CoachInteractiveDashboards.jsx';
const authorityPath = 'public/shotlab-phase4e11-coach-residual-touch-safety.css';
const indexPath = 'index.html';

const app = readFileSync(appPath, 'utf8');
const dashboard = readFileSync(dashboardPath, 'utf8');
const authority = readFileSync(authorityPath, 'utf8');
let index = readFileSync(indexPath, 'utf8');

for (const required of [
  'testId="coach-player-invite-dashboard-section"',
  'testId="coach-page-dashboard-leaderboards"',
  'label:"Current Leader"',
  'label:"Archived Seasons"',
  'label:"View"',
]) {
  if (!app.includes(required)) throw new Error(`Phase 4E.11 Coach source contract missing: ${required}`);
}

for (const required of [
  'testId={`${testId}-decision-brief`}',
  'testId={`${testId}-evidence`}',
  'label: `Review ${model.primary.label}`',
  'label: `Review ${metric.label}`',
]) {
  if (!dashboard.includes(required)) throw new Error(`Phase 4E.11 Coach dashboard contract missing: ${required}`);
}

const compactAuthority = authority.replace(/\s+/g, '');
for (const required of [
  'coach-player-invite-dashboard-section',
  'coach-page-dashboard-leaderboards-decision-brief',
  'coach-page-dashboard-leaderboards-evidence',
  'min-height:44px!important',
  'box-sizing:border-box!important',
  'touch-action:manipulation!important',
]) {
  if (!compactAuthority.includes(required)) throw new Error(`Phase 4E.11 final geometry authority missing: ${required}`);
}

const phase4e10Link = '  <link id="shotlab-phase4e10-player-profile-account-touch-safety" rel="stylesheet" href="/shotlab-phase4e10-player-profile-account-touch-safety.css" />';
const phase4e11Link = '  <link id="shotlab-phase4e11-coach-residual-touch-safety" rel="stylesheet" href="/shotlab-phase4e11-coach-residual-touch-safety.css" />';
if (!index.includes(phase4e11Link)) {
  const count = index.split(phase4e10Link).length - 1;
  if (count !== 1) throw new Error(`Phase 4E.11 expected Phase 4E.10 link once, found ${count}.`);
  index = index.replace(phase4e10Link, `${phase4e10Link}\n${phase4e11Link}`);
  writeFileSync(indexPath, index);
} else {
  console.log('Phase 4E.11 final stylesheet link already applied.');
}

console.log('Applied Phase 4E.11 final measured Coach default-state touch-target corrections.');
