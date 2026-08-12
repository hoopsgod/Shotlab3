import { readFileSync, writeFileSync } from 'node:fs';

const componentPath = 'src/components/CoachDashboardPrimitives.jsx';
const authorityPath = 'public/shotlab-v3-mobile-corrections.css';
let source = readFileSync(componentPath, 'utf8');
let authority = readFileSync(authorityPath, 'utf8');

const marker = 'data-coach-filter-chip';
const classAnchor = 'className={cx(styles.filterChip, filter.key === activeFilter && styles.filterChipActive)}';

if (!source.includes(marker)) {
  const firstIndex = source.indexOf(classAnchor);
  if (firstIndex < 0 || source.indexOf(classAnchor, firstIndex + classAnchor.length) >= 0) {
    throw new Error('Phase 4E.1 expected exactly one shared DashboardFilterRail filter-chip template.');
  }

  source = source.replace(
    classAnchor,
    `${classAnchor}\n            data-coach-filter-chip\n            style={{ minHeight: 44, boxSizing: "border-box", touchAction: "manipulation" }}`,
  );
  writeFileSync(componentPath, source);
} else {
  console.log('Phase 4E.1 shared Coach filter-chip component hook already applied.');
}

const authorityMarker = 'Phase 4E.1 shared Coach filter-chip physical target';
if (!authority.includes(authorityMarker)) {
  authority += `\n\n/* ${authorityMarker}. The mobile-corrections file is the final visual authority,\n * so this rule intentionally outranks earlier compact-control sizing while preserving\n * the chip's existing width, typography, color, radius, and horizontal-scroll rail. */\nhtml body button[data-coach-filter-chip][data-coach-filter-chip] {\n  min-height: 44px !important;\n  box-sizing: border-box !important;\n  touch-action: manipulation !important;\n}\n`;
  writeFileSync(authorityPath, authority);
} else {
  console.log('Phase 4E.1 final Coach filter-chip authority already applied.');
}

console.log('Applied Phase 4E.1 shared Coach filter-chip hit-area correction.');
