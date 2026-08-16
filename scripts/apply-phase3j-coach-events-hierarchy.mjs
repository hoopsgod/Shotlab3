import { readFileSync } from 'node:fs';

const appPath = 'src/components/CoachInteractiveDashboards.jsx';
const source = readFileSync(appPath, 'utf8');

const marker = 'testId="coach-events-supporting-intelligence"';
const semanticOwner = 'SecondaryPageDisclosure';

if (!source.includes(marker) || !source.includes(semanticOwner)) {
  throw new Error('Phase 3J retirement requires the direct semantic Coach Events disclosure owner.');
}

console.log('Phase 3J legacy mutation retired; Coach Events disclosure is source-owned.');
