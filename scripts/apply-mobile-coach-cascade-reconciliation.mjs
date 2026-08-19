import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fail = (message) => { throw new Error(`[mobile-coach-cascade-reconciliation] ${message}`); };
const replaceOnce = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) fail(`${label}: expected one source anchor, found ${count}`);
  return source.replace(from, to);
};

export function reconcileCoachHierarchy(source) {
  return replaceOnce(source,
`body.mission-control-active .mcShellV3 .mcSection,
body.mission-control-active .mcShellV3 .mcTodayPlan,
body.mission-control-active [data-testid="coach-assignment-accountability"],
body.mission-control-active [data-testid="coach-follow-up-queue"] {
  border: 1px solid var(--mc-line) !important;
  border-radius: var(--radius-lg,18px) !important;
  background: var(--mc-surface) !important;
  color: var(--mc-ink) !important;
  box-shadow: 0 1px 2px rgba(17,26,33,.03),0 10px 28px rgba(7,28,40,.04) !important;
}`,
`body.mission-control-active .mcShellV3 .mcSection,
body.mission-control-active .mcShellV3 .mcTodayPlan,
body.mission-control-active [data-testid="coach-assignment-accountability"],
body.mission-control-active [data-testid="coach-follow-up-queue"] {
  border: 0 !important;
  border-top: 1px solid var(--mc-line) !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: var(--mc-ink) !important;
  box-shadow: none !important;
}`,
    'Coach supporting editorial surfaces',
  );
}

export function applyMobileCoachCascadeReconciliation({ cwd = process.cwd() } = {}) {
  const hierarchyPath = path.resolve(cwd, 'src/styles/MissionControlHierarchy2026.css');
  const hierarchySource = readFileSync(hierarchyPath, 'utf8');
  const nextHierarchy = reconcileCoachHierarchy(hierarchySource);
  if (nextHierarchy !== hierarchySource) writeFileSync(hierarchyPath, nextHierarchy);
  console.log('Reconciled late Mission Control support surfaces without touching Coach mobile identity authority.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobileCoachCascadeReconciliation();
