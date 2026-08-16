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
@media(max-width:700px){
.hero{text-align:center}.heroTop{justify-content:center!important;flex-wrap:wrap}
[data-testid="player-daily-progress-seal"]{position:relative!important;inset:auto!important;width:88px!important;height:88px!important;margin:18px auto 0!important}
.title{max-width:11ch!important;margin:15px auto 0!important;text-align:center;font-size:clamp(40px,10.7vw,48px)!important}
.description{max-width:31ch!important;margin:12px auto 0!important;text-align:center}.primaryButton{margin-inline:auto!important}
.progressCard{text-align:center!important}.progressHeader,.sectionHeading{justify-content:center!important}.sectionHeading{text-align:center!important}}
@media(max-width:390px){.title{font-size:40px!important}}`

const workspaceCss = `
@media(max-width:700px){
.commandBar,.copy{text-align:center}.commandBar{justify-items:center}.copy{width:100%}.titleRow{align-items:center;justify-content:center}
.primaryAction{max-width:360px;margin-inline:auto}.metric{text-align:center}.filterRail{justify-content:center;padding-inline:0}}
`

const commitmentCss = `
@media(max-width:759px){
.routeHeader{display:grid;justify-items:center;text-align:center}.routeEyebrow{text-align:center}.routeTitleRow{width:100%;align-items:center;justify-content:center}
.routeTitleRow h1{max-width:12ch;text-align:center;text-wrap:balance}.routeHeader>p{margin-inline:auto;text-align:center}}
`

const hierarchyCss = `
@media(max-width:760px){
.playerProgressDisclosure>summary{position:relative;justify-content:center!important;padding-inline:58px!important;text-align:center}.playerProgressDisclosure>summary>span:first-child{align-items:center}
.playerProgressDisclosure>summary::after{position:absolute;right:14px;top:50%;transform:translateY(-50%)}
[data-testid="player-daily-momentum-signal"]{grid-template-columns:1fr!important;justify-items:center!important;padding:22px 18px!important;border:1px solid rgba(200,255,26,.11)!important;border-radius:20px!important;background:linear-gradient(145deg,#0b2633,#071820 72%)!important;text-align:center!important}
[data-testid="player-daily-momentum-signal"] [class*="signalVisual"]{grid-column:auto!important;min-width:0!important;justify-self:center!important}
.player-training-kicker{justify-content:center!important;margin-inline:auto!important;text-align:center!important}.player-primary-logging-region{width:100%;margin-inline:auto!important}.player-primary-logging-region .player-logging-field label{text-align:center}
.player-training-plan__header{display:grid!important;grid-template-columns:1fr!important;justify-items:center!important;text-align:center!important}}
`

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
