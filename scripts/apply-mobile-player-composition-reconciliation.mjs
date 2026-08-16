import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.cwd()
const MARKER = '/* Phase-close mobile optical composition reconciliation. */'

function appendOwnedBlock(relativePath, css) {
  const target = path.resolve(ROOT, relativePath)
  const source = readFileSync(target, 'utf8')
  if (source.includes(MARKER)) return false
  writeFileSync(target, `${source.trimEnd()}\n\n${MARKER}\n${css.trim()}\n`)
  return true
}

const homeCss = `
@media (max-width: 700px) {
  .hero { text-align: center; }
  .heroTop { justify-content: center !important; gap: 10px 14px !important; flex-wrap: wrap; }
  [data-testid="player-daily-progress-seal"] {
    position: relative !important;
    inset: auto !important;
    right: auto !important;
    top: auto !important;
    width: 88px !important;
    height: 88px !important;
    margin: 18px auto 0 !important;
    z-index: 1 !important;
  }
  .title {
    width: min(100%, 11ch);
    max-width: 11ch !important;
    margin: 15px auto 0 !important;
    text-align: center;
    font-size: clamp(40px, 10.7vw, 48px) !important;
    line-height: .9 !important;
    letter-spacing: -.058em !important;
  }
  .description { max-width: 31ch !important; margin: 12px auto 0 !important; text-align: center; }
  .primaryButton { margin-left: auto !important; margin-right: auto !important; }
  .progressCard { padding-left: 10px !important; padding-right: 10px !important; text-align: center !important; }
  .progressHeader { justify-content: center !important; }
  .progressTrack { width: min(100%, 92px); margin-left: auto !important; margin-right: auto !important; }
  .sectionHeading { display: grid !important; grid-template-columns: minmax(0, 1fr) !important; justify-items: center !important; gap: 5px !important; text-align: center !important; }
  .sectionHeading > .meta { justify-self: center !important; }
}
@media (max-width: 390px) {
  .title { font-size: 40px !important; }
}`

const workspaceCss = `
@media (max-width: 700px) {
  .commandBar { justify-items: center; text-align: center; }
  .copy { width: 100%; display: grid; justify-items: center; text-align: center; }
  .titleRow { align-items: center; justify-content: center; }
  .title, .status { text-align: center; }
  .primaryAction { max-width: 360px; margin-inline: auto; }
  .metric { padding-left: 14px; padding-right: 14px; text-align: center; }
  .metricLabel, .metricValue, .metricDetail { text-align: center; }
  .metric::after { left: 14px; right: 14px; }
  .filterRail { justify-content: center; padding-left: 0; padding-right: 0; }
}
@media (max-width: 390px) {
  .filterRail { gap: 5px; }
}`

const commitmentCss = `
@media (max-width: 759px) {
  .routeHeader { display: grid; justify-items: center; text-align: center; }
  .routeEyebrow { text-align: center; }
  .routeTitleRow { width: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 7px; }
  .routeTitleRow h1 { max-width: 12ch; text-align: center; text-wrap: balance; }
  .routeTitleRow > span { margin-bottom: 0; text-align: center; }
  .routeHeader > p { margin-left: auto; margin-right: auto; text-align: center; }
}
@media (max-width: 380px) {
  .routeTitleRow { align-items: center; }
}`

const hierarchyCss = `
@media (max-width: 760px) {
  .playerProgressDisclosure > summary {
    position: relative;
    justify-content: center !important;
    padding-left: 58px !important;
    padding-right: 58px !important;
    text-align: center;
  }
  .playerProgressDisclosure > summary > span:first-child { align-items: center; }
  .playerProgressDisclosure > summary strong,
  .playerProgressDisclosure > summary small { text-align: center; }
  .playerProgressDisclosure > summary::after {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
  }
  [data-testid="player-daily-momentum-signal"] {
    grid-template-columns: minmax(0, 1fr) !important;
    justify-items: center !important;
    gap: 12px !important;
    padding: 22px 18px !important;
    border: 1px solid rgba(200, 255, 26, .11) !important;
    border-radius: 20px !important;
    background: radial-gradient(circle at 50% 100%, rgba(200,255,26,.09), transparent 42%), linear-gradient(145deg, #0b2633, #071820 72%) !important;
    box-shadow: 0 18px 38px rgba(7,24,32,.12) !important;
    text-align: center !important;
  }
  [data-testid="player-daily-momentum-signal"] > span { margin-inline: auto !important; }
  [data-testid="player-daily-momentum-signal"] [class*="signalCopy"] { max-width: 32ch; margin-inline: auto; text-align: center !important; }
  [data-testid="player-daily-momentum-signal"] [class*="signalVisual"] { grid-column: auto !important; min-width: 0 !important; margin-top: 2px; justify-self: center !important; }
  .playerProgressDisclosureBody [class*="metrics"] { text-align: center; }
  .playerProgressDisclosureBody [class*="metric"] { padding-left: 12px !important; padding-right: 12px !important; }

  [data-player-journey="at-home"],
  [data-player-journey="program"] { width: 100%; margin-inline: auto; }
  .player-training-kicker { justify-content: center !important; margin-left: auto !important; margin-right: auto !important; text-align: center !important; }
  .player-primary-logging-region { width: 100%; margin-left: auto !important; margin-right: auto !important; }
  .player-primary-logging-region .player-logging-field label { text-align: center; }
  .player-training-plan__header {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) !important;
    justify-items: center !important;
    gap: 7px !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
    text-align: center !important;
  }
  .player-training-plan__header > div { justify-items: center !important; }
  .player-training-plan__header > span { text-align: center !important; }
}`

export function applyMobilePlayerCompositionReconciliation() {
  const changed = [
    appendOwnedBlock('src/components/PlayerDailyCommandCenter.module.css', homeCss),
    appendOwnedBlock('src/components/PlayerOperationalWorkspace.module.css', workspaceCss),
    appendOwnedBlock('src/components/PlayerCommitmentCenter.module.css', commitmentCss),
    appendOwnedBlock('src/styles/CommandHierarchy2026.css', hierarchyCss),
  ].filter(Boolean).length
  console.log(`Reconciled Player mobile optical composition in ${changed} owning style file(s).`)
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedFile === currentFile) applyMobilePlayerCompositionReconciliation()
