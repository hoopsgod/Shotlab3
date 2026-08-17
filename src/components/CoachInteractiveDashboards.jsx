import {
  DashboardFilterRail,
  DashboardInsightCard,
  DashboardProgress,
} from "./CoachDashboardPrimitives.jsx";
import { ExperienceSparkline } from "./ExperiencePrimitives.jsx";
import CoachRoutePerformanceStage from "./CoachRoutePerformanceStage.jsx";
import SecondaryPageDisclosure from "./SecondaryPageDisclosure.jsx";
import {
  SecondaryPageEvidence,
  SecondaryPageIntro,
  SecondaryPageShell,
  SecondaryPageToolbar,
} from "./SecondaryPageSystem.jsx";
import {
  buildCoachEventActionBriefing,
  buildCoachPlayerActionBriefing,
  formatCoachScheduleDate,
} from "../lib/coachActionBriefings.js";

const normalizeEventsSearchSurface = (node) => {
  const input = node?.querySelector?.('input[type="search"]');
  if (!input) return;
  input.style.setProperty("border", "0", "important");
  input.style.setProperty("border-radius", "0", "important");
  input.style.setProperty("outline", "0", "important");
  input.style.setProperty("background", "transparent", "important");
  input.style.setProperty("box-shadow", "none", "important");
  input.style.setProperty("-webkit-appearance", "none", "important");
  input.style.setProperty("appearance", "none", "important");
};

const resolvePlayerAction = (action, { onFilterChange, onAddPlayer }) => {
  if (!action) return undefined;
  if (action.key === "invite") return { label: "Invite player", onClick: onAddPlayer };
  if (action.key === "review-no-team") return { label: "Review roster", onClick: () => onFilterChange?.("unassigned") };
  if (action.key === "review-risk") return { label: "Review risk", onClick: () => onFilterChange?.("risk") };
  if (action.key === "review-inactive") return { label: "Review inactive", onClick: () => onFilterChange?.("inactive") };
  return undefined;
};

const hasIdentity = (value) => Boolean(String(value || "").trim());

function CoachDashboardNoResults({ children }) {
  return <div className="coachDashboardNoResults">{children}</div>;
}

export function CoachPlayersInteractiveDashboard({
  metrics = [],
  rows = [],
  searchValue = "",
  onSearchChange,
  activeFilter = "all",
  onFilterChange,
  actionBriefing,
  onAddPlayer,
  onOpenPlayer,
}) {
  const filters = [
    { key: "all", label: "All", count: rows.length },
    { key: "risk", label: "At risk", count: rows.filter((row) => row.status === "risk").length },
    { key: "inactive", label: "Inactive", count: rows.filter((row) => row.status === "inactive").length },
    { key: "unassigned", label: "No team", count: rows.filter((row) => row.status === "unassigned").length },
  ];
  const action = resolvePlayerAction(actionBriefing, { onFilterChange, onAddPlayer });

  return (
    <SecondaryPageShell accent="players" testId="coach-players-interactive-dashboard">
      <SecondaryPageIntro
        icon="team"
        eyebrow="PLAYER DEVELOPMENT"
        title="Players"
        summary="Roster health, activity, and development signals in one decision-ready view."
        actions={onAddPlayer ? [{ label: "+ Add Player", onClick: onAddPlayer, primary: true }] : []}
        testId="coach-players-command-bar"
      />
      <CoachRoutePerformanceStage
        kind="players"
        eyebrow="TEAM STATUS"
        title={actionBriefing?.title || "Roster intelligence"}
        detail={actionBriefing?.detail || "See who needs attention and open the player behind the signal."}
        tone={actionBriefing?.tone || "info"}
        action={action}
        metrics={metrics}
        testId="coach-players-decision-brief"
      >
        <ExperienceSparkline values={rows.slice(0, 7).map((row) => Number(row.weeklyMakes) || 0)} accent="var(--team-brand-secondary, var(--accent))" />
      </CoachRoutePerformanceStage>
      <SecondaryPageToolbar testId="coach-players-toolbar">
        <DashboardFilterRail
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search players"
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          testId="coach-players-filter-rail"
        />
      </SecondaryPageToolbar>
      <div className="coachDashboardOperationalContent">
        {rows.length ? (
          <div className="coachPlayerDecisionList" data-testid="coach-players-decision-list">
            {rows.map((row) => {
              const canOpen = hasIdentity(row.playerKey) || hasIdentity(row.id) || hasIdentity(row.email);
              const Row = canOpen && onOpenPlayer ? "button" : "div";
              return (
                <Row
                  key={row.playerKey || row.id || row.email || row.name}
                  type={Row === "button" ? "button" : undefined}
                  className="coachPlayerDecisionRow"
                  data-status={row.status}
                  onClick={Row === "button" ? () => onOpenPlayer(row) : undefined}
                >
                  <div className="coachPlayerDecisionIdentity">
                    <span className="coachPlayerDecisionAvatar" aria-hidden="true">{String(row.name || "?").slice(0, 1).toUpperCase()}</span>
                    <span><strong>{row.name}</strong><small>{row.statusLabel || "Current player"}</small></span>
                  </div>
                  <div className="coachPlayerDecisionSignal"><strong>{row.weeklyMakes || 0}</strong><small>weekly makes</small></div>
                  <div className="coachPlayerDecisionSignal"><strong>{row.daysSinceActivity ?? "—"}</strong><small>days since activity</small></div>
                </Row>
              );
            })}
          </div>
        ) : <CoachDashboardNoResults>No players match this view.</CoachDashboardNoResults>}
      </div>
    </SecondaryPageShell>
  );
}

export function CoachEventsInteractiveDashboard({
  metrics = [],
  rows = [],
  searchValue = "",
  onSearchChange,
  activeFilter = "upcoming",
  onFilterChange,
  onCreateEvent,
  onOpenEvent,
}) {
  const next = rows[0];
  const filters = [
    { key: "upcoming", label: "Upcoming", count: rows.filter((row) => row.bucket === "upcoming").length },
    { key: "needs-rsvp", label: "Needs RSVP", count: rows.filter((row) => row.awaiting > 0).length },
    { key: "past", label: "Past", count: rows.filter((row) => row.bucket === "past").length },
  ];
  const actionBriefing = buildCoachEventActionBriefing(rows);

  return (
    <SecondaryPageShell accent="events" className="coachEventsPremiumWorkspace" testId="coach-events-interactive-dashboard">
      <SecondaryPageIntro
        icon="calendar"
        eyebrow="PROGRAM SCHEDULE"
        title="Schedule"
        summary="Run the week from one board — practices, games, attendance, and what needs a response."
        actions={onCreateEvent ? [{ label: "+ Create Event", onClick: onCreateEvent, primary: true }] : []}
        testId="coach-events-command-bar"
      />
      <CoachRoutePerformanceStage
        kind="schedule"
        eyebrow="NEXT UP"
        title={actionBriefing?.title || "Schedule intelligence"}
        detail={actionBriefing?.detail || "Know what is next and where attendance needs attention."}
        tone={actionBriefing?.tone || "info"}
        action={next && onOpenEvent && hasIdentity(next.id) ? { label: "View Event", onClick: () => onOpenEvent(next) } : null}
        metrics={metrics}
        testId="coach-events-decision-brief"
      >
        <ExperienceSparkline values={rows.slice(0, 7).map((row) => Number(row.confirmed) || 0)} accent="var(--semantic-info)" />
      </CoachRoutePerformanceStage>
      {rows.length ? (
        <SecondaryPageToolbar testId="coach-events-toolbar">
          <DashboardFilterRail
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search schedule"
            filters={filters}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            testId="coach-events-filter-rail"
          />
        </SecondaryPageToolbar>
      ) : null}
      <div className="coachDashboardOperationalContent">
        {rows.length ? (
          <div className="coachEventDecisionList" data-testid="coach-events-decision-list">
            {rows.map((row) => {
              const canOpen = hasIdentity(row.id);
              const Row = canOpen && onOpenEvent ? "button" : "div";
              return (
                <Row
                  key={row.id || `${row.title}-${row.date}`}
                  type={Row === "button" ? "button" : undefined}
                  className="coachEventDecisionRow"
                  onClick={Row === "button" ? () => onOpenEvent(row) : undefined}
                >
                  <div className="coachEventDecisionDate"><strong>{formatCoachScheduleDate(row.date)}</strong><small>{row.time || "Time TBD"}</small></div>
                  <div className="coachEventDecisionIdentity"><strong>{row.title}</strong><small>{row.location || "Location TBD"}</small></div>
                  <div className="coachEventDecisionSignal"><strong>{row.confirmed || 0}</strong><small>confirmed</small></div>
                  <div className="coachEventDecisionSignal"><strong>{row.awaiting || 0}</strong><small>awaiting</small></div>
                </Row>
              );
            })}
          </div>
        ) : (
          <div className="coachEventsPremiumEmptyState">
            <h2>No events on the board</h2>
            <p>Create the first program event to start building this week’s schedule.</p>
          </div>
        )}
      </div>
    </SecondaryPageShell>
  );
}

export function CoachPageDashboardHeader({
  eyebrow,
  title,
  summary,
  status,
  metrics = [],
  activeMetric,
  onMetricSelect,
  testId,
}) {
  const isLeaderboardsPage = testId === "coach-page-dashboard-leaderboards";
  const displayTitle = isLeaderboardsPage ? "Leaderboards" : title;
  const displaySummary = isLeaderboardsPage ? "Recognize the standard. See who is leading and who is rising." : summary;
  const visibleMetrics = isLeaderboardsPage ? metrics.filter((metric) => ["ranked", "leader", "archives"].includes(metric.key)) : metrics;
  const leaderMetric = isLeaderboardsPage ? visibleMetrics.find((metric) => metric.key === "leader") : null;
  const hasLeader = Boolean(leaderMetric && leaderMetric.value !== "—" && leaderMetric.value !== "0");

  return (
    <SecondaryPageShell accent={isLeaderboardsPage ? "leaderboards" : "default"} testId={testId}>
      <SecondaryPageIntro
        icon={isLeaderboardsPage ? "trophy" : "target"}
        eyebrow={isLeaderboardsPage ? "COMPETE" : eyebrow}
        title={displayTitle}
        summary={displaySummary}
        status={status}
        testId={`${testId}-command-bar`}
      />
      <CoachRoutePerformanceStage
        kind={isLeaderboardsPage ? "leaderboards" : undefined}
        eyebrow={isLeaderboardsPage ? "TEAM STANDARD" : eyebrow}
        title={isLeaderboardsPage ? (hasLeader ? `${leaderMetric.detail} sets the standard` : "Recognition begins with activity") : title}
        detail={isLeaderboardsPage ? (hasLeader ? `${leaderMetric.value} verified makes lead the current team ranking.` : "Verified team activity will establish the current ranking standard.") : summary}
        tone={isLeaderboardsPage && hasLeader ? "positive" : "info"}
        action={onMetricSelect ? { label: isLeaderboardsPage ? "Review rankings" : `Review ${visibleMetrics[0]?.label || "details"}`, onClick: () => onMetricSelect(visibleMetrics[0]?.key) } : null}
        metrics={visibleMetrics}
        activeMetric={activeMetric}
        onMetricSelect={onMetricSelect}
        testId={`${testId}-decision-brief`}
      />
    </SecondaryPageShell>
  );
}
