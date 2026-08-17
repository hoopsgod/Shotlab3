import {
  DashboardFilterRail,
  DashboardInsightCard,
  DashboardProgress,
} from "./CoachDashboardPrimitives.jsx";
import { ExperienceSparkline } from "./ExperiencePrimitives.jsx";
import CoachRoutePerformanceStage from "./CoachRoutePerformanceStage.jsx";
import CoachEventsMonthCalendar from "./CoachEventsMonthCalendar.jsx";
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
  if (action.kind === "add-player" && typeof onAddPlayer === "function") return { label: action.label, onClick: onAddPlayer };
  if (action.kind === "filter" && typeof onFilterChange === "function") return { label: action.label, onClick: () => onFilterChange(action.value) };
  return undefined;
};

const safeCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const eventTypeLabel = (value = "") => {
  const type = String(value || "").toLowerCase();
  if (type === "run" || type === "practice") return "Practice";
  if (type === "game" || type === "games") return "Game";
  if (type === "clinic" || type === "camp") return "Camp";
  if (type === "recovery" || type === "meeting" || type === "film") return "Meeting";
  if (type === "challenge") return "Challenge";
  return "Team event";
};

export function CoachPlayersInteractiveDashboard({ metrics = {}, rows = [], filter, query, onFilterChange, onQueryChange, onAddPlayer, onOpenArchives }) {
  const briefing = buildCoachPlayerActionBriefing({ metrics, rows });
  const metricItems = [
    { key: "all", label: "Roster", displayLabel: "Roster", value: briefing.total, detail: "Active team players", evidence: rows.slice(0, 8).map((row) => row.engagementScore || 0), evidenceLabel: "Roster engagement distribution" },
    { key: "active", label: "Active This Week", displayLabel: "Active", value: briefing.active, detail: `${briefing.activeRate}% of roster`, tone: "positive", evidence: rows.slice(0, 8).map((row) => row.statusKey === "active" ? 100 : row.statusKey === "attention" ? 45 : 8), evidenceLabel: "Current activity distribution" },
    { key: "attention", label: "Needs Attention", displayLabel: "Attention", value: briefing.attentionRows.length, detail: briefing.noActivityRows.length ? `${briefing.noActivityRows.length} with no activity` : "No current-week activity", tone: "attention", evidence: rows.slice(0, 8).map((row) => row.statusKey === "new" ? 100 : row.statusKey === "attention" ? 65 : 10), evidenceLabel: "Attention-risk distribution" },
    { key: "leaders", label: "Weekly Makes", displayLabel: "Weekly Makes", value: Number(metrics.weeklyMakes) || 0, detail: `${Number(metrics.weeklyActions) || 0} logged actions`, tone: "info", evidence: rows.slice(0, 8).map((row) => row.weeklyMakes || 0), evidenceLabel: "Weekly makes distribution" },
  ];

  return (
    <SecondaryPageShell testId="coach-players-interactive-dashboard">
      <SecondaryPageIntro eyebrow="Roster intelligence" title="Players" summary="See who is progressing, where engagement is slipping, and the coaching action that matters next." status={`${briefing.active}/${briefing.total || 0} active this week`} actions={[{ key: "add", label: "Add Player", onClick: onAddPlayer }, { key: "administration", label: "Team & Account", onClick: onOpenArchives }]} testId="coach-players-command-bar" />
      <CoachRoutePerformanceStage
        kind="players"
        eyebrow="Decision brief"
        title={briefing.decision.title}
        detail={briefing.decision.detail}
        tone={briefing.decision.tone}
        action={resolvePlayerAction(briefing.decision.action, { onFilterChange, onAddPlayer })}
        metrics={metricItems}
        activeMetric={filter}
        onMetricSelect={onFilterChange}
        testId="coach-players-decision-brief"
      >
        <ExperienceSparkline values={briefing.engagementDistribution} label="Engagement spread" tone={briefing.decision.tone} testId="coach-players-engagement-sparkline" />
      </CoachRoutePerformanceStage>
      <SecondaryPageToolbar testId="coach-players-toolbar">
        <DashboardFilterRail surface="light" searchValue={query} onSearchChange={onQueryChange} searchPlaceholder="Search player name or email" filters={[{ key: "all", label: "All", count: briefing.total }, { key: "active", label: "Active", count: briefing.active }, { key: "attention", label: "Attention", count: briefing.attentionRows.length }, { key: "new", label: "No Activity", count: briefing.noActivityRows.length }, { key: "leaders", label: "Top Engagement", count: Math.min(briefing.total, 5) }]} activeFilter={filter} onFilterChange={onFilterChange} testId="coach-players-filter-rail" />
      </SecondaryPageToolbar>
      <SecondaryPageEvidence testId="coach-players-insight-grid">
        {briefing.insights.map((insight) => (
          <DashboardInsightCard surface="light" key={insight.key} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} action={resolvePlayerAction(insight.action, { onFilterChange, onAddPlayer })}>
            {insight.progress ? <DashboardProgress value={insight.progress.value} max={insight.progress.max} label={insight.progress.label} detail={insight.progress.detail} /> : null}
          </DashboardInsightCard>
        ))}
      </SecondaryPageEvidence>
    </SecondaryPageShell>
  );
}

export function CoachEventsInteractiveDashboard({ metrics = {}, rows = [], status, type, query, onStatusChange, onTypeChange, onQueryChange, onCreateEvent, onOpenEvent }) {
  const briefing = buildCoachEventActionBriefing({ metrics, rows });
  const next = briefing.next;
  const nextEvent = next?.event || next;
  const nextResponded = safeCount(next?.responded ?? next?.rsvpConfirmed ?? next?.confirmed);
  const nextAwaiting = safeCount(next?.awaitingResponse ?? next?.missing);
  const nextRoster = safeCount(next?.rosterCount || (nextResponded + nextAwaiting));
  const nextMomentDetail = next
    ? `${eventTypeLabel(next.type || nextEvent?.type)} · ${formatCoachScheduleDate(next.date, { weekday: true })} · ${next.time || "TBD"} · ${next.location || "Location TBD"} · ${nextResponded} / ${nextRoster || nextResponded} responded`
    : "Create the next team event to begin RSVP tracking and player communication.";
  const nextMomentAction = next && typeof onOpenEvent === "function" && nextEvent?.id != null
    ? { label: "View Event", onClick: () => onOpenEvent(nextEvent.id) }
    : undefined;
  const metricItems = [
    { key: "upcoming", label: "Upcoming", displayLabel: "Upcoming", value: briefing.upcoming, detail: next ? `Next ${formatCoachScheduleDate(next.date)}` : "No event scheduled", tone: "info" },
    { key: "gaps", label: "Awaiting RSVP", displayLabel: "RSVP Gaps", value: briefing.missing, detail: briefing.missing ? `${briefing.gapEvents.length} event${briefing.gapEvents.length === 1 ? "" : "s"} affected` : "No response gaps", tone: briefing.missing ? "attention" : "positive" },
    { key: "all", label: "Response Rate", displayLabel: "Response", value: next ? `${briefing.responseRate}%` : "—", detail: next ? `${briefing.responded} responses recorded` : "No RSVP signal", tone: !next ? "info" : briefing.responseRate >= 80 ? "positive" : briefing.responseRate >= 55 ? "info" : "attention" },
  ];
  const showingPast = status === "past";
  const listHeading = showingPast ? "Past Events" : status === "gaps" ? "RSVP Gaps" : status === "all" ? "Events" : "Upcoming";
  const showPremiumEmptyState = !showingPast && briefing.upcoming === 0;

  return (
    <SecondaryPageShell testId="coach-events-interactive-dashboard" className="coachEventsPremiumWorkspace">
      <SecondaryPageIntro
        eyebrow="SCHEDULE"
        title="Events"
        summary="Plan practices, games and team moments."
        actions={[{ key: "create", label: "+ Create Event", onClick: onCreateEvent }]}
        testId="coach-events-command-bar"
      />
      <CoachEventsMonthCalendar rows={rows} activeType={type} onOpenEvent={onOpenEvent} onCreateEvent={onCreateEvent} />
      <CoachRoutePerformanceStage
        kind="schedule"
        eyebrow="NEXT TEAM MOMENT"
        title={next ? next.title || "Next team event" : "Calendar is open"}
        detail={nextMomentDetail}
        tone={!next ? "info" : nextAwaiting ? "attention" : "positive"}
        action={nextMomentAction}
        metrics={metricItems}
        activeMetric={status}
        onMetricSelect={onStatusChange}
        testId="coach-events-decision-brief"
      />
      <SecondaryPageToolbar testId="coach-events-toolbar">
        <div className="coachEventsFilterShell" ref={normalizeEventsSearchSurface}>
          <DashboardFilterRail
            surface="light"
            searchValue={query}
            onSearchChange={onQueryChange}
            searchPlaceholder="Search events"
            filters={[
              { key: "all", label: "All" },
              { key: "run", label: "Practice" },
              { key: "game", label: "Game" },
              { key: "clinic", label: "Camp" },
              { key: "recovery", label: "Meeting" },
            ]}
            activeFilter={type}
            onFilterChange={onTypeChange}
            trailing={typeof onStatusChange === "function" ? (
              <button type="button" className="coachEventsHistoryAction" onClick={() => onStatusChange(showingPast ? "upcoming" : "past")} aria-pressed={showingPast}>
                <span>{showingPast ? "Upcoming" : "Past Events"}</span><span aria-hidden="true">→</span>
              </button>
            ) : null}
            testId="coach-events-filter-rail"
          />
        </div>
      </SecondaryPageToolbar>
      <div hidden data-testid="coach-events-supporting-intelligence"><div data-testid="coach-events-insight-grid" /></div>
      <div className="coachEventsMobileListHeading" data-testid="coach-events-mobile-list-heading">{listHeading}</div>
      {showPremiumEmptyState ? (
        <section className="coachEventsPremiumEmptyState" data-testid="coach-events-premium-empty-state" aria-labelledby="coach-events-empty-title">
          <h2 id="coach-events-empty-title">Nothing scheduled yet</h2>
          <p>Your next practice, game or team event will appear here.</p>
        </section>
      ) : null}
    </SecondaryPageShell>
  );
}

const operationalPageConfig = {
  "coach-page-dashboard-drills": {
    eyebrow: "Programming decision",
    decisionEyebrow: "Training brief",
    emptyTitle: "Build the next training priority",
    emptyDetail: "Add or select a drill so the team has one clear training focus before the library expands.",
  },
  "coach-page-dashboard-strength": {
    eyebrow: "Availability decision",
    decisionEyebrow: "Session brief",
    emptyTitle: "Set the next strength session",
    emptyDetail: "Create the next session and make athlete commitments visible before adding more programming.",
  },
  "coach-page-dashboard-leaderboards": {
    eyebrow: "COMPETE",
    decisionEyebrow: "TEAM STANDARD",
    emptyTitle: "Recognition begins with activity",
    emptyDetail: "Player results will create a meaningful recognition surface after the first verified activity is logged.",
  },
};

const readableMetricValue = (metric) => {
  const value = metric?.value;
  if (value === null || value === undefined || value === "") return "No current signal";
  return String(value);
};

function buildOperationalPageModel({ title, summary, metrics = [], testId }) {
  const config = operationalPageConfig[testId] || {
    eyebrow: "Operational decision",
    decisionEyebrow: "Decision brief",
    emptyTitle: `Set the next ${String(title || "team").toLowerCase()} priority`,
    emptyDetail: summary || "Use the available evidence to choose one clear next action.",
  };
  const isLeaderboardsPage = testId === "coach-page-dashboard-leaderboards";
  const allMeaningful = metrics.filter((metric) => metric && metric.value !== undefined && metric.value !== null && metric.value !== "");
  const meaningful = isLeaderboardsPage
    ? allMeaningful.filter((metric) => ["ranked", "leader", "archives"].includes(metric.key))
    : allMeaningful;
  const leaderMetric = isLeaderboardsPage ? allMeaningful.find((metric) => metric.key === "leader") : null;
  const hasLeader = Boolean(leaderMetric && Number(leaderMetric.value) > 0 && leaderMetric.detail && leaderMetric.detail !== "No leader yet");
  const primary = isLeaderboardsPage ? (hasLeader ? leaderMetric : meaningful[0]) : meaningful[0];
  return {
    ...config,
    decisionTitle: isLeaderboardsPage
      ? (hasLeader ? `${leaderMetric.detail} sets the standard` : config.emptyTitle)
      : primary ? `${primary.label}: ${readableMetricValue(primary)}` : config.emptyTitle,
    decisionDetail: isLeaderboardsPage
      ? (hasLeader ? `${readableMetricValue(leaderMetric)} verified makes lead the current team ranking.` : config.emptyDetail)
      : primary?.detail || config.emptyDetail,
    decisionTone: isLeaderboardsPage ? (hasLeader ? "positive" : "info") : primary?.tone || "info",
    primary,
    meaningful,
    isLeaderboardsPage,
  };
}

export function CoachPageDashboardHeader({ eyebrow, title, summary, status, actions = [], metrics = [], activeMetric, onMetricSelect, testId }) {
  const model = buildOperationalPageModel({ title, summary, metrics, testId });
  const decisionAction = model.primary?.key && onMetricSelect
    ? { label: model.isLeaderboardsPage ? "Review rankings" : `Review ${model.primary.label}`, onClick: () => onMetricSelect(model.primary.key) }
    : actions[0];
  const displayEyebrow = model.isLeaderboardsPage ? model.eyebrow : eyebrow || model.eyebrow;
  const displayTitle = model.isLeaderboardsPage ? "Leaderboards" : title;
  const displaySummary = model.isLeaderboardsPage ? "Recognize the standard. See who is leading and who is rising." : summary;

  return (
    <SecondaryPageShell testId={testId} className="secondaryPageShell--embeddedHeader">
      <SecondaryPageIntro eyebrow={displayEyebrow} title={displayTitle} summary={displaySummary} status={status} actions={actions} />
      <CoachRoutePerformanceStage
        kind={model.isLeaderboardsPage ? "leaderboards" : undefined}
        eyebrow={model.decisionEyebrow}
        title={model.decisionTitle}
        detail={model.decisionDetail}
        tone={model.decisionTone}
        action={decisionAction}
        metrics={model.meaningful}
        activeMetric={activeMetric}
        onMetricSelect={onMetricSelect}
        testId={`${testId}-decision-brief`}
      />
    </SecondaryPageShell>
  );
}
