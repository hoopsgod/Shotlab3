import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fail = (message) => { throw new Error(`[mobile-coach-cascade-reconciliation] ${message}`); };

function cssWithoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

const FORBIDDEN_COACH_HOME_SELECTORS = Object.freeze([
  ['Coach Home shell', /\.mcShellV3\b/],
  ['Coach Home composition', /\.missionControl\b/],
  ['Coach Home hero', /\.mcHero\b/],
  ['generic Coach Home section', /\.mcSection\b/],
]);

export function reconcileCoachHierarchy(source) {
  const css = cssWithoutComments(source);
  for (const [label, selector] of FORBIDDEN_COACH_HOME_SELECTORS) {
    if (selector.test(css)) {
      fail(`${label} presentation must remain component-owned; shared hierarchy selector detected`);
    }
  }
  return source;
}

export function applyMobileCoachCascadeReconciliation({ cwd = process.cwd() } = {}) {
  const hierarchyPath = path.resolve(cwd, 'src/styles/MissionControlHierarchy2026.css');
  const hierarchySource = readFileSync(hierarchyPath, 'utf8');
  reconcileCoachHierarchy(hierarchySource);
  console.log('Verified shared Mission Control hierarchy does not reclaim component-owned Coach Home presentation.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobileCoachCascadeReconciliation();
