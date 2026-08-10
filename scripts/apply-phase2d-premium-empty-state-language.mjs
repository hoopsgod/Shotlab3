import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/components/CoachDashboardPhase2.jsx';
const source = readFileSync(path, 'utf8');

let next = source;

const cssImport = 'import "./Phase2PremiumEmptyStateLanguage.css";';
if (!next.includes(cssImport)) {
  const anchor = 'import styles from "./CoachDashboardPhase2.module.css";';
  const matches = next.split(anchor).length - 1;
  if (matches !== 1) {
    throw new Error(`[phase2d-empty-state-language] CSS import anchor expected once; found ${matches}.`);
  }
  next = next.replace(anchor, `${anchor}\n${cssImport}`);
}

const before = 'return <div className={styles.emptyState}>{children}</div>;';
const after = 'return <div className={styles.emptyState} data-phase2-empty-state>{children}</div>;';
if (!next.includes(after)) {
  const matches = next.split(before).length - 1;
  if (matches !== 1) {
    throw new Error(`[phase2d-empty-state-language] EmptyState anchor expected once; found ${matches}.`);
  }
  next = next.replace(before, after);
}

if (!next.includes(cssImport) || !next.includes('data-phase2-empty-state')) {
  throw new Error('[phase2d-empty-state-language] premium empty-state contract was not applied.');
}

if (next !== source) writeFileSync(path, next);
console.log('Applied Phase 2D premium operational empty-state language.');
