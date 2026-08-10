import { readFileSync, writeFileSync } from 'node:fs';

const componentPath = 'src/components/CoachDashboardPrimitives.jsx';
let source = readFileSync(componentPath, 'utf8');

const marker = 'data-coach-filter-chip';
if (source.includes(marker)) {
  console.log('Phase 4E.1 Coach filter-chip hit area already applied.');
  process.exit(0);
}

const classAnchor = 'className={cx(styles.filterChip, filter.key === activeFilter && styles.filterChipActive)}';
const firstIndex = source.indexOf(classAnchor);
if (firstIndex < 0 || source.indexOf(classAnchor, firstIndex + classAnchor.length) >= 0) {
  throw new Error('Phase 4E.1 expected exactly one shared DashboardFilterRail filter-chip template.');
}

source = source.replace(
  classAnchor,
  `${classAnchor}\n            data-coach-filter-chip\n            style={{ minHeight: 44, boxSizing: "border-box", touchAction: "manipulation" }}`,
);

writeFileSync(componentPath, source);
console.log('Applied Phase 4E.1 shared Coach filter-chip hit-area correction.');
