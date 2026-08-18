import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fail = (message) => { throw new Error(`[mobile-coach-signature-stage] ${message}`); };
const replaceOnce = (source, from, to, label) => {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) fail(`${label}: expected one source anchor, found ${count}`);
  return source.replace(from, to);
};

export function promoteCoachCommandCenter(source) {
  let next = source;
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"].missionControl{padding:8px 12px 108px!important;gap:16px!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"].mcShellV3 .missionControl{padding:0 12px 108px!important;gap:0!important}',
    'Coach mobile shell rhythm',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeader{grid-template-columns:40px minmax(0,1fr) auto!important;gap:8px!important;padding:max(6px,env(safe-area-inset-top)) 0 4px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeader{grid-template-columns:44px minmax(0,1fr) 44px!important;gap:8px!important;margin-inline:-12px!important;padding:max(10px,env(safe-area-inset-top)) 14px 10px!important;border:0!important;border-radius:0!important;background:linear-gradient(126deg,#061923,#0b2d37)!important;color:#f5f8f9!important;box-shadow:0 -28px 0 #061923!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}',
    'Coach mobile identity stage',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeaderTeamMark{width:46px!important;height:46px!important;flex-basis:46px!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeaderTeamMark{width:52px!important;height:52px!important;flex-basis:52px!important}',
    'Coach mobile identity mark',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeaderTeamMark img{width:44px!important;height:44px!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeaderTeamMark img{width:50px!important;height:50px!important}',
    'Coach mobile identity image',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcBrandCopy small{font-size:10px!important;letter-spacing:.055em!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcBrandCopy small{color:#c8ff1a!important;font-size:11px!important;letter-spacing:.065em!important}',
    'Coach mobile role label',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcBrandCopy strong{max-width:30vw!important;overflow:hidden!important;font-size:18px!important;line-height:1.05!important;text-overflow:ellipsis!important;white-space:nowrap!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcBrandCopy strong{max-width:50vw!important;overflow:hidden!important;color:#f7fafb!important;font-size:20px!important;line-height:1!important;text-overflow:ellipsis!important;white-space:nowrap!important}',
    'Coach mobile identity name',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeaderActions{display:flex!important;align-items:center!important;min-width:0!important;gap:6px!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeaderActions{display:flex!important;align-items:center!important;justify-content:flex-end!important;width:44px!important;min-width:44px!important;gap:0!important}',
    'Coach mobile header actions',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcTeamSelect{display:inline-flex!important;min-width:0!important;max-width:min(104px,27vw)!important;padding-inline:8px!important;font-size:var(--type-micro,11px)!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcTeamSelect{display:none!important}',
    'Coach mobile redundant team control',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroContent{grid-template-columns:minmax(0,1fr) 68px!important;padding:20px 18px!important;gap:8px 12px!important;background:transparent!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHero{margin:0 -12px!important;border-radius:0!important}body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroContent{grid-template-columns:minmax(0,1fr)!important;padding:27px 20px 24px!important;gap:10px!important;background:transparent!important}',
    'Coach mobile hero composition',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroTeamMark{top:18px!important;right:18px!important;width:64px!important;height:64px!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHeroTeamMark{display:none!important}',
    'Coach mobile hero mark',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHero h1{max-width:12ch!important;font-size:clamp(31px,9vw,39px)!important;line-height:.98!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcHero h1{max-width:9.5ch!important;font-size:clamp(39px,11vw,45px)!important;line-height:.91!important}',
    'Coach mobile hero title',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcCourtArtwork{opacity:.4!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcCourtArtwork{opacity:.72!important}',
    'Coach mobile court presence',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcRealityStrip{margin-top:8px!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcRealityStrip{margin-top:16px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}',
    'Coach mobile metric rhythm',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcRealityStrip>button{min-height:52px!important;padding:5px 4px!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcRealityStrip>button{min-height:60px!important;padding:7px 5px!important}',
    'Coach mobile metric targets',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcRealityStrip strong{font-size:21px!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcRealityStrip strong{font-size:25px!important}',
    'Coach mobile metric values',
  );
  next = replaceOnce(next,
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcPrimary{min-height:48px!important}',
    'body.mission-control-active [data-mobile-product-reset="phase-1"] .mcPrimary{min-height:50px!important}',
    'Coach mobile primary action',
  );
  next = replaceOnce(next,
    '<span className="mcBrandCopy"><small>Coach workspace</small><strong>{teamName}</strong></span>',
    '<span className="mcBrandCopy"><small>Coach mode</small><strong>{teamName}</strong></span>',
    'Coach mobile role copy',
  );
  const postBrandingTacticalCourt =
    next.includes('function CourtArtwork({ logoUrl, teamName }) {') &&
    next.includes('id="mcTacticalWash"') &&
    next.includes('{mark ? <image href={mark}') &&
    next.includes('{initials(teamName)}</text>');
  if (!postBrandingTacticalCourt) next = replaceOnce(next,
`function CourtArtwork({ logoUrl }) {
  return (
    <div className="mcCourtArtwork" aria-hidden="true">
      <div className="mcArenaGlow" />
      <div className="mcRafters"><span /><span /><span /><span /></div>
      <div className="mcArenaLights"><span /><span /><span /></div>
      <div className="mcHoop"><span className="mcBackboard" /><span className="mcRim" /><span className="mcPost" /></div>
      <div className="mcCourtFloor"><span className="mcSideline" /><span className="mcCenterLine" /><span className="mcKey" /><span className="mcThreePoint" /><img src={logoUrl || FALLBACK_LOGO} alt="" /></div>
    </div>
  );
}`,
`function CourtArtwork({ logoUrl }) {
  const mark = logoUrl || FALLBACK_LOGO;
  return (
    <div className="mcCourtArtwork" aria-hidden="true">
      <svg viewBox="0 0 390 370" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="mcTacticalWash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0b3840" stopOpacity=".08" />
            <stop offset=".52" stopColor="#0b5a58" stopOpacity=".18" />
            <stop offset="1" stopColor="#c8ff1a" stopOpacity=".04" />
          </linearGradient>
          <radialGradient id="mcTacticalGlow" cx="74%" cy="48%" r="58%">
            <stop offset="0" stopColor="#c8ff1a" stopOpacity=".16" />
            <stop offset=".5" stopColor="#0f7a70" stopOpacity=".07" />
            <stop offset="1" stopColor="#071c28" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="390" height="370" fill="url(#mcTacticalWash)" />
        <rect width="390" height="370" fill="url(#mcTacticalGlow)" />
        <g transform="translate(208 22) rotate(-4 86 163)" fill="none" stroke="rgba(220,235,241,.23)" strokeWidth="2" vectorEffect="non-scaling-stroke">
          <rect x="0" y="0" width="172" height="326" rx="18" />
          <line x1="0" y1="0" x2="0" y2="326" opacity=".72" />
          <line x1="172" y1="0" x2="172" y2="326" opacity=".52" />
          <rect x="105" y="116" width="67" height="94" />
          <circle cx="105" cy="163" r="47" strokeDasharray="3 5" opacity=".72" />
          <path d="M172 48h-17C87 58 63 108 63 163s24 105 92 115h17" />
          <line x1="155" y1="48" x2="172" y2="48" />
          <line x1="155" y1="278" x2="172" y2="278" />
          <line x1="151" y1="142" x2="151" y2="184" />
          <circle cx="143" cy="163" r="6" stroke="#c8ff1a" strokeOpacity=".62" />
          <path d="M137 163h12" stroke="#c8ff1a" strokeOpacity=".52" />
          <circle cx="1" cy="163" r="44" opacity=".4" />
        </g>
        <g opacity=".58">
          <circle cx="294" cy="82" r="4" fill="#c8ff1a" />
          <circle cx="267" cy="191" r="4" fill="#c8ff1a" />
          <circle cx="319" cy="266" r="4" fill="#c8ff1a" />
          <path d="M294 82C272 108 263 145 267 191s24 59 52 75" fill="none" stroke="rgba(200,255,26,.28)" strokeWidth="1.5" strokeDasharray="4 7" />
        </g>
        <image href={mark} x="214" y="127" width="76" height="76" preserveAspectRatio="xMidYMid meet" opacity=".16" />
      </svg>
    </div>
  );
}`,
    'Coach tactical court signature',
  );
  return next;
}

export function promoteCoachFinalCss(source) {
  let next = source;
  next = replaceOnce(next,
    '  body.mission-control-active .mcShellV3 .mcHeader {\n    top: 6px;\n    min-height: 62px;\n    padding: 7px 8px;\n    border-radius: 19px;\n  }',
    '  body.mission-control-active .mcShellV3 .mcHeader {\n    top: 0;\n    min-height: 88px;\n    padding: 12px 16px;\n    border-radius: 0;\n  }',
    'Coach final mobile header geometry',
  );
  next = replaceOnce(next,
    '  body.mission-control-active .mcShellV3 .mcBrandCopy small {\n    font-size: 10px;\n  }',
    '  body.mission-control-active .mcShellV3 .mcBrandCopy small {\n    font-size: 11px;\n  }',
    'Coach final role label',
  );
  next = replaceOnce(next,
    '  body.mission-control-active .mcShellV3 .mcHero {\n    min-height: 318px !important;\n    border-radius: 26px !important;\n  }',
    '  body.mission-control-active .mcShellV3 .mcHero {\n    min-height: 350px !important;\n    border-radius: 0 !important;\n  }',
    'Coach final performance stage',
  );
  next = replaceOnce(next,
    '    font-size: 34px !important;',
    '    font-size: 46px !important;',
    'Coach final hero title scale',
  );
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
  next = replaceOnce(next,
    '    border-radius: 17px;',
    '    border-radius: 14px;',
    'Coach final attention row',
  );
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
  next = replaceOnce(next,
    '    min-height: 34px;',
    '    min-height: 44px;',
    'Coach final today action target',
  );
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
  console.log('Promoted Coach Home into the ShotLab mobile signature stage without adding a CSS authority layer.');
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedFile === currentFile) applyMobileCoachSignatureStage();