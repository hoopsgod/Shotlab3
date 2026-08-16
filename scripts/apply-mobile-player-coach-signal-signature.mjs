import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const replaceIfPresent = (source, from, to) => source.includes(from) ? source.replace(from, to) : source;

export function promotePlayerCoachSignal(source) {
  let next = source;
  next = replaceIfPresent(
    next,
    'background:var(--coach-signal-accent,var(--team-brand-secondary,var(--accent)));',
    'background:var(--coach-signal-accent,var(--team-brand-primary,var(--accent)));',
  );
  next = replaceIfPresent(
    next,
    'background: var(--coach-signal-accent,var(--team-brand-secondary,var(--accent)));',
    'background: var(--coach-signal-accent,var(--team-brand-primary,var(--accent)));',
  );
  next = replaceIfPresent(
    next,
    'color:color-mix(in srgb,var(--coach-signal-accent,var(--team-brand-secondary,var(--accent))) 66%,#354039);',
    'color:color-mix(in srgb,var(--coach-signal-accent,var(--team-brand-primary,var(--accent))) 66%,#354039);',
  );
  next = replaceIfPresent(
    next,
    'color: color-mix(in srgb,var(--coach-signal-accent,var(--team-brand-secondary,var(--accent))) 66%,#354039);',
    'color: color-mix(in srgb,var(--coach-signal-accent,var(--team-brand-primary,var(--accent))) 66%,#354039);',
  );
  return next;
}

export function promotePlayerCoachSignalComponent(source) {
  if (!source.includes('derivePlayerPerformanceNarrative')) return source;
  return replaceIfPresent(
    source,
    'const compactCoachValueStyle = { fontSize: 12.5, lineHeight: 1.26, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" };',
    'const compactCoachValueStyle = { fontSize: 12.5, lineHeight: 1.26, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" };',
  );
}

export function applyMobilePlayerCoachSignalSignature({ cwd = process.cwd() } = {}) {
  const cssTarget = path.resolve(cwd, 'src/components/PlayerDailyCommandCenter.module.css');
  const componentTarget = path.resolve(cwd, 'src/components/PlayerDailyCommandCenter.jsx');
  const cssSource = readFileSync(cssTarget, 'utf8');
  const componentSource = readFileSync(componentTarget, 'utf8');
  const nextCss = promotePlayerCoachSignal(cssSource);
  const nextComponent = promotePlayerCoachSignalComponent(componentSource);
  if (nextCss !== cssSource) writeFileSync(cssTarget, nextCss);
  if (nextComponent !== componentSource) writeFileSync(componentTarget, nextComponent);
  console.log('Aligned Player Coach Assignment without mutating Dashboard Showstopper hero architecture.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobilePlayerCoachSignalSignature();
