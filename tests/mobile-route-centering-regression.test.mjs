import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { centerMobileRouteStage } from '../scripts/apply-mobile-centered-route-stage.mjs'

const runner = fs.readFileSync(new URL('../scripts/run-route-enhancers.mjs', import.meta.url), 'utf8')

const promotedFixture = `@media (max-width: 760px) {
  .secondaryPageIntro {
    position: relative;
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr);
    align-items: start;
    column-gap: 10px;
    row-gap: 8px;
    min-height: 0;
    padding: 7px 0 12px;
  }
  .secondaryPageIntro__copy { min-width: 0; max-width: none; }
  .secondaryPageIntro__icon {
    position: static;
    width: 46px;
    height: 54px;
    display: grid;
    place-items: center;
    margin-top: 1px;
    border: 1px solid rgba(7, 26, 34, .1);
  }
  .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle,
  .performance-shell .secondaryPageIntro .secondaryPageIntro__title.appHeaderTitle {
    max-width: 9.8ch;
    font-size: clamp(36px, 10vw, 42px) !important;
    line-height: .91;
  }
  .secondaryPageIntro__actions {
    grid-column: 1 / -1;
    width: 100%;
    min-width: 0;
    margin-top: 1px;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
  .secondaryPageIntro__status {
    max-width: 100%;
    color: #5b665e;
    font-size: 11px;
    line-height: 1.25;
    text-align: left;
    text-overflow: ellipsis;
  }
}

@media (max-width: 430px) {
  .secondaryPageIntro { grid-template-columns: 44px minmax(0, 1fr); column-gap: 9px; }
  .secondaryPageIntro__icon { width: 44px; height: 50px; border-radius: 0; }
}`

test('final route enhancer runs after the signature promotion that previously restored left alignment', () => {
  const promotionIndex = runner.indexOf('scripts/apply-mobile-route-signature-promotion.mjs')
  const centeringIndex = runner.indexOf('scripts/apply-mobile-centered-route-stage.mjs')
  assert.ok(promotionIndex >= 0)
  assert.ok(centeringIndex > promotionIndex)
})

test('mobile secondary route mastheads resolve to a compact centered one-column title stage', () => {
  const centered = centerMobileRouteStage(promotedFixture)
  assert.match(centered, /grid-template-columns: minmax\(0, 1fr\);[\s\S]*justify-items: center;[\s\S]*row-gap: 5px;[\s\S]*text-align: center;/)
  assert.match(centered, /padding: 4px 0 8px;/)
  assert.match(centered, /\.secondaryPageIntro__copy \{[\s\S]*max-width: 360px;[\s\S]*margin-inline: auto;[\s\S]*text-align: center;/)
  assert.match(centered, /width: 42px;\n    height: 42px;/)
  assert.match(centered, /max-width: 10\.5ch;[\s\S]*margin-inline: auto;[\s\S]*text-align: center;/)
  assert.match(centered, /\.secondaryPageIntro__actions \{[\s\S]*max-width: 360px;[\s\S]*margin: 0 auto;[\s\S]*justify-items: center;[\s\S]*gap: 5px;/)
  assert.match(centered, /line-height: 1\.25;\n    text-align: center;/)
  assert.match(centered, /\.coachPlayerDetailWorkspace \.secondaryPageIntro \.secondaryPageIntro__title\.appHeaderTitle \{\n    max-width: 16ch !important;/)
  assert.match(centered, /@media \(max-width: 430px\) \{\n  \.secondaryPageIntro \{ grid-template-columns: minmax\(0, 1fr\); column-gap: 0; \}/)
  assert.match(centered, /\.secondaryPageIntro__icon \{ width: 40px; height: 40px; border-radius: 0; \}/)
})

test('centering transform is idempotent', () => {
  const centered = centerMobileRouteStage(promotedFixture)
  assert.equal(centerMobileRouteStage(centered), centered)
})
