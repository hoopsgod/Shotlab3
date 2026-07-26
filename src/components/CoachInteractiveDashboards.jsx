import {
  DashboardCommandBar,
  DashboardFilterRail,
  DashboardInsightCard,
  DashboardInsightGrid,
  DashboardProgress,
  InteractiveMetricStrip,
} from "./CoachDashboardPrimitives.jsx";

const firstNames = (rows = [], limit = 3) => rows.slice(0, limit).map((row) => String(row.name || "Player").split(" ")[0]).join(", ");

export function CoachPlayersInteractiveDashboard({
  metrics,
  rows = [],
  filter,
  query,
  onFilterChange,
  onQueryChange,
  onAddPlayer,
  onOpenArchives,
}) {
  const attentionRows = rows.filter((row) => row.statusKey !== "active");
  const activeRate = metrics.total ? Math.round((metrics.active / metrics.total) * 100) : 0;
  const leader = metrics.leader;
  const metricItems = [
    { key: "all", label: "Roster", value: metrics.total, detail: "Active team players" },
    { key: "active", label: "Active This Week", value: metrics.active, detail: `${activeRate}% of roster`, tone: "positive" },
    { key: "attention", label: "Needs Attention", value: metrics.attention, detail: "No current-week activity", tone: "attention" },
    { key: "leaders", label: "Weekly Makes", value: metrics.weeklyMakes, detail: `${metrics.weeklyActions} logged actions`, tone: "info" },
  ];
  return (
    <div data-testid="coach-players-interactive-dashboard">
      <DashboardCommandBar
        eyebrow="Roster intelligence"
        title="Players Dashboard"
        summary="Search, segment, and act on player engagement without leaving the roster workspace."
        status={`${metrics.active}/${metrics.total || 0} active`}
        actions={[
          { key: "add", label: "Add Player", onClick: onAddPlayer },
          { key: "archives", label: "Season Tools", onClick: onOpenArchives },
        ]}
        testId="coach-players-command-bar"
      />
      <InteractiveMetricStrip items={metricItems} activeKey={filter} onSelect={onFilterChange} testId="coach-players-metric-strip" />
      <DashboardFilterRail
        searchValue={query}
        onSearchChange={onQueryChange}
        searchPlaceholder="Search player name or email"
        filters={[
          { key: "all", label: "All", count: metrics.total },
          { key: "active", label: "Active", count: metrics.active },
          { key: "attention", label: "Attention", count: metrics.attention },
          { key: "new", label: "No Activity", count: rows.filter((row) => row.statusKey === "new").length },
          { key: "leaders", label: "Top Engagement", count: Math.min(metrics.total, 5) },
        ]}
        activeFilter={filter}
        onFilterChange={onFilterChange}
        testId="coach-players-filter-rail"
      />
      <DashboardInsightGrid testId="coach-players-insight-grid">
        <DashboardInsightCard
          eyebrow="Immediate follow-up"
          title={attentionRows.length ? `${attentionRows.length} players need a touchpoint` : "Roster engagement is current"}
          body={attentionRows.length ? `${firstNames(attentionRows)}${attentionRows.length > 3 ? ` and ${attentionRows.length - 3} more` : ""} have no activity recorded this week.` : "Every rostered player has current-week activity."}
          tone={attentionRows.length ? "attention" : "positive"}
          action={{ label: attentionRows.length ? "Show Players" : "View Active", onClick: () => onFilterChange(attentionRows.length ? "attention" : "active") }}
        />
        <DashboardInsightCard
          eyebrow="Engagement leader"
          title={leader ? leader.name : "No leader yet"}
          body={leader ? `${leader.weeklyMakes} weekly makes and ${leader.weeklyActivityCount} logged actions currently set the pace.` : "Player activity will surface here after the first workout is logged."}
          tone="positive"
          action={leader ? { label: "Open Top Five", onClick: () => onFilterChange("leaders") } : undefined}
        />
        <DashboardInsightCard
          eyebrow="Team pulse"
          title={`${activeRate}% active this week`}
          body="Use this as the primary roster health signal. A falling rate should trigger individual follow-up before adding more programming."
          tone="info"
        >
          <DashboardProgress value={metrics.active} max={metrics.total || 1} label="Weekly roster activation" detail={`${metrics.active} of ${metrics.total}`} />
        </DashboardInsightCard>
      </DashboardInsightGrid>
    </div>
  );
}

export function CoachEventsInteractiveDashboard({
  metrics,
  rows = [],
  status,
  type,
  query,
  onStatusChange,
  onTypeChange,
  onQueryChange,
  onCreateEvent,
  onOpenEvent,
}) {
  const next = metrics.next;
  const gapEvents = rows.filter((row) => row.needsResponse);
  const metricItems = [
    { key: "upcoming", label: "Upcoming", value: metrics.upcoming, detail: next ? `Next: ${next.date}` : "No event scheduled", tone: "info" },
    { key: "gaps", label: "Missing RSVPs", value: metrics.missing, detail: `${gapEvents.length} affected events`, tone: "attention" },
    { key: "all", label: "Response Rate", value: `${metrics.responseRate}%`, detail: `${metrics.confirmed} confirmations`, tone: "positive" },
    { key: "past", label: "Completed", value: metrics.past, detail: `${metrics.total} total events` },
  ];
  return (
    <div data-testid="coach-events-interactive-dashboard">
      <DashboardCommandBar
        eyebrow="Schedule intelligence"
        title="Events Dashboard"
        summary="Manage the team calendar, expose attendance gaps, and move directly from insight to action."
        status={next ? `${next.date} · ${next.time}` : "No upcoming event"}
        actions={[{ key: "create", label: "Create Event", onClick: onCreateEvent }]}
        testId="coach-events-command-bar"
      />
      <InteractiveMetricStrip items={metricItems} activeKey={status} onSelect={onStatusChange} testId="coach-events-metric-strip" />
      <DashboardFilterRail
        searchValue={query}
        onSearchChange={onQueryChange}
        searchPlaceholder="Search title, location, or type"
        filters={[
          { key: "all", label: "All Types", count: rows.length },
          { key: "run", label: "Practice" },
          { key: "game", label: "Game" },
          { key: "clinic", label: "Camp" },
          { key: "recovery", label: "Meeting" },
        ]}
        activeFilter={type}
        onFilterChange={onTypeChange}
        testId="coach-events-filter-rail"
      />
      <DashboardInsightGrid testId="coach-events-insight-grid">
        <DashboardInsightCard
          eyebrow="Next team moment"
          title={next ? next.title : "Calendar is open"}
          body={next ? `${next.date} at ${next.time} · ${next.location}. ${next.confirmed} confirmed and ${next.missing} still missing.` : "Create the next event to begin attendance tracking and player communication."}
          tone="info"
          action={next ? { label: "Manage Attendance", onClick: () => onOpenEvent(next.event.id) } : { label: "Create Event", onClick: onCreateEvent }}
        />
        <DashboardInsightCard
          eyebrow="Attendance risk"
          title={metrics.missing ? `${metrics.missing} unresolved responses` : "No RSVP gaps"}
          body={metrics.missing ? `${gapEvents.length} upcoming ${gapEvents.length === 1 ? "event has" : "events have"} players who have not confirmed.` : "Every currently scheduled event has complete roster responses."}
          tone={metrics.missing ? "attention" : "positive"}
          action={{ label: metrics.missing ? "Show Gaps" : "Show Upcoming", onClick: () => onStatusChange(metrics.missing ? "gaps" : "upcoming") }}
        />
        <DashboardInsightCard
          eyebrow="Response health"
          title={`${metrics.responseRate}% average response`}
          body="This measures roster confirmation across upcoming events and should be treated as the schedule-readiness signal."
          tone="positive"
        >
          <DashboardProgress value={metrics.responseRate} max={100} label="Upcoming RSVP completion" />
        </DashboardInsightCard>
      </DashboardInsightGrid>
    </div>
  );
}

export function CoachPageDashboardHeader({
  eyebrow,
  title,
  summary,
  status,
  actions = [],
  metrics = [],
  activeMetric,
  onMetricSelect,
  testId,
}) {
  return (
    <div data-testid={testId}>
      <DashboardCommandBar eyebrow={eyebrow} title={title} summary={summary} status={status} actions={actions} />
      {metrics.length ? <InteractiveMetricStrip items={metrics} activeKey={activeMetric} onSelect={onMetricSelect} /> : null}
    </div>
  );
}
