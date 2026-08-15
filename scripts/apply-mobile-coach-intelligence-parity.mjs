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

const populatedPlaceholders = `          {Array.from({ length: Math.max(0, 3 - rows.length) }, (_, index) => (
            <div className={styles.operationalRow + " coachLeaderboardRow"} data-leaderboard-placeholder="true" key={"coach-open-rank-live-" + index}>
              <span className="coachLeaderboardRank" aria-hidden="true">—</span>
              <div className="coachLeaderboardRowCopy"><strong>Open rank</strong><span>Player activity will fill this ranking position.</span></div>
              <span className="coachLeaderboardWeek"><small>This week</small><strong>—</strong><em className={styles.deltaNeutral}>—</em></span>
            </div>
          ))}`

const emptyLeaderboard = `(
        <div className={styles.operationalList} data-testid="coach-leaderboard-operational-results" data-parity-empty-slot="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div className={styles.operationalRow + " coachLeaderboardRow"} data-leaderboard-placeholder="true" key={"coach-open-rank-" + index}>
              <span className="coachLeaderboardRank" aria-hidden="true">—</span>
              <div className="coachLeaderboardRowCopy"><strong>Open rank</strong><span>Player activity will fill this ranking position.</span></div>
              <span className="coachLeaderboardWeek"><small>This week</small><strong>—</strong><em className={styles.deltaNeutral}>—</em></span>
            </div>
          ))}
        </div>
      )}`

replaceFunction('CoachLeaderboardOperationalPanel', (block) => {
  let next = block
  if (!next.includes('data-testid="coach-leaderboard-operational-results"')) {
    throw new Error('Could not locate Coach leaderboard result surface.')
  }

  if (!next.includes('coach-open-rank-live-')) {
    const mapPattern = /\{rows\.map\(\(row\)\s*=>\s*\(/
    if (!mapPattern.test(next)) throw new Error('Could not locate Coach leaderboard row map.')
    next = next.replace(mapPattern, '{rows.slice(0, 3).map((row) => (')

    const listClosePattern = /(\s*\)\}\s*\n\s*<\/div>\s*\n\s*\)\s*:\s*)/
    const match = next.match(listClosePattern)
    if (!match) throw new Error('Could not locate Coach leaderboard populated-list close boundary.')
    next = next.replace(listClosePattern, `${match[1].replace(/\)\s*:\s*$/, '')}${populatedPlaceholders}\n        </div>\n      ) : `)
  }

  if (!next.includes('data-parity-empty-slot="true"')) {
    const emptyPattern = /<EmptyState(?:\s+[^>]*)?>No leaderboard players match the selected view\.<\/EmptyState>\}/
    if (!emptyPattern.test(next)) throw new Error('Could not locate Coach leaderboard empty state.')
    next = next.replace(emptyPattern, `${emptyLeaderboard.slice(1)}`)
  }

  return next
})

const activityPlaceholders = `          {Array.from({ length: Math.max(0, 6 - rows.length) }, (_, index) => (
            <div className={styles.activityRow} data-activity-placeholder="true" key={"coach-open-activity-" + index}>
              <div><strong>Open activity slot</strong><span>New team activity will appear here.</span></div>
              <time>—</time>
            </div>
          ))}`

const activityEmptyParity = `        <div className={styles.activityList} data-testid="coach-activity-intelligence-results" data-parity-slot-count="6">
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
    const firstListClose = /(\s*\)\}\s*\n\s*<\/div>)/
    const match = next.match(firstListClose)
    if (!match) throw new Error('Could not locate Coach activity populated-list close boundary.')
    next = next.replace(firstListClose, `${match[1].replace(/\s*<\/div>$/, '')}\n${activityPlaceholders}\n        </div>`)
  }

  const semanticEmptyPattern = /<div data-testid="coach-activity-intelligence-results">\s*<EmptyState(?:\s+[^>]*)?>No team activity matches the selected view\.<\/EmptyState>\s*<\/div>/
  if (semanticEmptyPattern.test(next)) next = next.replace(semanticEmptyPattern, activityEmptyParity)

  return next
})

fs.writeFileSync(coachPanelPath, source)
console.log('Applied robust Coach leaderboard and activity mobile parity geometry.')
