import { readFileSync, writeFileSync } from 'node:fs';

const componentPath = 'src/components/CoachDashboardPrimitives.jsx';
const authorityPath = 'public/shotlab-v3-mobile-corrections.css';
let source = readFileSync(componentPath, 'utf8');
let authority = readFileSync(authorityPath, 'utf8');

const compactCss = (value) => String(value || '').replace(/\s+/g, '');
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
const targetSelector = 'html body button[data-coach-filter-chip][data-coach-filter-chip]';
const targetRule = `${targetSelector} {
  min-height: 44px !important;
  box-sizing: border-box !important;
  touch-action: manipulation !important;
}`;
const compactAuthority = compactCss(authority);
const compactTargetSelector = compactCss(targetSelector);

if (compactAuthority.includes(compactTargetSelector)) {
  console.log('Phase 4E.1 Coach filter-chip physical target already applied.');
} else if (authority.includes(authorityMarker)) {
  throw new Error('Phase 4E.1 authority marker exists but the physical target contract is malformed.');
} else {
  authority += `\n\n/* ${authorityMarker}. Touch-safety contract only; visual composition remains component-owned. */\n${targetRule}\n`;
  writeFileSync(authorityPath, authority);
}

console.log('Applied Phase 4E.1 shared Coach filter-chip hit-area correction.');
