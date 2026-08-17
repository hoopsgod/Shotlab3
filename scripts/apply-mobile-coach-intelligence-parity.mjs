import fs from 'node:fs'
import path from 'node:path'

const coachPanelPath = path.resolve(process.cwd(), 'src/components/CoachDashboardPhase2.jsx')
let source = fs.readFileSync(coachPanelPath, 'utf8')

function functionSlice(name) {
  const start = source.indexOf(`export function ${name}`)
  if (start < 0) throw new Error(`Could not locate ${name} in CoachDashboardPhase2.jsx.`)
  const next = source.indexOf('\nexport function ', start + 1)
  return { start, end: next < 0 ? source.length : next, text: source.slice(start, next < 0 ? source.length : next) }
}

function replaceFunction(name, transform) {
  const block = functionSlice(name)
  const next = transform(block.text)
  if (next === block.text) return
  source = `${source.slice(0, block.start)}${next}${source.slice(block.end)}`
}

// Coach Leaderboards now owns truthful natural-length ranking geometry. Preserve the
// top-three mobile ranking cut without fabricating visual parity rows or empty slots.
replaceFunction('CoachLeaderboardOperationalPanel', (block) => {
  let next = block
  if (!next.includes('data-testid="coach-leaderboard-operational-results"')) {
    throw new Error('Could not locate Coach leaderboard result surface.')
  }

  if (/\{rows\.map\(\(row\)\s*=>\s*\(/.test(next)) {
    next = next.replace(/\{rows\.map\(\(row\)\s*=>\s*\(/, '{rows.slice(0,3).map((row) => (')
  }

  if (!/rows\.slice\(0,\s*3\)\.map\(\(row\)/.test(next)) {
    throw new Error('Coach leaderboard must retain the source-owned top-three ranking cut.')
  }
  if (/Open rank|data-leaderboard-placeholder|data-parity-empty-slot/.test(next)) {
    throw new Error('Coach leaderboard parity must not fabricate ranking positions.')
  }
  if (!/No leaderboard players match the selected view\./.test(next)) {
    throw new Error('Coach leaderboard must retain its semantic empty state.')
  }

  return next
})

const populatedActivityPlaceholders = `          {Array.from({ length: Math.max(0, 6 - rows.length) }, (_, index) => (
            <div className={styles.activityRow} data-activity-placeholder="true" key={"coach-open-activity-" + index}>
              <div><strong>Open activity slot</strong><span>New team activity will appear here.</span></div>
              <time>—</time>
            </div>
          ))}`

const emptyActivityNode = `        <div className={styles.activityList} data-testid="coach-activity-intelligence-results" data-parity-slot-count="6">
          {Array.from({ length: 6 }, (_, index) => (
            <div className={styles.activityRow} data-activity-placeholder="true" key={"coach-open-activity-empty-" + index}>
              <div><strong>Open activity slot</strong><span>New team activity will appear here.</span></div>
              <time>—</time>
            </div>
          ))}
        </div>`

replaceFunction('CoachActivityIntelligencePanel', (block) => {
  let next = block
  if (!next.includes('data-testid="coach-activity-intelligence-results"')) {
    throw new Error('Could not locate Coach activity result surface.')
  }

  next = next.replace(/rows\.slice\(0,\s*12\)/g, 'rows.slice(0, 6)')

  if (!next.includes('data-parity-slot-count="6"')) {
    next = next.replace(
      'className={styles.activityList} data-testid="coach-activity-intelligence-results"',
      'className={styles.activityList} data-testid="coach-activity-intelligence-results" data-parity-slot-count="6"',
    )
  }

  if (!next.includes('coach-open-activity-')) {
    const populatedClosePattern = /(\s*\)\)\}\s*\n)(\s*<\/div>)/
    if (!populatedClosePattern.test(next)) throw new Error('Could not locate Coach activity populated-list close boundary.')
    next = next.replace(populatedClosePattern, `$1${populatedActivityPlaceholders}\n$2`)
  }

  const semanticEmptyPattern = /<div data-testid="coach-activity-intelligence-results">\s*<EmptyState(?:\s+[^>]*)?>No team activity matches the selected view\.<\/EmptyState>\s*<\/div>/
  if (semanticEmptyPattern.test(next)) next = next.replace(semanticEmptyPattern, emptyActivityNode)

  return next
})

fs.writeFileSync(coachPanelPath, source)
console.log('Applied truthful Coach leaderboard geometry and retained activity mobile parity slots.')