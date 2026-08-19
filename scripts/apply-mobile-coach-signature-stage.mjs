import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fail = (message) => { throw new Error(`[mobile-coach-signature-stage] ${message}`); };
const countOccurrences = (source, needle) => source.split(needle).length - 1;
const replaceOnce = (source, from, to, label) => {
  const legacyCount = countOccurrences(source, from);
  const finalCount = countOccurrences(source, to);
  if (legacyCount === 1 && finalCount === 0) return source.replace(from, to);
  if (legacyCount === 0 && finalCount === 1) return source;
  const state = legacyCount > 0 && finalCount > 0 ? 'mixed legacy/final state' : 'unexpected or duplicated state';
  fail(`${label}: expected exactly one legacy anchor or one final anchor; found legacy ${legacyCount}, final ${finalCount} (${state})`);
};

// Coach title/hero identity is source-owned in CoachCommandCenter.jsx.
// This function intentionally performs no JSX or title mutation.
export function promoteCoachCommandCenter(source) { return source; }

// Keep the established non-title supporting-surface reconciliation only.
export function promoteCoachFinalCss(source) {
  let next = source;
  next = replaceOnce(next,
    '    border-radius: 16px !important;\n    background: rgba(4, 8, 10, .5) !important;',
    '    border-radius: 0 !important;\n    background: transparent !important;',
    'Coach final metric ledger',
  );
  next = replaceOnce(next,
    '    font-size: 10px !important;\n    letter-spacing: 0 !important;',
    '    font-size: 11px !important;\n    letter-spacing: 0 !important;',
    'Coach final metric label',
  );
  next = replaceOnce(next,
    '  body.mission-control-active .mcShellV3 .mcSection {\n    overflow: hidden;\n    border: 1px solid var(--mc-hairline-modern);\n    border-radius: var(--mc-radius-card);\n    background:\n      linear-gradient(145deg, rgba(255, 255, 255, .02), transparent 42%),\n      var(--mc-material);\n    box-shadow: 0 16px 40px rgba(0, 0, 0, .18), inset 0 1px rgba(255, 255, 255, .018);\n  }',
    '  body.mission-control-active .mcShellV3 .mcSection {\n    overflow: visible;\n    border: 0;\n    border-top: 1px solid var(--mc-hairline-modern);\n    border-radius: 0;\n    background: transparent;\n    box-shadow: none;\n  }',
    'Coach final editorial sections',
  );
  next = replaceOnce(next,
    '  body.mission-control-active .mcShellV3 .mcSectionHead small {\n    font-size: 10px;\n  }',
    '  body.mission-control-active .mcShellV3 .mcSectionHead small {\n    font-size: 11px;\n  }',
    'Coach final section labels',
  );
  next = replaceOnce(next, '    border-radius: 17px;', '    border-radius: 14px;', 'Coach final attention row');
  next = replaceOnce(next,
    '    font-size: 10px !important;\n  }\n\n  body.mission-control-active .mcShellV3 .mcRowAction {',
    '    font-size: 11px !important;\n  }\n\n  body.mission-control-active .mcShellV3 .mcRowAction {',
    'Coach final attention metadata',
  );
  next = replaceOnce(next,
    '  body.mission-control-active .mcShellV3 .mcTodayPlanCopy small {\n    font-size: 10px;\n  }',
    '  body.mission-control-active .mcShellV3 .mcTodayPlanCopy small {\n    font-size: 11px;\n  }',
    'Coach final today label',
  );
  next = replaceOnce(next, '    min-height: 34px;', '    min-height: 44px;', 'Coach final today action target');
  return next;
}

export function applyMobileCoachSignatureStage({ cwd = process.cwd() } = {}) {
  const commandPath = path.resolve(cwd, 'src/components/CoachCommandCenter.jsx');
  const finalCssPath = path.resolve(cwd, 'src/components/CoachMissionControlFinal.css');
  const commandSource = readFileSync(commandPath, 'utf8');
  const finalCssSource = readFileSync(finalCssPath, 'utf8');
  const nextCommand = promoteCoachCommandCenter(commandSource);
  const nextFinalCss = promoteCoachFinalCss(finalCssSource);
  if (nextCommand !== commandSource) writeFileSync(commandPath, nextCommand);
  if (nextFinalCss !== finalCssSource) writeFileSync(finalCssPath, nextFinalCss);
  console.log('Reconciled Coach supporting surfaces; mobile title and hero identity remain source-owned.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobileCoachSignatureStage();