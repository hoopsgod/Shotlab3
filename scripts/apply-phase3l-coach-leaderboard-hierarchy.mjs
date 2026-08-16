import { readFileSync, writeFileSync } from 'node:fs';

let changed = false;

const panelPath = 'src/components/CoachDashboardPhase2.jsx';
let source = readFileSync(panelPath, 'utf8');
const panelMarker = 'data-testid="coach-leaderboard-pulse"';

if (!source.includes(panelMarker)) {
  const oldBlock = `export function CoachLeaderboardOperationalPanel({ rows = [], scope, query, onScopeChange, onQueryChange, onOpenPlayer }) {
  const risers = rows.filter((row) => row.improvement > 0).length;
  return (
    <div className={styles.phasePanel} data-testid="coach-leaderboard-operational-panel">
      <DashboardFilterRail
        searchValue={query}
        onSearchChange={onQueryChange}
        searchPlaceholder="Search ranked player"
        filters={[
          { key: "all", label: "All", count: rows.length },
          { key: "top", label: "Top Five" },
          { key: "weekly", label: "This Week" },
          { key: "risers", label: "Most Improved", count: risers },
        ]}
        activeFilter={scope}
        onFilterChange={onScopeChange}
        testId="coach-leaderboard-operational-filters"
      />
      {rows.length ? (
        <div className={styles.operationalList} data-testid="coach-leaderboard-operational-results">
          {rows.map((row) => (
            <button type="button" className={styles.operationalRow} key={row.key} onClick={() => onOpenPlayer?.(row.row)}>
              <div><strong>#{row.rank} {row.name}</strong><span>{row.total} total · {row.weekly} this week · last active {row.lastActivity || "unknown"}</span></div>
              <em className={row.improvement > 0 ? styles.deltaPositive : row.improvement < 0 ? styles.deltaNegative : styles.deltaNeutral}>{formatDelta(row.improvement)}</em>
            </button>
          ))}
        </div>
      ) : <EmptyState>No leaderboard players match the selected view.</EmptyState>}
    </div>
  );
}`;

  const occurrences = source.split(oldBlock).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Phase 3L expected exactly one Coach leaderboard panel anchor, found ${occurrences}.`);
  }

  const newBlock = `export function CoachLeaderboardOperationalPanel({ rows = [], scope, query, onScopeChange, onQueryChange, onOpenPlayer }) {
  const risers = rows.filter((row) => row.improvement > 0).length;
  const overallLeader = [...rows].sort((a, b) => a.rank - b.rank)[0];
  const weeklyLeader = [...rows].sort((a, b) => b.weekly - a.weekly || a.rank - b.rank)[0];
  const activeThisWeek = rows.filter((row) => row.weekly > 0).length;
  return (
    <div className={styles.phasePanel} data-testid="coach-leaderboard-operational-panel">
      <section className="coachLeaderboardPulse" data-testid="coach-leaderboard-pulse" aria-label="Leaderboard performance pulse">
        <div className="coachLeaderboardPulseCopy">
          <span>Competitive pulse</span>
          <strong>{overallLeader?.name || "Waiting on first ranking"}</strong>
          <small>{overallLeader ? "#" + overallLeader.rank + " overall · " + overallLeader.total + " total" : "Rankings will appear after players log work."}</small>
        </div>
        <div className="coachLeaderboardPulseMetrics">
          <div>
            <span>Weekly leader</span>
            <strong>{weeklyLeader?.name || "—"}</strong>
            <small>{weeklyLeader ? weeklyLeader.weekly + " this week" : "No weekly makes"}</small>
          </div>
          <div>
            <span>Risers</span>
            <strong>{risers}</strong>
            <small>{activeThisWeek} active this week</small>
          </div>
        </div>
      </section>
      <DashboardFilterRail
        searchValue={query}
        onSearchChange={onQueryChange}
        searchPlaceholder="Search ranked player"
        filters={[
          { key: "all", label: "All", count: rows.length },
          { key: "top", label: "Top Five" },
          { key: "weekly", label: "This Week" },
          { key: "risers", label: "Most Improved", count: risers },
        ]}
        activeFilter={scope}
        onFilterChange={onScopeChange}
        testId="coach-leaderboard-operational-filters"
      />
      {rows.length ? (
        <div className={styles.operationalList} data-testid="coach-leaderboard-operational-results">
          {rows.slice(0,3).map((row) => (
            <button
              type="button"
              className={styles.operationalRow + " coachLeaderboardRow"}
              data-rank={row.rank}
              data-trend={row.improvement > 0 ? "up" : row.improvement < 0 ? "down" : "flat"}
              key={row.key}
              onClick={() => onOpenPlayer?.(row.row)}
            >
              <span className="coachLeaderboardRank" aria-hidden="true">#{row.rank}</span>
              <div className="coachLeaderboardRowCopy">
                <strong>{row.name}</strong>
                <span>{row.total} total · last active {row.lastActivity || "unknown"}</span>
              </div>
              <span className="coachLeaderboardWeek">
                <small>This week</small>
                <strong>{row.weekly}</strong>
                <em className={row.improvement > 0 ? styles.deltaPositive : row.improvement < 0 ? styles.deltaNegative : styles.deltaNeutral}>{formatDelta(row.improvement)}</em>
              </span>
            </button>
          ))}
          {Array.from({ length: Math.max(0, 3 - rows.length) }, (_, index) => (
            <div className={styles.operationalRow + " coachLeaderboardRow"} data-leaderboard-placeholder="true" key={"coach-open-rank-live-" + index}>
              <span className="coachLeaderboardRank" aria-hidden="true">—</span>
              <div className="coachLeaderboardRowCopy"><strong>Open rank</strong><span>Player activity will fill this ranking position.</span></div>
              <span className="coachLeaderboardWeek"><small>This week</small><strong>—</strong><em className={styles.deltaNeutral}>—</em></span>
            </div>
          ))}
        </div>
      ) : <EmptyState>No leaderboard players match the selected view.</EmptyState>}
    </div>
  );
}`;

  source = source.replace(oldBlock, newBlock);
  writeFileSync(panelPath, source);
  changed = true;
} else {
  console.log('Phase 3L Coach leaderboard hierarchy already applied.');
}

const followUpPath = 'src/lib/coachFollowUpEnhancer.js';
let followUpSource = readFileSync(followUpPath, 'utf8');
const placementMarker = `const body = dialog.querySelector('[data-visual-role="dashboard-section"]')?.parentElement;`;

if (!followUpSource.includes(placementMarker)) {
  const directPlacement = `    host = document.createElement("div");
    host.dataset.testid = HOST_TEST_ID;
    dialog.appendChild(host);`;
  const legacyScrollPlacement = `    const drawerBody = dialog.querySelector('[class*="drawerBody"]') || dialog;
    host = document.createElement("div");
    host.dataset.testid = HOST_TEST_ID;
    drawerBody.appendChild(host);`;
  const desiredPlacement = `    const body = dialog.querySelector('[data-visual-role="dashboard-section"]')?.parentElement;
    if (!body || body === dialog) return;
    host = document.createElement("div");
    host.dataset.testid = HOST_TEST_ID;
    body.appendChild(host);`;

  const directOccurrences = followUpSource.split(directPlacement).length - 1;
  const legacyOccurrences = followUpSource.split(legacyScrollPlacement).length - 1;
  if (directOccurrences + legacyOccurrences !== 1) {
    throw new Error(`Phase 3L expected exactly one Coach follow-up drawer placement anchor, found ${directOccurrences + legacyOccurrences}.`);
  }
  followUpSource = directOccurrences === 1
    ? followUpSource.replace(directPlacement, desiredPlacement)
    : followUpSource.replace(legacyScrollPlacement, desiredPlacement);
  writeFileSync(followUpPath, followUpSource);
  changed = true;
} else {
  console.log('Phase 3L Coach follow-up placement already applied.');
}

if (changed) console.log('Applied Phase 3L Coach leaderboard hierarchy and player-intelligence workflow placement.');
