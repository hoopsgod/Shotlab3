import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const runner = fs.readFileSync(new URL('../scripts/run-route-enhancers.mjs', import.meta.url), 'utf8')
const secondary = fs.readFileSync(new URL('../src/components/SecondaryPageSystem.jsx', import.meta.url), 'utf8')
const secondaryCss = fs.readFileSync(new URL('../src/components/SecondaryPageSystem.css', import.meta.url), 'utf8')
const stageCss = fs.readFileSync(new URL('../src/components/TeamIdentityTitleStage.css', import.meta.url), 'utf8')

test('legacy route promotion and centering mutators stay out of the enhancer pipeline', () => {
  assert.doesNotMatch(runner, /apply-mobile-route-signature-promotion\.mjs/)
  assert.doesNotMatch(runner, /apply-mobile-centered-route-stage\.mjs/)
  assert.equal(fs.existsSync(new URL('../scripts/apply-mobile-route-signature-promotion.mjs', import.meta.url)), false)
  assert.equal(fs.existsSync(new URL('../scripts/apply-mobile-centered-route-stage.mjs', import.meta.url)), false)
})

test('mobile secondary route mastheads resolve through the shared source-owned title stage', () => {
  assert.match(secondary, /<TeamIdentityTitleStage/)
  assert.match(secondary, /variant="standard"/)
  assert.match(secondary, /surface="light"/)
  assert.doesNotMatch(secondary, /secondaryPageIntro__title|appHeaderTitle/)
  assert.doesNotMatch(secondaryCss, /\.secondaryPageIntro\b/)
  assert.match(stageCss, /--identity-title:\s*clamp\(42px, 10\.2vw, 44px\)/)
  assert.match(stageCss, /--identity-crest:\s*clamp\(96px, 25vw, 108px\)/)
  assert.match(stageCss, /@media \(max-width: 390px\)/)
  assert.match(stageCss, /\.teamIdentityTitleStage--standard \{ --identity-crest: 84px; --identity-title: 38px; \}/)
  assert.match(stageCss, /\.teamIdentityTitleStage--standard \.teamIdentityTitleStage__inner \{ gap: 8px;/)
  assert.match(stageCss, /\.teamIdentityTitleStage__title[\s\S]*overflow-wrap:\s*normal[\s\S]*word-break:\s*normal/)
})

test('shared title stage owns responsive geometry without build-time source transforms', () => {
  assert.match(stageCss, /\.teamIdentityTitleStage__crest\s*\{[\s\S]*object-fit:\s*contain/)
  assert.match(stageCss, /\.teamIdentityTitleStage--longTitle[\s\S]*clamp\(40px, 9\.8vw, 44px\)/)
  assert.doesNotMatch(stageCss, /html\s+body\s+#root/)
})
