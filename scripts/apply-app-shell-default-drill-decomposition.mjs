import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appPath = fileURLToPath(new URL('../src/App.jsx', import.meta.url));
const modulePath = fileURLToPath(new URL('../src/lib/defaultDrillCatalog.js', import.meta.url));
const workflowPath = fileURLToPath(new URL('../.github/workflows/app-shell-decomposition-apply.yml', import.meta.url));
const selfPath = fileURLToPath(import.meta.url);

const startMarker = 'const DEFAULT_DEMO_DRILL_CATALOG=[';
const endMarker = 'const hasDrillMax=drill=>Number.isFinite(Number(drill?.max))&&Number(drill.max)>0;';
const importAnchor = 'import { STARTUP_HYDRATION_TIMEOUT_MS, settleStartupHydration } from "./lib/startupHydrationDeadline.js";';
const importLine = 'import { DRILLS_INIT, PROGRAM_DRILLS_INIT, mergeDefaultDrills, buildDefaultDrillIdAliases, normalizeScoresForDefaultDrills, isInSeasonProgramDrill, countCustomProgramDrills, countCustomInSeasonProgramDrills, ICONS, hasDrillMax } from "./lib/defaultDrillCatalog.js";';
const exportedNames = [
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

if (!source.includes(importLine)) {
  const start = source.indexOf(startMarker);
  const endStart = source.indexOf(endMarker, start);
  if (start < 0 || endStart < 0) {
    throw new Error('Default drill catalog decomposition markers were not found exactly once.');
  }
  if (source.indexOf(startMarker, start + startMarker.length) !== -1) {
    throw new Error('Default drill catalog start marker was duplicated.');
  }
  const end = endStart + endMarker.length;
  let moduleSource = source.slice(start, end).trim() + '\n';
  for (const name of exportedNames) {
    const declaration = `const ${name}=`;
    if (!moduleSource.includes(declaration)) {
      throw new Error(`Expected declaration missing from extracted block: ${name}`);
    }
    moduleSource = moduleSource.replace(declaration, `export const ${name}=`);
  }
  source = source.slice(0, start) + source.slice(end);
  if (!source.includes(importAnchor)) {
    throw new Error('App import anchor was not found.');
  }
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
  if (source.includes(startMarker) || source.includes(endMarker)) {
    throw new Error('Extracted default drill block still remains in App.jsx.');
  }
  if (!source.includes(importLine)) {
    throw new Error('Default drill model import was not inserted.');
  }
  const appBytes = Buffer.byteLength(source);
  if (appBytes >= 500_000) {
    throw new Error(`App.jsx remains over budget after extraction: ${appBytes} bytes`);
  }
  writeFileSync(modulePath, `// Default ShotLab training drill catalog and normalization helpers.\n// Extracted from App.jsx to keep the application shell focused on orchestration.\n\n${moduleSource}`);
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
