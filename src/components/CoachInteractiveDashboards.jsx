import {
  DashboardFilterRail,
  DashboardInsightCard,
  DashboardProgress,
  InteractiveMetricStrip,
} from "./CoachDashboardPrimitives.jsx";
import { ExperienceSparkline } from "./ExperiencePrimitives.jsx";
import {
  SecondaryPageDecision,
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

const resolvePlayerAction = (action, { onFilterChange, onAddPlayer }) => {
  if (!action) return undefined;
  if (action.kind === "add-player" && typeof onAddPlayer === "function") return { label: action.label, onClick: onAddPlayer };
  if (action.kind === "filter" && typeof onFilterChange === "function") return { label: action.label, onClick: () => onFilterChange(action.value) };
  return undefined;
};

const resolveEventAction = (action, { onStatusChange, onCreateEvent, onOpenEvent }) => {
  if (!action) return undefined;
  if (action.kind === "create-event" && typeof onCreateEvent === "function") return { label: action.label, onClick: onCreateEvent };
  if (action.kind === "status-filter" && typeof onStatusChange === "function") return { label: action.label, onClick: () => onStatusChange(action.value) };
  if (action.kind === "open-event" && typeof onOpenEvent === "function" && action.id != null) return { label: action.label, onClick: () => onOpenEvent(action.id) };
  return undefined;
};

export function CoachPlayersInteractiveDashboard({ metrics = {}, rows = [], filter, query, onFilterChange, onQueryChange, onAddPlayer, onOpenArchives }) {
  const briefing = buildCoachPlayerActionBriefing({ metrics, rows });
  const metricItems = [
    { key: "all", label: "Roster", value: briefing.total, detail: "Active team players" },
    { key: "active", label: "Active This Week", value: briefing.active, detail: `${briefing.activeRate}% of roster`, tone: "positive" },
    { key: "attention", label: "Needs Attention", value: briefing.attentionRows.length, detail: briefing.noActivityRows.length ? `${briefing.noActivityRows.length} with no activity` : "No current-week activity", tone: "attention" },
    { key: "leaders", label: "Weekly Makes", value: Number(metrics.weeklyMakes) || 0, detail: `${Number(metrics.weeklyActions) || 0} logged actions`, tone: "info" },
  ];

  return (
    <SecondaryPageShell testId="coach-players-interactive-dashboard">
      <SecondaryPageIntro eyebrow="Roster intelligence" title="Players" summary="See who is progressing, where engagement is slipping, and the coaching action that matters next." status={`${briefing.active}/${briefing.total || 0} active this week`} actions={[{ key: "add", label: "Add Player", onClick: onAddPlayer }, { key: "archives", label: "Season Tools", onClick: onOpenArchives }]} testId="coach-players-command-bar" />
      <SecondaryPageToolbar testId="coach-players-toolbar">
        <InteractiveMetricStrip items={metricItems} activeKey={filter} onSelect={onFilterChange} testId="coach-players-metric-strip" />
        <DashboardFilterRail searchValue={query} onSearchChange={onQueryChange} searchPlaceholder="Search player name or email" filters={[{ key: "all", label: "All", count: briefing.total }, { key: "active", label: "Active", count: briefing.active }, { key: "attention", label: "Attention", count: briefing.attentionRows.length }, { key: "new", label: "No Activity", count: briefing.noActivityRows.length }, { key: "leaders", label: "Top Engagement", count: Math.min(briefing.total, 5) }]} activeFilter={filter} onFilterChange={onFilterChange} testId="coach-players-filter-rail" />
      </SecondaryPageToolbar>
      <SecondaryPageDecision eyebrow="Decision brief" title={briefing.decision.title} detail={briefing.decision.detail} tone={briefing.decision.tone} action={resolvePlayerAction(briefing.decision.action, { onFilterChange, onAddPlayer })} testId="coach-players-decision-brief">
        <ExperienceSparkline values={briefing.engagementDistribution} label="Engagement spread" tone={briefing.decision.tone} testId="coach-players-engagement-sparkline" />
      </SecondaryPageDecision>
      <SecondaryPageEvidence testId="coach-players-insight-grid">
        {briefing.insights.map((insight) => (
          <DashboardInsightCard key={insight.key} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} action={resolvePlayerAction(insight.action, { onFilterChange, onAddPlayer })}>
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
  const metricItems = [
    { key: "upcoming", label: "Upcoming", value: briefing.upcoming, detail: next ? `Next: ${formatCoachScheduleDate(next.date)}` : "No event scheduled", tone: "info" },
    { key: "gaps", label: "Missing RSVPs", value: briefing.missing, detail: `${briefing.gapEvents.length} affected events`, tone: "attention" },
    { key: "all", label: "Response Rate", value: `${briefing.responseRate}%`, detail: `${briefing.confirmed} confirmations`, tone: briefing.responseRate >= 80 ? "positive" : briefing.responseRate >= 55 ? "info" : "attention" },
    { key: "past", label: "Completed", value: briefing.past, detail: `${briefing.total} total events` },
  ];

  return (
    <SecondaryPageShell testId="coach-events-interactive-dashboard">
      <SecondaryPageIntro eyebrow="Schedule intelligence" title="Events" summary="Run the team agenda, resolve attendance gaps, and move from schedule insight to action." status={next ? `${formatCoachScheduleDate(next.date, { weekday: true })} · ${next.time || "TBD"}` : "No upcoming event"} actions={[{ key: "create", label: "Create Event", onClick: onCreateEvent }]} testId="coach-events-command-bar" />
      <SecondaryPageToolbar testId="coach-events-toolbar">
        <InteractiveMetricStrip items={metricItems} activeKey={status} onSelect={onStatusChange} testId="coach-events-metric-strip" />
        <DashboardFilterRail searchValue={query} onSearchChange={onQueryChange} searchPlaceholder="Search title, location, or type" filters={[{ key: "all", label: "All Types", count: rows.length }, { key: "run", label: "Practice" }, { key: "game", label: "Game" }, { key: "clinic", label: "Camp" }, { key: "recovery", label: "Meeting" }]} activeFilter={type} onFilterChange={onTypeChange} testId="coach-events-filter-rail" />
      </SecondaryPageToolbar>
      <SecondaryPageDecision eyebrow="Next team moment" title={briefing.decision.title} detail={briefing.decision.detail} tone={briefing.decision.tone} action={resolveEventAction(briefing.decision.action, { onStatusChange, onCreateEvent, onOpenEvent })} testId="coach-events-decision-brief">
        <DashboardProgress value={briefing.responseRate} max={100} label="Upcoming RSVP completion" detail={`${briefing.confirmed} confirmed`} />
      </SecondaryPageDecision>
      <SecondaryPageEvidence testId="coach-events-insight-grid">
        {briefing.insights.map((insight) => (
          <DashboardInsightCard key={insight.key} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} action={resolveEventAction(insight.action, { onStatusChange, onCreateEvent, onOpenEvent })}>
            {insight.progress ? <DashboardProgress value={insight.progress.value} max={insight.progress.max} label={insight.progress.label} detail={insight.progress.detail} /> : null}
          </DashboardInsightCard>
        ))}
      </SecondaryPageEvidence>
    </SecondaryPageShell>
  );
}

const operationalPageConfig = {
  "coach-page-dashboard-drills": {
    eyebrow: "Programming decision",
    decisionEyebrow: "Training brief",
    emptyTitle: "Build the next training priority",
    emptyDetail: "Add or select a drill so the team has one clear training focus before the library expands.",
    evidenceLabels: ["Library readiness", "Program signal", "Usage context"],
  },
  "coach-page-dashboard-strength": {
    eyebrow: "Availability decision",
    decisionEyebrow: "Session brief",
    emptyTitle: "Set the next strength session",
    emptyDetail: "Create the next session and make athlete commitments visible before adding more programming.",
    evidenceLabels: ["Session readiness", "Athlete signal", "Completion context"],
  },
  "coach-page-dashboard-leaderboards": {
    eyebrow: "Recognition decision",
    decisionEyebrow: "Performance brief",
    emptyTitle: "Recognition begins with activity",
    emptyDetail: "Player results will create a meaningful recognition surface after the first verified activity is logged.",
    evidenceLabels: ["Current leaders", "Movement signal", "Season context"],
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
    evidenceLabels: ["Current signal", "Supporting context", "Trend context"],
  };
  const meaningful = metrics.filter((metric) => metric && metric.value !== undefined && metric.value !== null && metric.value !== "");
  const primary = meaningful[0];
  const supporting = meaningful.slice(1, 4);
  return {
    ...config,
    decisionTitle: primary ? `${primary.label}: ${readableMetricValue(primary)}` : config.emptyTitle,
    decisionDetail: primary?.detail || config.emptyDetail,
    decisionTone: primary?.tone || "info",
    primary,
    supporting,
  };
}

export function CoachPageDashboardHeader({ eyebrow, title, summary, status, actions = [], metrics = [], activeMetric, onMetricSelect, testId }) {
  const model = buildOperationalPageModel({ title, summary, metrics, testId });
  const decisionAction = model.primary?.key && onMetricSelect
    ? { label: `Review ${model.primary.label}`, onClick: () => onMetricSelect(model.primary.key) }
    : actions[0];

  return (
    <SecondaryPageShell testId={testId}>
      <SecondaryPageIntro eyebrow={eyebrow || model.eyebrow} title={title} summary={summary} status={status} actions={actions} />
      {metrics.length ? (
        <SecondaryPageToolbar testId={`${testId}-toolbar`}>
          <InteractiveMetricStrip items={metrics} activeKey={activeMetric} onSelect={onMetricSelect} testId={`${testId}-metric-strip`} />
        </SecondaryPageToolbar>
      ) : null}
      <SecondaryPageDecision
        eyebrow={model.decisionEyebrow}
        title={model.decisionTitle}
        detail={model.decisionDetail}
        tone={model.decisionTone}
        action={decisionAction}
        testId={`${testId}-decision-brief`}
      >
        {model.primary && typeof model.primary.value === "number" ? (
          <DashboardProgress value={model.primary.value} max={Math.max(model.primary.value, 1)} label={model.primary.label} detail={model.primary.detail} />
        ) : null}
      </SecondaryPageDecision>
      {model.supporting.length ? (
        <SecondaryPageEvidence testId={`${testId}-evidence`}>
          {model.supporting.map((metric, index) => (
            <DashboardInsightCard
              key={metric.key || `${testId}-${index}`}
              eyebrow={model.evidenceLabels[index] || "Supporting evidence"}
              title={`${metric.label}: ${readableMetricValue(metric)}`}
              body={metric.detail || "Use this signal as supporting context, not as a substitute for the coach's decision."}
              tone={metric.tone || "info"}
              action={metric.key && onMetricSelect ? { label: `Review ${metric.label}`, onClick: () => onMetricSelect(metric.key) } : undefined}
            />
          ))}
        </SecondaryPageEvidence>
      ) : null}
    </SecondaryPageShell>
  );
}
