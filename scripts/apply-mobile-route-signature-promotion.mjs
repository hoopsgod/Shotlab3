import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fail = (message) => { throw new Error(`[mobile-route-signature-promotion] ${message}`); };
const replaceOnce = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) fail(`${label}: expected one source anchor, found ${count}`);
  return source.replace(from, to);
};

export function promoteMobileRouteSignature(source) {
  let next = source;
  next = replaceOnce(next,
    'grid-template-columns: 30px minmax(0, 1fr);',
    'grid-template-columns: 46px minmax(0, 1fr);',
    'route masthead grid',
  );
  next = replaceOnce(next,
    '    width: 30px;\n    height: 30px;',
    '    width: 46px;\n    height: 54px;',
    'route mark geometry',
  );
  next = replaceOnce(next,
    '    border-radius: 9px;',
    '    border-radius: 0;',
    'route mark shape',
  );
  next = replaceOnce(next,
    '.secondaryPageIntro__icon svg { width: 16px; height: 16px; stroke-width: 1.85; }',
    '.secondaryPageIntro__icon svg { width: 22px; height: 22px; stroke-width: 1.85; }',
    'route mark icon scale',
  );
  next = replaceOnce(next,
    '    max-width: 11ch;\n    font-size: clamp(31px, 8.5vw, 34px) !important;\n    line-height: .94;',
    '    max-width: 9.8ch;\n    font-size: clamp(36px, 10vw, 42px) !important;\n    line-height: .91;',
    'route title scale',
  );
  next = replaceOnce(next,
    '  .secondaryPageDecision h2 { max-width: 17ch; font-size: clamp(26px, 7.3vw, 31px); line-height: .96; letter-spacing: -.052em; }',
    '  .secondaryPageDecision h2 { max-width: 15ch; font-size: clamp(28px, 7.8vw, 34px); line-height: .96; letter-spacing: -.052em; }',
    'route decision title',
  );
  next = replaceOnce(next,
    '  .secondaryPageIntro { grid-template-columns: 28px minmax(0, 1fr); column-gap: 9px; }\n  .secondaryPageIntro__icon { width: 28px; height: 28px; border-radius: 8px; }\n  .secondaryPageIntro__icon svg { width: 15px; height: 15px; }',
    '  .secondaryPageIntro { grid-template-columns: 44px minmax(0, 1fr); column-gap: 9px; }\n  .secondaryPageIntro__icon { width: 44px; height: 50px; border-radius: 0; }\n  .secondaryPageIntro__icon svg { width: 21px; height: 21px; }',
    'narrow route mark',
  );
  next = replaceOnce(next,
    '.performance-shell .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle { font-size: 32px !important; }',
    '.performance-shell .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle { font-size: 36px !important; }',
    'narrow route title',
  );
  return next;
}

export function applyMobileRouteSignaturePromotion({ cwd = process.cwd() } = {}) {
  const target = path.resolve(cwd, 'src/components/SecondaryPageSystem.css');
  const source = readFileSync(target, 'utf8');
  const next = promoteMobileRouteSignature(source);
  if (next !== source) writeFileSync(target, next);
  console.log('Promoted mobile secondary routes into the ShotLab signature masthead system.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobileRouteSignaturePromotion();
