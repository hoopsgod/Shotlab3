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
    '.hero::after{content:"02";position:absolute;z-index:0;top:34px;right:6px;color:rgba(200,255,26,.11);font:850 124px/.76 sans-serif;letter-spacing:-.095em;pointer-events:none}',
    'Player editorial numeral',
  );
  next = replaceOnce(next,
    '@media (max-width: 700px) {\n  /* Mobile Product Reset — Phase 1: one decision, one CTA, then evidence. */',
    '@media (max-width: 700px) {\n  /* Mobile Product Reset — flagship performance stage. */\n  .root { margin-top:-18px; }',
    'Player mobile stage attachment',
  );
  next = replaceOnce(next,
    '  .header { min-height: 28px; padding-bottom: 7px; }',
    '  .header { min-height:50px;margin:0 -18px!important;padding:13px 18px 7px;border:0;background:#082731;box-shadow:0 16px 0 #082731; }',
    'Player mobile focus rail',
  );
  next = replaceOnce(next,
    '  .hero { margin-top: 12px; padding: 20px 18px 18px; border-radius: 22px; }',
    '  .hero { min-height:350px;margin:-16px -18px 0!important;padding:56px 20px 24px;border:0;border-radius:0;background:radial-gradient(circle at 92% 12%,rgba(200,255,26,.12),transparent 30%),linear-gradient(145deg,#082731,#0a3a3d 62%,#071c28)!important;box-shadow:none; }',
    'Player mobile continuous performance stage',
  );
  next = replaceOnce(next,
    '  .heroTop { min-height: 26px; }',
    '  .heroTop { min-height:28px; }',
    'Player mobile hero meta rail',
  );
  next = replaceOnce(next,
    '  .title { margin-top: 12px; font-size: clamp(32px,9.2vw,37px); line-height: .96; }',
    '  .title { margin-top:20px;max-width:8ch;font-size:clamp(42px,11.4vw,50px);line-height:.87;letter-spacing:-.058em; }',
    'Player mobile title scale',
  );
  next = replaceOnce(next,
    '  .description { font-size: 15px; line-height: 1.48; }',
    '  .description { max-width:29ch;margin-top:11px;font-size:14px;line-height:1.43; }',
    'Player mobile supporting copy',
  );
  next = replaceOnce(next,
    '  .primaryButton { min-height: 52px; margin-top: 17px; font-size: 15px; }',
    '  .primaryButton { min-height:54px;margin-top:18px;border-radius:12px;font-size:15px;box-shadow:none; }',
    'Player mobile primary action',
  );
  next = replaceOnce(next,
    '  .progressGrid { margin-top: 13px; }',
    '  .progressGrid { margin:0 -18px!important;padding:0 18px;border-top:0;background:#f5f4ef; }',
    'Player mobile score ledger',
  );
  next = replaceOnce(next,
    '  .progressCard { padding-top: 12px; padding-bottom: 13px; }',
    '  .progressCard { padding-top:14px;padding-bottom:15px; }\n  .progressHeader .meta{display:none}',
    'Player mobile score rhythm',
  );
  return next;
}

export function promotePlayerCoachSignalComponent(source) {
  let next = source;
  next = replaceOnce(
    next,
    'const compactCoachValueStyle = { fontSize: 12.5, lineHeight: 1.26, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" };',
    'const compactCoachValueStyle = { fontSize: 12.5, lineHeight: 1.26, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" };',
    'Player Coach Assignment supporting-value clamp',
  );
  next = replaceOnce(
    next,
    '<span>{primaryWorking ? "Opening…" : primary.actionLabel}</span>',
    '<span>{primaryWorking ? "Opening…" : dailyComplete ? "Keep training" : primary.actionLabel}</span>',
    'Player completed-state action label',
  );
  return next;
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
  console.log('Aligned Player Coach Assignment with the ShotLab primary signature system.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobilePlayerCoachSignalSignature();