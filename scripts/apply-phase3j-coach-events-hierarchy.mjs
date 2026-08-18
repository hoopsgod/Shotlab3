import { readFileSync } from 'node:fs';

const dashboardPath = 'src/components/CoachInteractiveDashboards.jsx';
const primitivesPath = 'src/components/EventsMobilePrimitives.jsx';
const dashboard = readFileSync(dashboardPath, 'utf8');
const primitives = readFileSync(primitivesPath, 'utf8');

for (const marker of ['EventsTitleStage', 'EventsWeekRail', 'EventsMonthPanel', 'coach-events-next-team-moment']) {
  if (!dashboard.includes(marker)) throw new Error(`Phase 3J retirement requires the source-owned week-first Coach Events system: ${marker}`);
}

for (const marker of ['events-week-rail', 'events-month-panel', 'EventsTitleStage']) {
  if (!primitives.includes(marker)) throw new Error(`Phase 3J shared Events primitive missing: ${marker}`);
}

for (const marker of ['onCreateEvent', 'onOpenEvent', 'onStatusChange', 'buildCoachEventActionBriefing']) {
  if (!dashboard.includes(marker)) throw new Error(`Phase 3J Events reset lost production capability: ${marker}`);
}

if (dashboard.includes('CoachEventsMonthCalendar')) {
  throw new Error('Phase 3J retirement found the obsolete month-first Coach Events calendar in active dashboard source.');
}

console.log('Phase 3J legacy mutation retired; Coach Events week-first hierarchy is source-owned.');
