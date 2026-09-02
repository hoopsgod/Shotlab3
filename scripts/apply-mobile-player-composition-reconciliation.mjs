import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.cwd()
const MARKER = '/* Phase-close mobile optical composition reconciliation. */'

function appendOwnedBlock(relativePath, css) {
  const target = path.resolve(ROOT, relativePath)
  const rawSource = readFileSync(target, 'utf8')
  const lineEnding = rawSource.includes('\r\n') ? '\r\n' : '\n'
  const source = rawSource.replace(/\r\n/g, '\n')
  if (source.includes(MARKER)) return false
  writeFileSync(target, `${source.trimEnd()}\n\n${MARKER}\n${css.trim()}\n`.replace(/\n/g, lineEnding))
  return true
}

function hasDashboardShowstopperHome() {
  const target = path.resolve(ROOT, 'src/components/PlayerDailyCommandCenter.jsx')
  return readFileSync(target, 'utf8').includes('data-phase="dashboard-showstopper-phase-')
}

function trimLegacyCoachEmptyStateTooltip() {
  const target = path.resolve(ROOT, 'src/App.jsx')
  const rawSource = readFileSync(target, 'utf8')
  const lineEnding = rawSource.includes('\r\n') ? '\r\n' : '\n'
  const source = rawSource.replace(/\r\n/g, '\n')
  const legacyConstant = '  const legacyCoachEmptyStateCopy = "No activity yet — invite players or have them log their first workout.";\n'
  const legacyTitle = ' title={legacyCoachEmptyStateCopy}'
  if (!source.includes(legacyConstant) && !source.includes(legacyTitle)) return false
  if (!source.includes(legacyConstant) || !source.includes(legacyTitle)) {
    throw new Error('[mobile-player-composition] legacy Coach empty-state tooltip contract is partially applied')
  }
  writeFileSync(target, source.replace(legacyConstant, '').replace(legacyTitle, '').replace(/\n/g, lineEnding))
  return true
}

const legacyHomeCss = `
@media(max-width:700px){
.hero{text-align:center}.heroTop{justify-content:center!important;flex-wrap:wrap}
[data-testid="player-daily-progress-seal"]{position:relative!important;inset:auto!important;width:88px!important;height:88px!important;margin:18px auto 0!important}
.title{max-width:11ch!important;margin:15px auto 0!important;font-size:clamp(40px,10.7vw,48px)!important}.description{max-width:31ch!important;margin:12px auto 0!important}
.progressCard{text-align:center!important}.progressHeader,.sectionHeading{justify-content:center!important}.sectionHeading{text-align:center!important}}
@media(max-width:390px){.title{font-size:40px!important}}`

const workspaceCss = `
@media(max-width:700px){
.commandBar{text-align:center;justify-items:center}.primaryAction{max-width:360px;margin-inline:auto}}
`

const hierarchyCss = `
@media(max-width:760px){
[data-testid="player-coach-priority-signal"]{padding-inline:8px 2px!important}
.playerProgressDisclosure>summary{position:relative;justify-content:space-between!important;padding-inline:2px 50px!important}.playerProgressDisclosure>summary>span:first-child{align-items:flex-start}.playerProgressDisclosure>summary::after{position:absolute;right:2px;top:50%;transform:translateY(-50%)}
[data-testid="player-daily-momentum-signal"]{--surface-elevated:transparent!important;--text-1:#17211a!important;--text-2:#465149!important;--text-3:#667069!important;--neon:#617900!important;grid-template-columns:1fr!important;justify-items:start!important;padding:18px 0!important;border-radius:0!important;background:transparent!important;text-align:left!important;box-shadow:none!important}
.player-training-kicker{justify-content:center!important}
.player-training-plan__header{display:grid!important;justify-items:start!important;text-align:left!important;padding-inline:2px!important}}
`

export function applyMobilePlayerCompositionReconciliation() {
  const changed = [
    hasDashboardShowstopperHome() ? false : appendOwnedBlock('src/components/PlayerDailyCommandCenter.module.css', legacyHomeCss),
    appendOwnedBlock('src/components/PlayerOperationalWorkspace.module.css', workspaceCss),
    trimLegacyCoachEmptyStateTooltip(),
    appendOwnedBlock('src/styles/CommandHierarchy2026.css', hierarchyCss),
  ].filter(Boolean).length
  console.log(`Reconciled Player mobile optical composition in ${changed} non-title owned surface(s); commitment titles remain source-owned.`)
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedFile === currentFile) applyMobilePlayerCompositionReconciliation()
