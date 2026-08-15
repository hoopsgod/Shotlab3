import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const main = fs.readFileSync('src/main.jsx', 'utf8')
const mobile = fs.readFileSync('src/styles/MobilePremiumVisualSystem2026.css', 'utf8')

test('canonical mobile signature authority loads after page and cascade owners', () => {
  const visualFoundation = main.indexOf("await import('./styles/VisualFoundation2026.css')")
  const cascadeLock = main.indexOf("await import('./styles/MissionControlCascadeLock2026.css')")
  const mobileAuthority = main.indexOf("await import('./styles/MobilePremiumVisualSystem2026.css')")
  assert.ok(visualFoundation >= 0 && cascadeLock > visualFoundation && mobileAuthority > cascadeLock)
})

test('Coach Home shares the dark ShotLab identity language instead of cream utility chrome', () => {
  assert.match(mobile, /\.mcHeader \{[\s\S]*min-height: 94px !important/)
  assert.match(mobile, /linear-gradient\(126deg, #061923 0%, #082430 58%, #0b2d37 100%\) !important/)
  assert.match(mobile, /\.mcBrandCopy small \{[\s\S]*color: #c8ff1a !important;[\s\S]*font-size: 11px !important/)
  assert.match(mobile, /\.mcHeaderTeamMark img \{[\s\S]*width: 48px !important;[\s\S]*object-fit: contain !important/)
})

test('Coach primary decision is a full-bleed performance field rather than a rounded dashboard card', () => {
  assert.match(mobile, /\.mcHero \{[\s\S]*margin: 12px -12px 0 !important/)
  assert.match(mobile, /\.mcHero \{[\s\S]*border-radius: 0 !important/)
  assert.match(mobile, /\.mcHero h1 \{[\s\S]*font-size: clamp\(39px, 11\.2vw, 45px\) !important/)
  assert.match(mobile, /\.mcRealityStrip \{[\s\S]*border-radius: 0 !important;[\s\S]*background: transparent !important/)
})

test('Coach supporting content is editorial and keeps readable mobile type', () => {
  assert.match(mobile, /\.mcSection \{[\s\S]*border-radius: 0 !important;[\s\S]*background: transparent !important/)
  assert.match(mobile, /\.mcSectionHead h2 \{[\s\S]*font-size: 27px !important/)
  assert.doesNotMatch(mobile, /font-size:\s*(?:8|9|10)(?:\.\d+)?px\s*!important/)
  assert.match(mobile, /\.mcMobileMenu,[\s\S]*\.mcBell \{[\s\S]*min-height: 44px !important/)
})
