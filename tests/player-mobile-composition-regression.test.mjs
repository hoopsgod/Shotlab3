import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const runner = fs.readFileSync(new URL('../scripts/run-route-enhancers.mjs', import.meta.url), 'utf8')
const reconciliation = fs.readFileSync(new URL('../scripts/apply-mobile-player-composition-reconciliation.mjs', import.meta.url), 'utf8')
const operationalWorkspace = fs.readFileSync(new URL('../src/components/PlayerOperationalWorkspace.jsx', import.meta.url), 'utf8')
const retiredAuthority = fs.readFileSync(new URL('../src/styles/MobilePremiumVisualSystem2026.css', import.meta.url), 'utf8')

test('Player composition reconciliation runs after the signature enhancer without reviving the retired global authority', () => {
  const signature = runner.indexOf('scripts/apply-mobile-player-coach-signal-signature.mjs')
  const composition = runner.indexOf('scripts/apply-mobile-player-composition-reconciliation.mjs')
  assert.ok(signature >= 0)
  assert.ok(composition > signature)
  assert.ok(retiredAuthority.length < 160)
  assert.doesNotMatch(retiredAuthority, /\{[^}]*:[^}]*\}/)
  assert.doesNotMatch(retiredAuthority, /@import/)
})

test('Dashboard Showstopper Home bypasses the retired centered KPI-card mutation path', () => {
  assert.match(reconciliation, /function hasDashboardShowstopperHome\(\)/)
  assert.match(reconciliation, /data-phase=\"dashboard-showstopper-phase-1\"/)
  assert.match(reconciliation, /hasDashboardShowstopperHome\(\) \? false : appendOwnedBlock\('src\/components\/PlayerDailyCommandCenter\.module\.css', legacyHomeCss\)/)
  assert.match(reconciliation, /\.hero\{text-align:center\}/)
  assert.match(reconciliation, /\.progressCard\{text-align:center!important\}/)
  assert.match(reconciliation, /player-daily-progress-seal/)
})

test('expanded Player momentum stays dark-on-light in the shared command hierarchy owner', () => {
  assert.match(reconciliation, /CommandHierarchy2026\.css/)
  assert.match(reconciliation, /\[data-testid="player-daily-momentum-signal"\]\{[^}]*--text-1:#17211a!important/)
  assert.match(reconciliation, /background:transparent!important/)
  assert.match(reconciliation, /text-align:left!important/)
  assert.doesNotMatch(reconciliation, /player-daily-momentum-signal[^`]*linear-gradient\(145deg,#0b2633,#071820 72%\)!important/)
})

test('Player operational and commitment surfaces keep centered mobile headers, metrics, filters, and training-plan framing', () => {
  assert.match(reconciliation, /PlayerOperationalWorkspace\.module\.css/)
  assert.match(reconciliation, /\.commandBar\{text-align:center;justify-items:center\}/)
  assert.match(operationalWorkspace, /MOBILE_OPERATIONAL_COMPOSITION_CSS/)
  assert.match(operationalWorkspace, /data-player-workspace-filter-rail="true"/)
  assert.match(operationalWorkspace, /data-metric-priority/)
  assert.match(operationalWorkspace, /justify-content:center/)
  assert.match(operationalWorkspace, /text-align:center/)
  assert.match(reconciliation, /MOBILE_COMMITMENT_COMPOSITION_CSS/)
  assert.match(reconciliation, /player-commitment-route-header-/)
  assert.match(reconciliation, /text-align:center/)
  assert.match(reconciliation, /\.player-training-kicker\{justify-content:center!important\}/)
  assert.match(reconciliation, /\.player-training-plan__header\{display:grid!important;justify-items:center!important;text-align:center!important\}/)
})
