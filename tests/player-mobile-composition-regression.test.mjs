import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const premium = fs.readFileSync(new URL('../src/styles/MobilePremiumVisualSystem2026.css', import.meta.url), 'utf8')
const composition = fs.readFileSync(new URL('../src/styles/PlayerMobileComposition2026.css', import.meta.url), 'utf8')

test('final mobile premium layer loads the Player composition authority', () => {
  assert.match(premium, /@import "\.\/PlayerMobileComposition2026\.css";/)
})

test('Player Home hero removes the absolute progress-seal collision and centers the decision composition', () => {
  assert.match(composition, /\[data-testid="player-daily-progress-seal"\][\s\S]*position: relative !important;[\s\S]*margin: 18px auto 0 !important;/)
  assert.match(composition, /\[data-testid="player-daily-command-center"\] \[data-command-role="primary"\] h1[\s\S]*margin: 15px auto 0 !important;[\s\S]*text-align: center;/)
  assert.match(composition, /\[data-testid="player-command-evidence"\] > div[\s\S]*text-align: center !important;/)
})

test('expanded Player momentum restores dark contrast and a centered single-column composition', () => {
  assert.match(composition, /\[data-testid="player-daily-momentum-signal"\][\s\S]*grid-template-columns: minmax\(0, 1fr\) !important;/)
  assert.match(composition, /linear-gradient\(145deg, #0b2633, #071820 72%\) !important;/)
  assert.match(composition, /\[data-testid="player-daily-momentum-signal"\] \[class\*="signalVisual"\][\s\S]*justify-self: center !important;/)
})

test('At Home and Program mobile training surfaces share centered metrics, filters, and training-plan headers', () => {
  assert.match(composition, /\[data-testid="player-at-home-filter-rail"\],[\s\S]*\[data-testid="player-program-filter-rail"\][\s\S]*justify-content: center !important;/)
  assert.match(composition, /\.player-training-kicker[\s\S]*justify-content: center !important;/)
  assert.match(composition, /\.player-training-plan__header[\s\S]*justify-items: center !important;[\s\S]*text-align: center !important;/)
})
