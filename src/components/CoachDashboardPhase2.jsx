import {
  DashboardDetailDrawer,
  DashboardFilterRail,
  DashboardInsightCard,
  DashboardInsightGrid,
  DashboardProgress,
  DashboardSection,
} from "./CoachDashboardPrimitives.jsx";
import styles from "./CoachDashboardPhase2.module.css";
import "./Phase2PremiumEmptyStateLanguage.css";

const formatDelta = (value) => {
  const number = Number(value) || 0;
  if (number > 0) return `+${number}`;
  return String(number);
};

function EmptyState({ children, label = "Current state", tone = "neutral", kind = "status" }) {
  return (
    <div className={styles.emptyState} data-phase2-empty-state data-phase2-empty-tone={tone} data-phase2-empty-kind={kind}>
      <span className="phase2-empty-state-label">{label}</span>
      <span className="phase2-empty-state-message">{children}</span>
    </div>
  );
}

function MetricGrid({ items = [] }) {
  return (
    <div className={styles.drawerMetrics}>
      {items.map((item) => (
        <div className={styles.drawerMetric} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function CoachPlayerIntelligenceDrawer({ model, onClose, onOpenFullProfile, onShowActivity }) {
  return (
    <DashboardDetailDrawer
      open={Boolean(model)}
      onClose={onClose}
      eyebrow="Player intelligence"
      title={model?.name || "Player"}
      meta={model ? (model.lastActivityDate ? `${model.statusLabel} · ${model.lastActivityDate}` : model.statusLabel === "No activity yet" ? "New roster profile · Awaiting first logged session" : `${model.statusLabel} · Awaiting first logged session`) : ""}
      testId="coach-player-intelligence-drawer"
    >
      {model ? (
        <>
          <MetricGrid items={[
            { label: "Weekly makes", value: model.weeklyMakes },
            { label: "Weekly actions", value: model.weeklyActions },
            { label: "Event readiness", value: `${model.attendanceRate}%` },
            { label: "S&C completion", value: `${model.scCompletionRate}%` },
          ]} />
          <div className={styles.drawerActions}>
            <button type="button" className={styles.drawerAction} onClick={onOpenFullProfile}>Open Full Profile</button>
            <button type="button" className={`${styles.drawerAction} ${styles.drawerActionSecondary}`} onClick={onShowActivity}>Show Activity</button>
          </div>
          <DashboardSection eyebrow="Current week" title="Development pulse" summary="A decision-ready summary of volume, attendance, and training compliance." compact>
            <DashboardProgress value={model.attendanceRate} max={100} label="Event readiness" detail={`${model.attendanceConfirmed} of ${model.attendancePossible}`} />
            <div style={{ height: 10 }} />
            <DashboardProgress value={model.scCompletionRate} max={100} label="S&C completion" detail={`${model.scCompleted} of ${model.scCommitted}`} />
            <div className={styles.compactMetricGrid}>
              <div className={styles.compactMetric}><span>Prior actions</span><strong>{model.previousWeeklyActions}</strong></div>
              <div className={styles.compactMetric}><span>Action trend</span><strong className={model.trendDelta >= 0 ? styles.deltaPositive : styles.deltaNegative}>{formatDelta(model.trendDelta)}</strong></div>
              <div className={styles.compactMetric}><span>Total makes</span><strong>{model.totalMakes}</strong></div>
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Recent work" title="Activity timeline" summary="Most recent shooting, drill, and S&C records." compact>
            {model.recentActivity.length ? (
              <div className={styles.activityList}>
                {model.recentActivity.map((item) => (
                  <div className={styles.activityRow} key={item.id}>
                    <div><strong>{item.type}</strong><span>{item.value}</span></div>
                    <time>{item.date}</time>
                  </div>
                ))}
              </div>
            ) : <EmptyState label="Activity status" kind="activity">No player activity recorded yet.</EmptyState>}
          </DashboardSection>
        </>
      ) : null}
    </DashboardDetailDrawer>
  );
}

export function CoachEventIntelligenceDrawer({ model, onClose, onManageAttendance, onOpenSchedule }) {
  return (
    <DashboardDetailDrawer
      open={Boolean(model)}
      onClose={onClose}
      eyebrow="Event intelligence"
      title={model?.title || "Team Event"}
      meta={model ? `${model.date} · ${model.time} · ${model.location}` : ""}
      testId="coach-event-intelligence-drawer"
    >
      {model ? (
        <>
          <MetricGrid items={[
            { label: "Confirmed", value: model.confirmed.length },
            { label: "Missing", value: model.missing.length },
            { label: "Response rate", value: `${model.responseRate}%` },
            { label: "Walk-ins", value: model.walkIns.length },
          ]} />
          <div className={styles.drawerActions}>
            <button type="button" className={styles.drawerAction} onClick={onManageAttendance}>Manage Attendance</button>
            <button type="button" className={`${styles.drawerAction} ${styles.drawerActionSecondary}`} onClick={onOpenSchedule}>Open Schedule</button>
          </div>
          <DashboardSection eyebrow="Readiness" title="Attendance response" summary={model.description} compact>
            <DashboardProgress value={model.responseRate} max={100} label="Roster response" detail={`${model.confirmed.length} confirmed`} />
          </DashboardSection>
          <DashboardSection eyebrow="Confirmed" title="Available players" summary="Players currently attached to this event." compact>
            {model.confirmed.length ? <div className={styles.personList}>{model.confirmed.map((player) => <div className={styles.personRow} key={player.email || player.id || player.name}><div><strong>{player.name || player.email}</strong><span>{player.email || "Roster player"}</span></div><em>Ready</em></div>)}</div> : <EmptyState label="Response status" kind="attendance">No confirmed players yet.</EmptyState>}
          </DashboardSection>
          <DashboardSection eyebrow="Follow-up" title="Missing responses" summary="Players who still need an RSVP touchpoint." compact>
            {model.missing.length ? <div className={styles.personList}>{model.missing.map((player) => <div className={styles.personRow} key={player.email || player.id || player.name}><div><strong>{player.name || player.email}</strong><span>{player.email || "Roster player"}</span></div><em>Follow up</em></div>)}</div> : <EmptyState label="Follow-up cleared" tone="positive" kind="complete">Every rostered player has responded.</EmptyState>}
          </DashboardSection>
        </>
      ) : null}
    </DashboardDetailDrawer>
  );
}

export function CoachDrillsOperationalPanel({ rows = [], scope, query, onScopeChange, onQueryChange, onOpenDrill }) {
  const active = rows.filter((row) => row.statusKey === "active").length;
  const underused = rows.filter((row) => row.statusKey !== "active").length;
  const attempts = rows.reduce((total, row) => total + row.attempts, 0);
  return (
    <div className={styles.phasePanel} data-testid="coach-drills-operational-panel">
      <DashboardFilterRail
        searchValue={query}
        onSearchChange={onQueryChange}
        searchPlaceholder="Search drill name or description"
        filters={[
          { key: "all", label: "All", count: rows.length },
          { key: "home", label: "At Home" },
          { key: "program", label: "Program" },
          { key: "underused", label: "Underused", count: underused },
        ]}
        activeFilter={scope}
        onFilterChange={onScopeChange}
        testId="coach-drills-operational-filters"
      />
      <DashboardInsightGrid>
        <DashboardInsightCard eyebrow="Usage" title={`${attempts} logged attempts`} body={`${active} drills have established usage and ${underused} still need adoption.`} tone="info" />
        <DashboardInsightCard eyebrow="Programming risk" title={underused ? `${underused} underused drills` : "Library is active"} body={underused ? "Consider simplifying the library or assigning the lowest-use drills directly." : "Every drill has enough activity to support comparison."} tone={underused ? "attention" : "positive"} action={underused ? { label: "Show Underused", onClick: () => onScopeChange("underused") } : undefined} />
        <DashboardInsightCard eyebrow="Most used" title={rows[0]?.name || "No usage yet"} body={rows[0] ? `${rows[0].attempts} attempts · ${rows[0].average} average · ${rows[0].best} best.` : "The first logged drill will become the usage leader."} tone="positive" action={rows[0] && onOpenDrill ? { label: "Open Drill", onClick: () => onOpenDrill(rows[0].drill) } : undefined} />
      </DashboardInsightGrid>
    </div>
  );
}

export function CoachStrengthOperationalPanel({ rows = [], scope, query, onScopeChange, onQueryChange, onOpenSession }) {
  const overdue = rows.filter((row) => row.statusKey === "overdue");
  const completed = rows.filter((row) => row.statusKey === "completed").length;
  const commitments = rows.reduce((total, row) => total + row.commitments, 0);
  const completions = rows.reduce((total, row) => total + row.completions, 0);
  const rate = commitments ? Math.round((completions / commitments) * 100) : 0;
  return (
    <div className={styles.phasePanel} data-testid="coach-strength-operational-panel">
      <DashboardFilterRail
        searchValue={query}
        onSearchChange={onQueryChange}
        searchPlaceholder="Search S&C session, location, or date"
        filters={[
          { key: "all", label: "All", count: rows.length },
          { key: "upcoming", label: "Upcoming" },
          { key: "completed", label: "Completed", count: completed },
          { key: "overdue", label: "Overdue", count: overdue.length },
        ]}
        activeFilter={scope}
        onFilterChange={onScopeChange}
        testId="coach-strength-operational-filters"
      />
      <details
        className="coachStrengthSupportingIntelligence"
        data-testid="coach-strength-supporting-intelligence"
        open={typeof window !== "undefined" && window.innerWidth > 760}
      >
        <summary className="coachStrengthSupportingSummary">
          <span className="coachStrengthSupportingSummaryCopy">
            <span>Compliance insights</span>
            <strong>Readiness & follow-up</strong>
            <small>{rate}% completion · {overdue.length} overdue</small>
          </span>
          <span className="coachStrengthSupportingChevron" aria-hidden="true">›</span>
        </summary>
        <div className="coachStrengthSupportingBody" data-testid="coach-strength-insight-grid">
          <DashboardInsightGrid>
            <DashboardInsightCard eyebrow="Team compliance" title={`${rate}% completion`} body={`${completions} completed logs from ${commitments} committed session responses.`} tone={rate >= 75 ? "positive" : "attention"}><DashboardProgress value={rate} max={100} label="S&C compliance" /></DashboardInsightCard>
            <DashboardInsightCard eyebrow="Overdue work" title={overdue.length ? `${overdue.length} sessions need follow-up` : "No overdue sessions"} body={overdue.length ? "Open the overdue view to identify committed players without a completion log." : "Current commitments and completion records are aligned."} tone={overdue.length ? "attention" : "positive"} action={overdue.length ? { label: "Show Overdue", onClick: () => onScopeChange("overdue") } : undefined} />
            <DashboardInsightCard eyebrow="Next session" title={rows.find((row) => row.statusKey === "upcoming")?.title || "No upcoming session"} body={rows.find((row) => row.statusKey === "upcoming") ? `${rows.find((row) => row.statusKey === "upcoming").date} · ${rows.find((row) => row.statusKey === "upcoming").time}` : "Add the next S&C session to restore the compliance cadence."} tone="info" action={rows.find((row) => row.statusKey === "upcoming") && onOpenSession ? { label: "Open Session", onClick: () => onOpenSession(rows.find((row) => row.statusKey === "upcoming").session) } : undefined} />
          </DashboardInsightGrid>
        </div>
      </details>
    </div>
  );
}

export function CoachLeaderboardOperationalPanel({ rows = [], scope, query, onScopeChange, onQueryChange, onOpenPlayer }) {
  const risers = rows.filter((row) => row.improvement > 0).length;
  const weeklyLeader = [...rows].sort((a, b) => b.weekly - a.weekly || a.rank - b.rank)[0];
  const activeThisWeek = rows.filter((row) => row.weekly > 0).length;
  return (
    <div className={styles.phasePanel} data-testid="coach-leaderboard-operational-panel">
      <section className="coachLeaderboardPulse" data-testid="coach-leaderboard-pulse" aria-label="Leaderboard performance pulse">
        <div className="coachLeaderboardPulseCopy">
          <span>This week</span>
          <strong>{weeklyLeader?.weekly > 0 ? weeklyLeader.name : "The weekly race is open"}</strong>
          <small>{weeklyLeader?.weekly > 0 ? weeklyLeader.weekly + " verified makes this week · " + activeThisWeek + " active" : "New verified activity will establish the weekly pace."}</small>
        </div>
        <div className="coachLeaderboardPulseMetrics">
          <div>
            <span>Risers</span>
            <strong>{risers}</strong>
            <small>{risers === 1 ? "player moving up" : "players moving up"}</small>
          </div>
          <div>
            <span>Ranked</span>
            <strong>{rows.length}</strong>
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
        </div>
      ) : <EmptyState label="Filtered view" kind="filter">No leaderboard players match the selected view.</EmptyState>}
    </div>
  );
}

export function CoachActivityIntelligencePanel({ rows = [], scope, query, onScopeChange, onQueryChange, onOpenItem }) {
  return (
    <div className={styles.phasePanel} data-testid="coach-activity-intelligence-panel">
      <div className={styles.phasePanelHeader}><div><div className={styles.phaseEyebrow}>Team intelligence</div><h3>Activity control center</h3><p>Filter the team stream by meaningful operational category instead of scanning one undifferentiated feed.</p></div></div>
      <DashboardFilterRail
        searchValue={query}
        onSearchChange={onQueryChange}
        searchPlaceholder="Search player or activity"
        filters={[
          { key: "all", label: "All", count: rows.length },
          { key: "shooting", label: "Shooting" },
          { key: "score", label: "Drill Scores" },
          { key: "strength", label: "S&C" },
          { key: "event", label: "Events" },
        ]}
        activeFilter={scope}
        onFilterChange={onScopeChange}
        testId="coach-activity-intelligence-filters"
      />
      {rows.length ? (
        <div className={styles.activityList} data-testid="coach-activity-intelligence-results" data-parity-slot-count="6">
          {rows.slice(0, 6).map((row) => (
            <button type="button" className={styles.activityRow} key={row.id} onClick={() => onOpenItem?.(row)}>
              <div><strong>{row.title}</strong><span>{row.type.toUpperCase()} · {row.detail}</span></div>
              <time>{row.date}</time>
            </button>
          ))}
          {Array.from({ length: Math.max(0, 6 - rows.length) }, (_, index) => (
            <div className={styles.activityRow} data-activity-placeholder="true" key={"coach-open-activity-" + index}>
              <div><strong>Open activity slot</strong><span>New team activity will appear here.</span></div>
              <time>—</time>
            </div>
          ))}
        </div>
      ) : (
                <div className={styles.activityList} data-testid="coach-activity-intelligence-results" data-parity-slot-count="6">
          {Array.from({ length: 6 }, (_, index) => (
            <div className={styles.activityRow} data-activity-placeholder="true" key={"coach-open-activity-empty-" + index}>
              <div><strong>Open activity slot</strong><span>New team activity will appear here.</span></div>
              <time>—</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CoachSeasonComparisonPanel({ model, selectedArchiveId, onArchiveChange, onOpenArchive }) {
  const selected = model?.selected;
  return (
    <div className={styles.phasePanel} data-testid="coach-season-comparison-panel">
      <div className={styles.phasePanelHeader}><div><div className={styles.phaseEyebrow}>Historical intelligence</div><h3>Season comparison</h3><p>Compare the active team against one archived season without leaving roster operations.</p></div></div>
      {model?.archives?.length ? (
        <>
          <label>
            <span className={styles.phaseEyebrow}>Comparison season</span>
            <select className={styles.archiveSelect} value={selectedArchiveId || selected?.id || ""} onChange={(event) => onArchiveChange?.(event.target.value)}>
              {model.archives.map((archive) => <option key={archive.id} value={archive.id}>{archive.seasonName || "Archived season"}</option>)}
            </select>
          </label>
          <div className={styles.comparisonList} style={{ marginTop: 10 }}>
            {model.metrics.map((metric) => (
              <div className={styles.comparisonRow} key={metric.key}>
                <div><strong>{metric.label}</strong><span>Current {metric.current} · {selected?.seasonName || "Previous"} {metric.previous}</span></div>
                <em className={metric.delta > 0 ? styles.deltaPositive : metric.delta < 0 ? styles.deltaNegative : styles.deltaNeutral}>{formatDelta(metric.delta)}</em>
              </div>
            ))}
          </div>
          {onOpenArchive ? <div className={styles.drawerActions} style={{ marginTop: 10, marginBottom: 0 }}><button type="button" className={`${styles.drawerAction} ${styles.drawerActionSecondary}`} onClick={() => onOpenArchive(selected?.id)}>Open Archived Season</button></div> : null}
        </>
      ) : <EmptyState label="Season history" kind="history">Create the first season archive to unlock current-versus-previous comparisons.</EmptyState>}
    </div>
  );
}
