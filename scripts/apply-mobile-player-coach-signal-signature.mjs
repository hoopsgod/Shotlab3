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
  next = replaceOnce(next,
` .hero::after {
  content: "";
  position: absolute;
  right: -76px;
  bottom: -106px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: color-mix(in srgb,var(--team-brand-primary,var(--accent)) 10%,transparent);
  filter: blur(32px);
  pointer-events: none;
}`.trimStart(),
    '.hero::after { display:none; }',
    'Player hero blur-orb removal',
  );
  next = replaceOnce(next,
    '  .header { min-height: 28px; padding-bottom: 7px; }',
    '  .header { min-height:48px;margin:0 -18px;padding:12px 18px;border-bottom:1px solid rgba(220,235,241,.1);background:#071c28; }',
    'Player mobile focus rail',
  );
  next = replaceOnce(next,
    '  .hero { margin-top: 12px; padding: 20px 18px 18px; border-radius: 22px; }',
    '  .hero { margin:0 -18px;padding:24px 18px 22px;border:0;border-radius:0;box-shadow:none; }',
    'Player mobile continuous performance stage',
  );
  next = replaceOnce(next,
    '  .title { margin-top: 12px; font-size: clamp(32px,9.2vw,37px); line-height: .96; }',
    '  .title { margin-top:14px;font-size:clamp(38px,10.5vw,44px);line-height:.92;max-width:8.6ch; }',
    'Player mobile title scale',
  );
  next = replaceOnce(next,
    '  .description { font-size: 15px; line-height: 1.48; }',
    '  .description { max-width:30ch;font-size:14px;line-height:1.48; }',
    'Player mobile supporting copy',
  );
  next = replaceOnce(next,
    '  .primaryButton { min-height: 52px; margin-top: 17px; font-size: 15px; }',
    '  .primaryButton { min-height:54px;margin-top:20px;border-radius:12px;font-size:15px;box-shadow:none; }',
    'Player mobile primary action',
  );
  next = replaceOnce(next,
    '  .progressGrid { margin-top: 13px; }',
    '  .progressGrid { margin:0 -18px;padding:0 18px;border-top:0;background:#f5f4ef; }',
    'Player mobile score ledger',
  );
  next = replaceOnce(next,
    '  .progressCard { padding-top: 12px; padding-bottom: 13px; }',
    '  .progressCard { padding-top:14px;padding-bottom:15px; }',
    'Player mobile score rhythm',
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
