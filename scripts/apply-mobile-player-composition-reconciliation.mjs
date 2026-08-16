import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.cwd()
const MARKER = '/* Phase-close mobile optical composition reconciliation. */'
const COMMITMENT_RUNTIME_MARKER = 'MOBILE_COMMITMENT_COMPOSITION_CSS'

function appendOwnedBlock(relativePath, css) {
  const target = path.resolve(ROOT, relativePath)
  const source = readFileSync(target, 'utf8')
  if (source.includes(MARKER)) return false
  writeFileSync(target, `${source.trimEnd()}\n\n${MARKER}\n${css.trim()}\n`)
  return true
}

function hasDashboardShowstopperHome() {
  const target = path.resolve(ROOT, 'src/components/PlayerDailyCommandCenter.jsx')
  return readFileSync(target, 'utf8').includes('data-phase="dashboard-showstopper-phase-')
}

function injectCommitmentRuntimeStyle() {
  const target = path.resolve(ROOT, 'src/components/PlayerCommitmentCenter.jsx')
  const source = readFileSync(target, 'utf8')
  if (source.includes(COMMITMENT_RUNTIME_MARKER)) return false
  const constantAnchor = 'const RUNWAY_SLOTS = 3;'
  const headerAnchor = '      <header className={styles.routeHeader}'
  if (!source.includes(constantAnchor) || !source.includes(headerAnchor)) {
    throw new Error('[mobile-player-composition] commitment runtime style anchor missing')
  }
  const runtimeCss = 'const MOBILE_COMMITMENT_COMPOSITION_CSS = `@media(max-width:759px){[data-testid^="player-commitment-route-header-"]{text-align:center}[data-testid^="player-commitment-route-header-"]>div:nth-of-type(2){align-items:center}}`;'
  let next = source.replace(constantAnchor, `${constantAnchor}\n${runtimeCss}`)
  next = next.replace(headerAnchor, `      <style>{MOBILE_COMMITMENT_COMPOSITION_CSS}</style>\n${headerAnchor}`)
  writeFileSync(target, next)
  return true
}

function trimLegacyCoachEmptyStateTooltip() {
  const target = path.resolve(ROOT, 'src/App.jsx')
  const source = readFileSync(target, 'utf8')
  const legacyConstant = '  const legacyCoachEmptyStateCopy = "No activity yet — invite players or have them log their first workout.";\n'
  const legacyTitle = ' title={legacyCoachEmptyStateCopy}'
  if (!source.includes(legacyConstant) && !source.includes(legacyTitle)) return false
  if (!source.includes(legacyConstant) || !source.includes(legacyTitle)) {
    throw new Error('[mobile-player-composition] legacy Coach empty-state tooltip contract is partially applied')
  }
  writeFileSync(target, source.replace(legacyConstant, '').replace(legacyTitle, ''))
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
.playerProgressDisclosure>summary{position:relative;justify-content:space-between!important;padding-inline:14px 54px!important}.playerProgressDisclosure>summary>span:first-child{align-items:flex-start}.playerProgressDisclosure>summary::after{position:absolute;right:14px;top:50%;transform:translateY(-50%)}
[data-testid="player-daily-momentum-signal"]{--surface-elevated:transparent!important;--text-1:#17211a!important;--text-2:#465149!important;--text-3:#667069!important;--neon:#617900!important;grid-template-columns:1fr!important;justify-items:start!important;padding:18px 0!important;border-radius:0!important;background:transparent!important;text-align:left!important;box-shadow:none!important}
.player-training-kicker{justify-content:center!important}.player-primary-logging-region .player-logging-field label{text-align:center}.player-training-plan__header{display:grid!important;justify-items:center!important;text-align:center!important}}
`

export function applyMobilePlayerCompositionReconciliation() {
  const changed = [
    hasDashboardShowstopperHome() ? false : appendOwnedBlock('src/components/PlayerDailyCommandCenter.module.css', legacyHomeCss),
    appendOwnedBlock('src/components/PlayerOperationalWorkspace.module.css', workspaceCss),
    injectCommitmentRuntimeStyle(),
    trimLegacyCoachEmptyStateTooltip(),
    appendOwnedBlock('src/styles/CommandHierarchy2026.css', hierarchyCss),
  ].filter(Boolean).length
  console.log(`Reconciled Player mobile optical composition in ${changed} owned surface(s).`)
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedFile === currentFile) applyMobilePlayerCompositionReconciliation()
