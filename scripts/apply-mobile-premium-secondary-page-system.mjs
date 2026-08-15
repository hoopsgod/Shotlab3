import fs from 'node:fs'
import path from 'node:path'

const cssPath = path.resolve(process.cwd(), 'src/components/SecondaryPageSystem.css')
const appPath = path.resolve(process.cwd(), 'src/App.jsx')
const metricCssPath = path.resolve(process.cwd(), 'src/components/CoachDashboardPrimitives.module.css')
const commitmentPath = path.resolve(process.cwd(), 'src/components/PlayerCommitmentCenter.jsx')
const commitmentCssPath = path.resolve(process.cwd(), 'src/components/PlayerCommitmentCenter.module.css')
let source = fs.readFileSync(cssPath, 'utf8')

const startMarker = '@media (max-width: 760px) {'
const narrowMarker = '@media (max-width: 390px) {'
const motionMarker = '@media (prefers-reduced-motion: reduce) {'

const mobileStart = source.indexOf(startMarker)
const narrowStart = source.indexOf(narrowMarker, mobileStart + startMarker.length)
const motionStart = source.indexOf(motionMarker, narrowStart + narrowMarker.length)

if (mobileStart < 0 || narrowStart < 0 || motionStart < 0) {
  throw new Error('Could not locate the owned SecondaryPageSystem mobile breakpoint boundaries.')
}

const mobileAuthority = `@media (max-width: 760px) {
  .secondaryPageShell {
    gap: 18px;
    padding: 8px var(--layout-gutter, 16px) 96px;
  }

  .secondaryPageIntro {
    grid-template-columns: 34px minmax(0, 1fr);
    align-items: start;
    gap: 8px 11px;
    padding: 3px 0 12px;
    border-bottom: 1px solid var(--sl-line, rgba(23, 26, 24, .1));
  }

  .secondaryPageIntro__icon { width: 34px; height: 34px; }
  .secondaryPageIntro__icon svg { width: 22px; height: 22px; stroke-width: 1.75; }
  .secondaryPageIntro__eyebrow { margin-bottom: 4px; font-size: 10.5px; }
  .secondaryPageIntro .secondaryPageIntro__title,
  .performance-shell .secondaryPageIntro .secondaryPageIntro__title {
    font-size: clamp(29px, 8vw, 34px) !important;
    line-height: .98;
    letter-spacing: -.047em;
    overflow-wrap: normal;
    word-break: normal;
  }
  .secondaryPageIntro__summary { display: none; }
  .secondaryPageIntro__actions {
    grid-column: 1 / -1;
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .secondaryPageIntro__status { max-width: 48%; font-size: 11px; line-height: 1.25; text-align: left; }
  .secondaryPageIntro__buttonRow { min-width: 0; flex: 0 1 auto; gap: 7px; justify-content: flex-end; }
  .secondaryPageAction { min-height: 44px; padding-inline: 13px; border-radius: 12px; font-size: 12px; white-space: nowrap; }

  .secondaryPageToolbar [data-visual-role="metric-strip"] {
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }
  .secondaryPageToolbar [data-visual-role="metric-strip"]::-webkit-scrollbar { display: none; }
  .secondaryPageToolbar [data-visual-role="metric-strip"] > button {
    min-width: 124px !important;
    min-height: 82px !important;
    padding: 11px 8px !important;
    scroll-snap-align: start;
  }

  .secondaryPageDecision {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    min-height: 0;
    gap: 8px;
    padding: 18px;
    border-radius: 20px;
    background: linear-gradient(145deg, #171b18, #0c0f0d 72%);
    box-shadow: 0 14px 32px rgba(25, 31, 26, .12);
  }
  .secondaryPageDecision::after,
  .secondaryPageDecision__icon,
  .secondaryPageDecision__visual { display: none; }
  .secondaryPageDecision__eyebrow { margin-bottom: 5px; font-size: 10.5px; }
  .secondaryPageDecision h2 { max-width: 18ch; font-size: clamp(23px, 6.4vw, 27px); line-height: 1; }
  .secondaryPageDecision p { max-width: 38ch; margin-top: 7px; font-size: 12.5px; line-height: 1.43; }
  .secondaryPageDecision button { min-height: 42px; margin-top: 12px; }

  .secondaryPageEvidence { grid-template-columns: 1fr; }
  .secondaryPageEvidence > * { padding: 15px 2px !important; }
  .secondaryPageEvidence > * + * {
    border-top: 1px solid var(--sl-line, rgba(23, 26, 24, .1)) !important;
    border-left: 0 !important;
  }

  .coachPlayerDetailWorkspace { gap: 16px; }
  .coachPlayerProfileHero { grid-template-columns: 1fr; gap: 12px; padding: 18px; border-radius: 18px 18px 0 0; box-shadow: 0 14px 34px rgba(25, 31, 26, .12); }
  .coachPlayerProfileHero__identity { gap: 12px; }
  .coachPlayerProfileHero h2 { font-size: 27px; }
  .coachPlayerProfileHero__headline { display: flex; align-items: end; justify-content: space-between; min-width: 0; padding: 12px 0 0; border-top: 1px solid rgba(255, 255, 255, .1); border-left: 0; text-align: left; }
  .coachPlayerProfileHero__headline small { max-width: 130px; text-align: right; }
  .coachPlayerProfileMetrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .coachPlayerProfileMetric:nth-child(3) { border-left: 0; }
  .coachPlayerProfileMetric:nth-child(n+3) { border-top: 1px solid var(--sl-line, rgba(23, 26, 24, .1)); }
  .coachPlayerProfileEvidence { grid-template-columns: 1fr; }
  .coachPlayerProfileSection { padding: 19px 2px; }
  .coachPlayerProfileSection + .coachPlayerProfileSection { border-top: 1px solid var(--sl-line, rgba(23, 26, 24, .1)); border-left: 0; }

  .coachAdministrationPulse { padding: 15px 0 0; border-top: 1px solid rgba(255, 255, 255, .1); border-left: 0; }
  .coachSeasonArchiveForm,
  .coachAdministrationGrid { grid-template-columns: 1fr; }
  .coachSeasonArchivePanel { padding: 17px; border-radius: 18px; }
  .coachSeasonArchivePanel > .cta-primary { width: 100% !important; }
  .seasonArchiveStats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .seasonArchiveStat:nth-child(odd) { border-left: 0; }
  .seasonArchiveStat:nth-child(n+3) { border-top: 1px solid var(--sl-line, rgba(23, 26, 24, .1)); }
}

`

const narrowAuthority = `@media (max-width: 390px) {
  .secondaryPageIntro__actions { align-items: stretch; flex-direction: column; }
  .secondaryPageIntro__status { max-width: 100%; }
  .secondaryPageIntro__buttonRow { width: 100%; justify-content: stretch; }
  .secondaryPageAction { flex: 1 1 0; min-width: 0; }
  .secondaryPageIntro .secondaryPageIntro__title,
  .performance-shell .secondaryPageIntro .secondaryPageIntro__title { font-size: 30px !important; }
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
if (commitmentSource.includes(legacyCommitmentRoot)) {
  commitmentSource = commitmentSource.replace(legacyCommitmentRoot, premiumCommitmentRoot)
} else if (!commitmentSource.includes('data-page-hierarchy="editorial"')) {
  throw new Error('Could not locate Player commitment center hierarchy root.')
}

const legacyCommitmentHeader = `<header className={styles.routeHeader} data-testid={\`player-commitment-route-header-\${mode}\`}>`
const premiumCommitmentHeader = `<header className={styles.routeHeader} data-testid={\`player-commitment-route-header-\${mode}\`} data-layout-role="editorial-header" data-visual-role="page-intro">`
if (commitmentSource.includes(legacyCommitmentHeader)) {
  commitmentSource = commitmentSource.replace(legacyCommitmentHeader, premiumCommitmentHeader)
} else if (!commitmentSource.includes('data-testid={`player-commitment-route-header-${mode}`} data-layout-role="editorial-header" data-visual-role="page-intro"')) {
  throw new Error('Could not locate Player commitment center route header.')
}
fs.writeFileSync(commitmentPath, commitmentSource)

let commitmentCss = fs.readFileSync(commitmentCssPath, 'utf8')
const commitmentMarker = '/* Premium Level B commitment header: concise orientation before the actionable commitment surface. */'
if (!commitmentCss.includes(commitmentMarker)) {
  commitmentCss += `\n${commitmentMarker}\n@media(max-width:759px){.routeHeader{padding-bottom:12px;border-bottom:1px solid rgba(23,26,24,.1)}.routeTitleRow{align-items:flex-start;flex-direction:column;gap:5px}.routeTitleRow h1{font-size:clamp(29px,8vw,32px)!important}.routeHeader>p{display:none}}\n`
}
fs.writeFileSync(commitmentCssPath, commitmentCss)

console.log('Applied owner-level premium mobile page hierarchy, compact Coach and Player functional titles, and stable mobile metric feedback.')
