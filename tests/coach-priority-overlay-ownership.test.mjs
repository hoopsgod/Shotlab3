import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const mainSource = fs.readFileSync('src/main.jsx', 'utf8')
const coachSource = fs.readFileSync('src/components/CoachCommandCenter.jsx', 'utf8')
const compatibilityCss = fs.readFileSync('src/components/CoachPriorityOverlay.css', 'utf8')
const authorityCssPath = 'src/components/CoachPriorityOverlayAuthority.css'

test('Coach priority overlay has one optimizer-safe runtime CSS authority before app mount', () => {
  assert.match(coachSource, /import ["']\.\/CoachPriorityOverlay\.css["'];?/)
  assert.ok(fs.existsSync(authorityCssPath), 'canonical priority overlay authority stylesheet must exist')
  const authorityCss = fs.readFileSync(authorityCssPath, 'utf8')
  assert.match(mainSource, /await import\(["']\.\/components\/CoachPriorityOverlayAuthority\.css["']\)/)
  assert.ok(mainSource.indexOf('CoachPriorityOverlayAuthority.css') < mainSource.indexOf('ReactDOM.createRoot'))
  assert.doesNotMatch(compatibilityCss, /mission-control-priority-open|\.mcPriorityOverlay/)
  assert.match(authorityCss, /body\.mission-control-priority-open/)
  assert.match(authorityCss, /data-testid=[\\"']coach-priority-editor[\\"']/)
  assert.match(authorityCss, /@media \(max-width: 700px\)/)
  assert.match(authorityCss, /@media \(prefers-reduced-motion: reduce\)/)
})
