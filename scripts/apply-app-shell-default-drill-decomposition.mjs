import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appPath = fileURLToPath(new URL('../src/App.jsx', import.meta.url));
const drillModulePath = fileURLToPath(new URL('../src/lib/defaultDrillCatalog.js', import.meta.url));
const scheduleModulePath = fileURLToPath(new URL('../src/lib/defaultScheduleData.js', import.meta.url));
const workflowPath = fileURLToPath(new URL('../.github/workflows/app-shell-decomposition-apply.yml', import.meta.url));
const selfPath = fileURLToPath(import.meta.url);

const drillStartMarker = 'const DEFAULT_DEMO_DRILL_CATALOG=[';
const drillEndMarker = 'const hasDrillMax=drill=>Number.isFinite(Number(drill?.max))&&Number(drill.max)>0;';
const scheduleStartMarker = 'const EVENTS_INIT=[';
const scheduleEndBoundary = 'const PLAYER_TAB_PATHS=';
const importAnchor = 'import { STARTUP_HYDRATION_TIMEOUT_MS, settleStartupHydration } from "./lib/startupHydrationDeadline.js";';
const drillImportLine = 'import { DRILLS_INIT, PROGRAM_DRILLS_INIT, mergeDefaultDrills, buildDefaultDrillIdAliases, normalizeScoresForDefaultDrills, isInSeasonProgramDrill, countCustomProgramDrills, countCustomInSeasonProgramDrills, ICONS, hasDrillMax } from "./lib/defaultDrillCatalog.js";';
const scheduleImportLine = 'import { EVENTS_INIT, SC_INIT } from "./lib/defaultScheduleData.js";';
const drillExportedNames = [
  'DRILLS_INIT',
  'PROGRAM_DRILLS_INIT',
  'mergeDefaultDrills',
  'buildDefaultDrillIdAliases',
  'normalizeScoresForDefaultDrills',
  'isInSeasonProgramDrill',
  'countCustomProgramDrills',
  'countCustomInSeasonProgramDrills',
  'ICONS',
  'hasDrillMax',
];

let source = readFileSync(appPath, 'utf8');

if (!source.includes(drillImportLine)) {
  const drillStart = source.indexOf(drillStartMarker);
  const drillEndStart = source.indexOf(drillEndMarker, drillStart);
  const scheduleStart = source.indexOf(scheduleStartMarker, drillEndStart);
  const scheduleEnd = source.indexOf(scheduleEndBoundary, scheduleStart);

  if (drillStart < 0 || drillEndStart < 0) {
    throw new Error('Default drill catalog decomposition markers were not found exactly once.');
  }
  if (source.indexOf(drillStartMarker, drillStart + drillStartMarker.length) !== -1) {
    throw new Error('Default drill catalog start marker was duplicated.');
  }
  if (scheduleStart < 0 || scheduleEnd < 0) {
    throw new Error('Default schedule data decomposition markers were not found.');
  }

  const drillEnd = drillEndStart + drillEndMarker.length;
  let drillModuleSource = source.slice(drillStart, drillEnd).trim() + '\n';
  for (const name of drillExportedNames) {
    const declaration = `const ${name}=`;
    if (!drillModuleSource.includes(declaration)) {
      throw new Error(`Expected declaration missing from extracted drill block: ${name}`);
    }
    drillModuleSource = drillModuleSource.replace(declaration, `export const ${name}=`);
  }

  let scheduleModuleSource = source.slice(scheduleStart, scheduleEnd).trim() + '\n';
  for (const name of ['EVENTS_INIT', 'SC_INIT']) {
    const declaration = `const ${name}=`;
    if (!scheduleModuleSource.includes(declaration)) {
      throw new Error(`Expected declaration missing from extracted schedule block: ${name}`);
    }
    scheduleModuleSource = scheduleModuleSource.replace(declaration, `export const ${name}=`);
  }

  // Remove later schedule block first so earlier offsets remain valid.
  source = source.slice(0, scheduleStart) + source.slice(scheduleEnd);
  source = source.slice(0, drillStart) + source.slice(drillEnd);

  if (!source.includes(importAnchor)) {
    throw new Error('App import anchor was not found.');
  }
  source = source.replace(importAnchor, `${importAnchor}\n${drillImportLine}\n${scheduleImportLine}`);

  if (source.includes(drillStartMarker) || source.includes(drillEndMarker)) {
    throw new Error('Extracted default drill block still remains in App.jsx.');
  }
  if (source.includes(scheduleStartMarker)) {
    throw new Error('Extracted default schedule block still remains in App.jsx.');
  }
  if (!source.includes(drillImportLine) || !source.includes(scheduleImportLine)) {
    throw new Error('Extracted model imports were not inserted.');
  }

  const appBytes = Buffer.byteLength(source);
  if (appBytes >= 500_000) {
    throw new Error(`App.jsx remains over budget after extraction: ${appBytes} bytes`);
  }

  writeFileSync(
    drillModulePath,
    `// Default ShotLab training drill catalog and normalization helpers.\n// Extracted from App.jsx to keep the application shell focused on orchestration.\n\n${drillModuleSource}`,
  );
  writeFileSync(
    scheduleModulePath,
    `// Default ShotLab event and strength-session seed data.\n// Extracted from App.jsx as static data with no rendering or persistence behavior changes.\n\n${scheduleModuleSource}`,
  );
  writeFileSync(appPath, source);
  console.log(`App.jsx decomposed successfully: ${appBytes} bytes`);
} else {
  console.log('Default drill model extraction already applied; skipping source rewrite.');
}

for (const cleanupPath of [selfPath, workflowPath]) {
  try { rmSync(cleanupPath); } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
