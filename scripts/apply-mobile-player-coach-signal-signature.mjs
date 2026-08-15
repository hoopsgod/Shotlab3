import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fail = (message) => { throw new Error(`[mobile-player-coach-signal-signature] ${message}`); };
const replaceOnce = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) fail(`${label}: expected one source anchor, found ${count}`);
  return source.replace(from, to);
};

export function promotePlayerCoachSignal(source) {
  let next = source;
  next = replaceOnce(next,
    'background: var(--coach-signal-accent,var(--team-brand-secondary,var(--accent)));',
    'background: var(--coach-signal-accent,var(--team-brand-primary,var(--accent)));',
    'Coach Assignment accent rail',
  );
  next = replaceOnce(next,
    'color: color-mix(in srgb,var(--coach-signal-accent,var(--team-brand-secondary,var(--accent))) 66%,#354039);',
    'color: color-mix(in srgb,var(--coach-signal-accent,var(--team-brand-primary,var(--accent))) 66%,#354039);',
    'Coach Assignment eyebrow accent',
  );
  next = replaceOnce(next,
    'font-size: clamp(22px,4.8vw,30px);\n  font-weight: 750;\n  line-height: 1.06;',
    'font-size: clamp(21px,4.4vw,27px);\n  font-weight: 780;\n  line-height: 1.02;',
    'Coach Assignment headline scale',
  );
  return next;
}

export function applyMobilePlayerCoachSignalSignature({ cwd = process.cwd() } = {}) {
  const target = path.resolve(cwd, 'src/components/PlayerDailyCommandCenter.module.css');
  const source = readFileSync(target, 'utf8');
  const next = promotePlayerCoachSignal(source);
  if (next !== source) writeFileSync(target, next);
  console.log('Aligned Player Coach Assignment with the ShotLab primary signature system.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobilePlayerCoachSignalSignature();
