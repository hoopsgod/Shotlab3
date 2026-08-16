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

test('Player Home hero removes the absolute progress-seal collision and centers the decision composition in its owning stylesheet', () => {
  assert.match(reconciliation, /PlayerDailyCommandCenter\.module\.css/)
  assert.match(reconciliation, /\.hero\{text-align:center\}/)
  assert.match(reconciliation, /\[data-testid="player-daily-progress-seal"\]\{[^}]*position:relative!important;[^}]*margin:18px auto 0!important/)
  assert.match(reconciliation, /\.title\{[^}]*margin:15px auto 0!important/)
  assert.match(reconciliation, /\.progressCard\{text-align:center!important\}/)
})

test('expanded Player momentum restores dark contrast and centered geometry in the shared command hierarchy owner', () => {
  assert.match(reconciliation, /CommandHierarchy2026\.css/)
  assert.match(reconciliation, /\[data-testid="player-daily-momentum-signal"\]\{[^}]*grid-template-columns:1fr!important/)
  assert.match(reconciliation, /linear-gradient\(145deg,#0b2633,#071820 72%\)!important/)
  assert.match(reconciliation, /\[data-testid="player-daily-momentum-signal"\] \[class\*="signalVisual"\]\{[^}]*justify-self:center!important/)
})

test('Player operational and commitment surfaces keep centered mobile headers, metrics, filters, and training-plan framing', () => {
  assert.match(reconciliation, /PlayerOperationalWorkspace\.module\.css/)
  assert.match(reconciliation, /\.commandBar\{text-align:center;justify-items:center\}/)
  assert.match(reconciliation, /\.metric\{text-align:center\}/)
  assert.match(operationalWorkspace, /MOBILE_FILTER_RAIL_CSS/)
  assert.match(operationalWorkspace, /data-player-workspace-filter-rail="true"/)
  assert.match(operationalWorkspace, /justify-content:center/)
  assert.match(reconciliation, /MOBILE_COMMITMENT_COMPOSITION_CSS/)
  assert.match(reconciliation, /player-commitment-route-header-/)
  assert.match(reconciliation, /text-align:center/)
  assert.match(reconciliation, /\.player-training-kicker\{justify-content:center!important\}/)
  assert.match(reconciliation, /\.player-training-plan__header\{display:grid!important;justify-items:center!important;text-align:center!important\}/)
})
