import { readFileSync, writeFileSync } from 'node:fs';

const fail = (message) => { throw new Error(`[phase3g-coach-drills] ${message}`); };
const requireOne = (source, anchor, label) => {
  const count = source.split(anchor).length - 1;
  if (count !== 1) fail(`${label}: expected exactly one anchor, found ${count}`);
};
const replaceOne = (source, before, after, label) => {
  requireOne(source, before, label);
  return source.replace(before, after);
};

const path = 'src/App.jsx';
let source = readFileSync(path, 'utf8');

if (source.includes('data-testid="coach-drills-library-management"')) {
  if (!source.includes('className="coach-drills-library-disclosure"')) fail('library disclosure class missing');
  if (!source.includes('Manage drill library')) fail('library disclosure summary missing');
  if (!source.includes('PROGRAM SHOOTING DRILLS')) fail('program drill management was removed');
  if (!source.includes('NEW DRILL')) fail('new drill form was removed');
  console.log('Phase 3G Coach Drills hierarchy already applied.');
  process.exit(0);
}

const managementHeader = '<SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="Drill Management" s={`${visibleHomeDrills.length} visible`} identity/>';
const managementDisclosure = `<details className="coach-drills-library-disclosure" data-testid="coach-drills-library-management">
  <summary className="coach-drills-library-summary">
    <span className="coach-drills-library-summary-copy">
      <span className="coach-drills-library-kicker">LIBRARY MANAGEMENT</span>
      <strong>Manage drill library</strong>
      <small>{visibleHomeDrills.length} player-facing drills · {customProgramDrillCount}/7 custom program slots</small>
    </span>
    <span className="coach-drills-library-chevron" aria-hidden="true">⌄</span>
  </summary>
  <div className="coach-drills-library-body">`;
source = replaceOne(source, managementHeader, managementDisclosure, 'Drill Management heading');

const managementBoundary = '</div>})}\n\n    {/* Add new drill */}';
const closedManagementBoundary = '</div>})}\n  </div>\n</details>\n\n    {/* Add new drill */}';
source = replaceOne(source, managementBoundary, closedManagementBoundary, 'Drill Management to new-drill boundary');

if ((source.match(/data-testid="coach-drills-library-management"/g) || []).length !== 1) fail('library management disclosure must render exactly once');
if (!source.includes('Customize the drills your players see in their "At Home" section.')) fail('player-facing library guidance was removed');
if (!source.includes('PROGRAM SHOOTING DRILLS')) fail('program shooting drill management was removed');
if (!source.includes('setShowNewDrill(true)')) fail('Add Drill action was removed');
if (!source.includes('NEW DRILL')) fail('new drill form was removed');
if (!source.includes('removeDrill')) fail('drill removal behavior was removed');
if (!source.includes('updateDrill')) fail('drill editing behavior was removed');

writeFileSync(path, source);
console.log('Applied Phase 3G Coach Drills management hierarchy.');
