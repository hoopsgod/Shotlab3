import fs from 'node:fs'
import path from 'node:path'

const cssPath = path.resolve(process.cwd(), 'src/components/SecondaryPageSystem.css')
const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const metricCssPath = path.resolve(process.cwd(), 'src/components/CoachDashboardPrimitives.module.css')
const commitmentPath = path.resolve(process.cwd(), 'src/components/PlayerCommitmentCenter.jsx')
const commitmentCssPath = path.resolve(process.cwd(), 'src/components/PlayerCommitmentCenter.module.css')
let source = fs.readFileSync(cssPath, 'utf8')

const startMarker = '@media (max-width: 760px) {'
const currentNarrowMarker = '@media (max-width: 430px) {'
const legacyNarrowMarker = '@media (max-width: 390px) {'
const narrowMarker = source.includes(currentNarrowMarker) ? currentNarrowMarker : legacyNarrowMarker
const motionMarker = '@media (prefers-reduced-motion: reduce) {'

const mobileStart = source.indexOf(startMarker)
const narrowStart = source.indexOf(narrowMarker, mobileStart + startMarker.length)
const motionStart = source.indexOf(motionMarker, narrowStart + narrowMarker.length)

if (mobileStart < 0 || narrowStart < 0 || motionStart < 0) {
  throw new Error('Could not locate the owned SecondaryPageSystem mobile breakpoint boundaries.')
}

const mobileAuthority = `@media (max-width: 760px) {
  .secondaryPageShell {
    gap: 14px;
    padding: 6px var(--layout-gutter, 16px) 84px;
  }

  /* Editorial stage: route icon becomes quiet geometry instead of another boxed control. */
  .secondaryPageIntro {
    position: relative;
    display: block;
    min-height: 108px;
    overflow: hidden;
    padding: 9px 72px 15px 0;
    border-bottom: 1px solid var(--sl-line, rgba(23, 26, 24, .1));
  }

  .secondaryPageIntro__copy { position: relative; z-index: 1; max-width: none; }
  .secondaryPageIntro__icon {
    position: absolute;
    top: -3px;
    right: -7px;
    width: 74px;
    height: 74px;
    color: var(--sl-accent, #71851f);
    opacity: .13;
    transform: rotate(-7deg);
    transform-origin: center;
  }
  .secondaryPageIntro__icon svg { width: 60px; height: 60px; stroke-width: 1.45; }
  .secondaryPageIntro[data-page-kind="calendar"] .secondaryPageIntro__icon { transform: rotate(5deg); }
  .secondaryPageIntro[data-page-kind="team"] .secondaryPageIntro__icon { transform: rotate(-3deg) scale(1.05); }
  .secondaryPageIntro[data-page-kind="trophy"] .secondaryPageIntro__icon { transform: rotate(7deg); }
  .secondaryPageIntro__eyebrow { margin-bottom: 5px; font-size: 10px; letter-spacing: .095em; }
  .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle,
  .performance-shell .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle {
    max-width: 9.5ch;
    font-size: clamp(34px, 9.6vw, 40px) !important;
    line-height: .91;
    letter-spacing: -.058em;
    overflow-wrap: normal;
    word-break: normal;
    text-wrap: balance;
  }
  .secondaryPageIntro__summary { display: none; }
  .secondaryPageIntro__actions {
    position: relative;
    z-index: 1;
    width: calc(100% + 72px);
    min-width: 0;
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
  }
  .secondaryPageIntro__status { max-width: 48%; font-size: 10.5px; line-height: 1.3; text-align: left; }
  .secondaryPageIntro__buttonRow { min-width: 0; flex: 0 1 auto; gap: 7px; justify-content: flex-end; }
  .secondaryPageAction { min-height: 42px; padding-inline: 13px; border-radius: 11px; font-size: 12px; white-space: nowrap; }
  .secondaryPageAction--primary { background: #18211d; border-color: #18211d; }

  /* Score strips are allowed to reach the viewport rhythm instead of becoming more cards. */
  .secondaryPageToolbar [data-visual-role="metric-strip"] {
    margin-inline: calc(var(--layout-gutter, 16px) * -1) !important;
    padding-inline: var(--layout-gutter, 16px) !important;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }
  .secondaryPageToolbar [data-visual-role="metric-strip"]::-webkit-scrollbar { display: none; }
  .secondaryPageToolbar [data-visual-role="metric-strip"] > button {
    min-width: 116px !important;
    min-height: 76px !important;
    padding: 10px 8px !important;
    scroll-snap-align: start;
  }

  /* Performance band: one edge-to-edge decisive moment, not a floating dashboard card. */
  .secondaryPageDecision {
    position: relative;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    min-height: 0;
    gap: 7px;
    margin-inline: calc(var(--layout-gutter, 16px) * -1);
    padding: 23px var(--layout-gutter, 16px) 22px;
    overflow: hidden;
    border-inline: 0;
    border-radius: 0;
    background:
      radial-gradient(circle at 100% 0%, rgba(200, 255, 26, .105), transparent 31%),
      linear-gradient(128deg, #071a22 0%, #0a222b 58%, #102e35 100%);
    box-shadow: none;
  }
  .secondaryPageDecision::after {
    content: "";
    position: absolute;
    top: -72px;
    right: -92px;
    z-index: 0;
    width: 184px;
    height: 184px;
    display: block;
    border: 1px solid rgba(200, 255, 26, .13);
    border-radius: 50%;
    background: transparent;
    filter: none;
    pointer-events: none;
  }
  .secondaryPageDecision__copy { position: relative; z-index: 1; min-width: 0; padding-right: 46px; }
  .secondaryPageDecision__icon {
    position: absolute;
    top: 19px;
    right: var(--layout-gutter, 16px);
    z-index: 1;
    width: 34px;
    height: 34px;
    display: grid;
    border: 0;
    border-radius: 10px;
    background: rgba(200, 255, 26, .085);
    color: #c8ff1a;
  }
  .secondaryPageDecision__icon svg { width: 19px; height: 19px; stroke-width: 1.7; }
  .secondaryPageDecision__visual { display: none; }
  .secondaryPageDecision__eyebrow { margin-bottom: 6px; color: #c8ff1a; font-size: 10px; letter-spacing: .1em; }
  .secondaryPageDecision h2 { max-width: 17ch; font-size: clamp(26px, 7.3vw, 31px); line-height: .96; letter-spacing: -.052em; }
  .secondaryPageDecision p { max-width: 38ch; margin-top: 8px; color: #b8c5c2; font-size: 12.5px; line-height: 1.45; }
  .secondaryPageDecision button {
    min-height: 43px;
    margin-top: 13px;
    padding-inline: 15px;
    border-color: #c8ff1a;
    border-radius: 11px;
    background: #c8ff1a;
    color: #102019;
    font-weight: 780;
  }
  .secondaryPageDecision button:hover:not(:disabled) { background: #d2ff49; transform: translateY(-1px); }

  /* Supporting evidence reads as a ledger beneath the performance band. */
  .secondaryPageEvidence { grid-template-columns: 1fr; border-top: 0; }
  .secondaryPageEvidence > * { padding: 14px 0 !important; }
  .secondaryPageEvidence > * + * {
    border-top: 1px solid var(--sl-line, rgba(23, 26, 24, .1)) !important;
    border-left: 0 !important;
  }

  .coachPlayerDetailWorkspace { gap: 14px; }
  .coachPlayerProfileHero {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-inline: calc(var(--layout-gutter, 16px) * -1);
    padding: 21px var(--layout-gutter, 16px);
    border-inline: 0;
    border-radius: 0;
    background: radial-gradient(circle at 100% 0%, rgba(200,255,26,.1), transparent 32%), linear-gradient(128deg,#071a22,#0a222b 62%,#102e35);
    box-shadow: none;
  }
  .coachPlayerProfileHero__identity { gap: 12px; }
  .coachPlayerProfileHero h2 { font-size: 29px; }
  .coachPlayerProfileHero__headline { display: flex; align-items: end; justify-content: space-between; min-width: 0; padding: 12px 0 0; border-top: 1px solid rgba(255, 255, 255, .1); border-left: 0; text-align: left; }
  .coachPlayerProfileHero__headline small { max-width: 130px; text-align: right; }
  .coachPlayerProfileMetrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .coachPlayerProfileMetric:nth-child(3) { border-left: 0; }
  .coachPlayerProfileMetric:nth-child(n+3) { border-top: 1px solid var(--sl-line, rgba(23, 26, 24, .1)); }
  .coachPlayerProfileEvidence { grid-template-columns: 1fr; }
  .coachPlayerProfileSection { padding: 17px 0; }
  .coachPlayerProfileSection + .coachPlayerProfileSection { border-top: 1px solid var(--sl-line, rgba(23, 26, 24, .1)); border-left: 0; }

  .coachAdministrationPulse { padding: 14px 0 0; border-top: 1px solid rgba(255, 255, 255, .1); border-left: 0; }
  .coachSeasonArchiveForm,
  .coachAdministrationGrid { grid-template-columns: 1fr; }
  .coachSeasonArchivePanel { padding: 17px 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
  .coachSeasonArchivePanel > .cta-primary { width: 100% !important; }
  .seasonArchiveStats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .seasonArchiveStat:nth-child(odd) { border-left: 0; }
  .seasonArchiveStat:nth-child(n+3) { border-top: 1px solid var(--sl-line, rgba(23, 26, 24, .1)); }
}

`

const narrowAuthority = `@media (max-width: 430px) {
  .secondaryPageIntro { min-height: 102px; padding-right: 64px; }
  .secondaryPageIntro__icon { right: -12px; width: 68px; height: 68px; }
  .secondaryPageIntro__icon svg { width: 55px; height: 55px; }
  .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle,
  .performance-shell .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle { font-size: 36px !important; }
  .secondaryPageIntro__actions { width: calc(100% + 64px); display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: 7px; }
  .secondaryPageIntro__status { max-width: 100%; }
  .secondaryPageIntro__buttonRow { width: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; justify-content: stretch; }
  .secondaryPageAction { width: 100%; min-width: 0; padding-inline: 10px; font-size: 11.5px; }
  .secondaryPageDecision h2 { font-size: 28px; }
}

`

source = `${source.slice(0, mobileStart)}${mobileAuthority}${narrowAuthority}${source.slice(motionStart)}`
fs.writeFileSync(cssPath, source)

let appSource = fs.readFileSync(appPath, 'utf8')
const compactCoachTitles = [
  ['title="Drills Dashboard"', 'title="Drills"'],
  ['title="Strength & Conditioning Dashboard"', 'title="S&C"'],
  ['title="Activity Dashboard"', 'title="Activity"'],
  ['title="Leaderboards Dashboard"', 'title="Leaderboards"'],
]
for (const [legacyTitle, compactTitle] of compactCoachTitles) {
  if (appSource.includes(legacyTitle)) {
    appSource = appSource.replace(legacyTitle, compactTitle)
    continue
  }
  if (!appSource.includes(compactTitle)) {
    throw new Error(`Could not locate Coach functional-title contract: ${legacyTitle}`)
  }
}
fs.writeFileSync(appPath, appSource)

let metricCss = fs.readFileSync(metricCssPath, 'utf8')
const metricHoverMarker = '/* Premium mobile metrics keep a stable row while feedback remains tonal. */'
if (!metricCss.includes(metricHoverMarker)) {
  metricCss += `\n\n${metricHoverMarker}\n@media (max-width: 760px), (hover: none) {\n  .metric:hover,\n  .metric:focus-visible { transform: none; }\n}\n`
}
fs.writeFileSync(metricCssPath, metricCss)

let commitmentSource = fs.readFileSync(commitmentPath, 'utf8')
const legacyCommitmentRoot = `      data-testid={\`player-commitment-center-\${mode}\`}\n      data-mode={mode}`
const premiumCommitmentRoot = `      data-testid={\`player-commitment-center-\${mode}\`}\n      data-mode={mode}\n      data-page-hierarchy="editorial"`
if (commitmentSource.includes(premiumCommitmentRoot)) {
  // Already upgraded. The premium root contains the legacy prefix, so check it first.
} else if (commitmentSource.includes(legacyCommitmentRoot)) {
  commitmentSource = commitmentSource.replace(legacyCommitmentRoot, premiumCommitmentRoot)
} else {
  throw new Error('Could not locate Player commitment center hierarchy root.')
}

const legacyCommitmentHeader = `<header className={styles.routeHeader} data-testid={\`player-commitment-route-header-\${mode}\`}>`
const premiumCommitmentHeader = `<header className={styles.routeHeader} data-testid={\`player-commitment-route-header-\${mode}\`} data-layout-role="editorial-header" data-visual-role="page-intro">`
if (commitmentSource.includes(premiumCommitmentHeader)) {
  // Already upgraded.
} else if (commitmentSource.includes(legacyCommitmentHeader)) {
  commitmentSource = commitmentSource.replace(legacyCommitmentHeader, premiumCommitmentHeader)
} else {
  throw new Error('Could not locate Player commitment center route header.')
}
fs.writeFileSync(commitmentPath, commitmentSource)

let commitmentCss = fs.readFileSync(commitmentCssPath, 'utf8')
const commitmentMarker = '/* Premium Level B commitment header: concise orientation before the actionable commitment surface. */'
if (!commitmentCss.includes(commitmentMarker)) {
  commitmentCss += `\n${commitmentMarker}\n@media(max-width:759px){.routeHeader{padding-bottom:12px;border-bottom:1px solid rgba(23,26,24,.1)}.routeTitleRow{align-items:flex-start;flex-direction:column;gap:5px}.routeTitleRow h1{font-size:clamp(31px,8.8vw,36px)!important;line-height:.94!important;letter-spacing:-.05em!important}.routeHeader>p{display:none}}\n`
}
fs.writeFileSync(commitmentCssPath, commitmentCss)

console.log('Applied route-aware editorial mobile stages, edge-to-edge performance bands, compact Coach and Player functional titles, and stable mobile metric feedback.')
