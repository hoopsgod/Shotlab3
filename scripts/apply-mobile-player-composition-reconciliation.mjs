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

function trimRetiredPlayerEventsPayload() {
  const componentPath = path.resolve(ROOT, 'src/components/PlayerCommitmentCenter.jsx')
  const cssPath = path.resolve(ROOT, 'src/components/PlayerCommitmentCenter.module.css')
  let component = readFileSync(componentPath, 'utf8')
  let css = readFileSync(cssPath, 'utf8')
  let changed = false

  const deadIcon = `function CommitmentIcon({ mode }) {
  if (mode === "strength") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 7h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M17.5 7h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      <path d="M8 13h3v3H8z" />
    </svg>
  );
}`
  const strengthIcon = `function CommitmentIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M17.5 7h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2M6.5 12h11M1.5 9.5v5M22.5 9.5v5" /></svg>;
}`
  if (component.includes(deadIcon)) {
    component = component.replace(deadIcon, strengthIcon).replaceAll('<CommitmentIcon mode={mode} />', '<CommitmentIcon />')
    changed = true
  }

  for (const retiredCss of [
    '.eventDetails .detailBody>:global(.fade-up)>:global(.accent-card):first-child{display:none!important}',
    '.eventDetails .detailBody :global(.ch)>div:first-child{gap:10px!important}',
    '.eventDetails .detailBody :global(.ch)>div:first-child>div:first-child{width:36px!important;height:36px!important;border-radius:9px!important;background:rgba(255,255,255,.04)!important}',
  ]) {
    if (css.includes(retiredCss)) {
      css = css.replace(retiredCss, '')
      changed = true
    }
  }

  if (changed) {
    writeFileSync(componentPath, component)
    writeFileSync(cssPath, css)
  }
  return changed
}

function injectCommitmentRuntimeStyle() {
  const target = path.resolve(ROOT, 'src/components/PlayerCommitmentCenter.jsx')
  const source = readFileSync(target, 'utf8')
  if (source.includes(COMMITMENT_RUNTIME_MARKER)) return false

  const eventsSystemIsSourceOwned = [
    '<EventsTitleStage role="player"',
    'data-testid="player-events-next-up"',
    '<EventsWeekRail',
    '<EventsMonthPanel',
    'data-testid="player-commitment-details-events"',
  ].every((marker) => source.includes(marker))

  if (eventsSystemIsSourceOwned) {
    console.log('[mobile-player-composition] Player Events composition is source-owned; legacy commitment runtime style injection retired.')
    return false
  }

  const constantAnchor = source.includes('const RUNWAY_SLOTS = 4;') ? 'const RUNWAY_SLOTS = 4;' : 'const RUNWAY_SLOTS = 3;'
  const headerAnchor = '      <header className={styles.routeHeader}'
  if (!source.includes(constantAnchor) || !source.includes(headerAnchor)) throw new Error('[mobile-player-composition] commitment runtime style anchor missing')
  const runtimeCss = 'const MOBILE_COMMITMENT_COMPOSITION_CSS = `@media(max-width:759px){[data-testid^="player-commitment-route-header-"]{text-align:center}[data-testid^="player-commitment-route-header-"]>div:nth-of-type(2){align-items:center}}`;'
  let next = source.replace(constantAnchor, `${constantAnchor}\n${runtimeCss}`)
  next = next.replace(headerAnchor, `      <style>{MOBILE_COMMITMENT_COMPOSITION_CSS}</style>\n${headerAnchor}`)
  writeFileSync(target, next)
  return true
}

function retireLegacyPlayerEventsPanel() {
  const target = path.resolve(ROOT, 'src/App.jsx')
  const source = readFileSync(target, 'utf8')
  const promoted = '<PlayerCommitmentCenter mode="events" model={eventsWorkspaceModel} items={events} responses={rsvps} user={u} today={today} onAction={handlePlayerWorkspaceAction} toggleRsvp={toggleRsvp} onCompletionCue={pushCompletionCue}/>'
  if (source.includes(promoted)) return false
  const legacy = '<PlayerCommitmentCenter mode="events" model={eventsWorkspaceModel} items={events} responses={rsvps} user={u} today={today} onAction={handlePlayerWorkspaceAction}><div data-testid="player-events-operational-list"><EventsPanel events={events} rsvps={rsvps} user={u} toggleRsvp={toggleRsvp} scores={scores} drills={drills} onCompletionCue={pushCompletionCue}/></div></PlayerCommitmentCenter>'
  if (!source.includes(legacy)) throw new Error('[mobile-player-composition] legacy Player Events panel route was not found')
  writeFileSync(target, source.replace(legacy, promoted))
  console.log('[mobile-player-composition] Retired duplicate Player Events panel; premium Events owns detail and RSVP presentation.')
  return true
}

function trimLegacyCoachEmptyStateTooltip() {
  const target = path.resolve(ROOT, 'src/App.jsx')
  const source = readFileSync(target, 'utf8')
  const legacyConstant = '  const legacyCoachEmptyStateCopy = "No activity yet — invite players or have them log their first workout.";\n'
  const legacyTitle = ' title={legacyCoachEmptyStateCopy}'
  if (!source.includes(legacyConstant) && !source.includes(legacyTitle)) return false
  if (!source.includes(legacyConstant) || !source.includes(legacyTitle)) throw new Error('[mobile-player-composition] legacy Coach empty-state tooltip contract is partially applied')
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
    trimRetiredPlayerEventsPayload(),
    injectCommitmentRuntimeStyle(),
    retireLegacyPlayerEventsPanel(),
    trimLegacyCoachEmptyStateTooltip(),
    appendOwnedBlock('src/styles/CommandHierarchy2026.css', hierarchyCss),
  ].filter(Boolean).length
  console.log(`Reconciled Player mobile optical composition in ${changed} owned surface(s).`)
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedFile === currentFile) applyMobilePlayerCompositionReconciliation()