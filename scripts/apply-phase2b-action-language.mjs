import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/components/CoachDashboardPhase2.jsx';
const source = readFileSync(path, 'utf8');

const replacements = [
  {
    label: 'operational empty-state hook',
    before: 'return <div className={styles.emptyState}>{children}</div>;',
    after: 'return <div className={styles.emptyState} data-operational-empty-state>{children}</div>;',
  },
  {
    label: 'player primary drawer action hook',
    before: '<button type="button" className={styles.drawerAction} onClick={onOpenFullProfile}>Open Full Profile</button>',
    after: '<button type="button" className={styles.drawerAction} data-drawer-action="primary" onClick={onOpenFullProfile}>Open Full Profile</button>',
  },
  {
    label: 'player secondary drawer action hook',
    before: '<button type="button" className={`${styles.drawerAction} ${styles.drawerActionSecondary}`} onClick={onShowActivity}>Show Activity</button>',
    after: '<button type="button" className={`${styles.drawerAction} ${styles.drawerActionSecondary}`} data-drawer-action="secondary" onClick={onShowActivity}>Show Activity</button>',
  },
  {
    label: 'event primary drawer action hook',
    before: '<button type="button" className={styles.drawerAction} onClick={onManageAttendance}>Manage Attendance</button>',
    after: '<button type="button" className={styles.drawerAction} data-drawer-action="primary" onClick={onManageAttendance}>Manage Attendance</button>',
  },
  {
    label: 'event secondary drawer action hook',
    before: '<button type="button" className={`${styles.drawerAction} ${styles.drawerActionSecondary}`} onClick={onOpenSchedule}>Open Schedule</button>',
    after: '<button type="button" className={`${styles.drawerAction} ${styles.drawerActionSecondary}`} data-drawer-action="secondary" onClick={onOpenSchedule}>Open Schedule</button>',
  },
];

let next = source;
for (const { label, before, after } of replacements) {
  if (next.includes(after)) continue;
  const matches = next.split(before).length - 1;
  if (matches !== 1) {
    throw new Error(`[phase2b-action-language] ${label} expected exactly one source anchor; found ${matches}.`);
  }
  next = next.replace(before, after);
}

const required = [
  'data-operational-empty-state',
  'data-drawer-action="primary"',
  'data-drawer-action="secondary"',
];
for (const marker of required) {
  if (!next.includes(marker)) throw new Error(`[phase2b-action-language] missing required marker ${marker}.`);
}

if (next !== source) writeFileSync(path, next);
console.log('Applied Phase 2B stable action and empty-state hooks.');
