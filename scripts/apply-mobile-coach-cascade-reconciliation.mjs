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
  let next = source;

  next = replaceOnce(next,
`body.mission-control-active .mcShellV3 .mcTeamSelect,
body.mission-control-active .mcShellV3 .mcBell,
body.mission-control-active .mcShellV3 .mcMobileMenu {
  min-height: 44px !important;
  min-width: 44px !important;
  border: 1px solid var(--mc-line) !important;
  border-radius: var(--radius-md,14px) !important;
  background: var(--mc-surface) !important;
  color: var(--mc-ink) !important;
  box-shadow: none !important;
}`,
`body.mission-control-active .mcShellV3 .mcTeamSelect,
body.mission-control-active .mcShellV3 .mcBell,
body.mission-control-active .mcShellV3 .mcMobileMenu {
  min-height: 44px !important;
  min-width: 44px !important;
  border: 1px solid rgba(223,236,241,.14) !important;
  border-radius: var(--radius-md,14px) !important;
  background: rgba(255,255,255,.055) !important;
  color: #e2eaed !important;
  box-shadow: none !important;
}`,
    'Coach header controls',
  );

  next = replaceOnce(next,
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

  return next;
}

export function applyMobileCoachCascadeReconciliation({ cwd = process.cwd() } = {}) {
  const target = path.resolve(cwd, 'src/styles/MissionControlHierarchy2026.css');
  const source = readFileSync(target, 'utf8');
  const next = reconcileCoachHierarchy(source);
  if (next !== source) writeFileSync(target, next);
  console.log('Reconciled late Mission Control authority with the ShotLab mobile Coach signature stage.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobileCoachCascadeReconciliation();
