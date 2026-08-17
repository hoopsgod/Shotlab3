import { readFileSync } from 'node:fs';

const dashboardPath = 'src/components/CoachInteractiveDashboards.jsx';
const calendarPath = 'src/components/CoachEventsMonthCalendar.jsx';
const dashboard = readFileSync(dashboardPath, 'utf8');
const calendar = readFileSync(calendarPath, 'utf8');

if (!dashboard.includes('CoachEventsMonthCalendar') || !calendar.includes('data-testid="coach-events-month-calendar"')) {
  throw new Error('Phase 3J retirement requires the source-owned Coach Events month calendar.');
}

for (const marker of ['onCreateEvent', 'onOpenEvent', 'onStatusChange', 'buildCoachEventActionBriefing']) {
  if (!dashboard.includes(marker)) throw new Error(`Phase 3J calendar migration lost Events capability: ${marker}`);
}

console.log('Phase 3J legacy mutation retired; Coach Events calendar is source-owned.');
