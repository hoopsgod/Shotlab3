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

const firstNames = (rows = [], limit = 3) => rows.slice(0, limit).map((row) => String(row.name || "Player").split(" ")[0]).join(", ");
const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;
const formatScheduleDate = (value, { weekday = false } = {}) => {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw || "TBD";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  if (Number.isNaN(date.getTime())) return raw;
  const options = { month: "short", day: "numeric" };
  if (weekday) options.weekday = "short";
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

export function CoachPlayersInteractiveDashboard({ metrics, rows = [], filter, query, onFilterChange, onQueryChange, onAddPlayer, onOpenArchives }) {
  const attentionRows = rows.filter((row) => row.statusKey !== "active");
  const noActivityRows = rows.filter((row) => row.statusKey === "new");
  const followUpRows = rows.filter((row) => row.statusKey === "attention");
  const activeRows = rows.filter((row) => row.statusKey === "active");
  const activeRate = metrics.total ? Math.round((metrics.active / metrics.total) * 100) : 0;
  const leader = metrics.leader;
  const engagementDistribution = rows.slice(0, 7).map((row) => row.engagementScore || 0);
  const decisionTitle = attentionRows.length ? `${pluralize(attentionRows.length, "player")} need a coaching touchpoint` : "Roster engagement is current";
  const decisionDetail = attentionRows.length
    ? `${pluralize(noActivityRows.length, "player")} have no recorded activity and ${pluralize(followUpRows.length, "player")} were active previously but not this week.`
    : `${pluralize(activeRows.length, "player")} have current-week activity. Protect the standard with direct recognition and a clear next assignment.`;
  const metricItems = [
    { key: "all", label: "Roster", value: metrics.total, detail: "Active team players" },
    { key: "active", label: "Active This Week", value: metrics.active, detail: `${activeRate}% of roster`, tone: "positive" },
    { key: "attention", label: "Needs Attention", value: metrics.attention, detail: noActivityRows.length ? `${noActivityRows.length} with no activity` : "No current-week activity", tone: "attention" },
    { key: "leaders", label: "Weekly Makes", value: metrics.weeklyMakes, detail: `${metrics.weeklyActions} logged actions`, tone: "info" },
  ];

  return (
    <SecondaryPageShell testId="coach-players-interactive-dashboard">
      <SecondaryPageIntro eyebrow="Roster intelligence" title="Players" summary="See who is progressing, where engagement is slipping, and the coaching action that matters next." status={`${metrics.active}/${metrics.total || 0} active this week`} actions={[{ key: "add", label: "Add Player", onClick: onAddPlayer }, { key: "archives", label: "Season Tools", onClick: onOpenArchives }]} testId="coach-players-command-bar" />
      <SecondaryPageToolbar testId="coach-players-toolbar">
        <InteractiveMetricStrip items={metricItems} activeKey={filter} onSelect={onFilterChange} testId="coach-players-metric-strip" />
        <DashboardFilterRail searchValue={query} onSearchChange={onQueryChange} searchPlaceholder="Search player name or email" filters={[{ key: "all", label: "All", count: metrics.total }, { key: "active", label: "Active", count: metrics.active }, { key: "attention", label: "Attention", count: metrics.attention }, { key: "new", label: "No Activity", count: noActivityRows.length }, { key: "leaders", label: "Top Engagement", count: Math.min(metrics.total, 5) }]} activeFilter={filter} onFilterChange={onFilterChange} testId="coach-players-filter-rail" />
      </SecondaryPageToolbar>
      <SecondaryPageDecision eyebrow="Decision brief" title={decisionTitle} detail={decisionDetail} tone={attentionRows.length ? "attention" : "positive"} action={{ label: attentionRows.length ? "Open attention queue" : "Recognize active players", onClick: () => onFilterChange(attentionRows.length ? "attention" : "active") }} testId="coach-players-decision-brief">
        <ExperienceSparkline values={engagementDistribution} label="Engagement spread" tone={attentionRows.length ? "attention" : "positive"} testId="coach-players-engagement-sparkline" />
      </SecondaryPageDecision>
      <SecondaryPageEvidence testId="coach-players-insight-grid">
        <DashboardInsightCard eyebrow="Immediate follow-up" title={attentionRows.length ? `${attentionRows.length} players need a touchpoint` : "Roster engagement is current"} body={attentionRows.length ? `${firstNames(attentionRows)}${attentionRows.length > 3 ? ` and ${attentionRows.length - 3} more` : ""} need a direct next step, not another generic reminder.` : "Every rostered player has current-week activity."} tone={attentionRows.length ? "attention" : "positive"} action={{ label: attentionRows.length ? "Show Players" : "View Active", onClick: () => onFilterChange(attentionRows.length ? "attention" : "active") }} />
        <DashboardInsightCard eyebrow="Engagement leader" title={leader ? leader.name : "No leader yet"} body={leader ? `${leader.weeklyMakes} weekly makes and ${leader.weeklyActivityCount} logged actions currently set the pace. Use the result as recognition, not only a ranking.` : "Player activity will surface here after the first workout is logged."} tone="positive" action={leader ? { label: "Open Top Five", onClick: () => onFilterChange("leaders") } : undefined} />
        <DashboardInsightCard eyebrow="Team pulse" title={`${activeRate}% active this week`} body={activeRate >= 80 ? "Engagement is strong. Reinforce the behavior and keep the next assignment specific." : "Roster activation is below a premium operating standard. Resolve individual blockers before adding more programming."} tone={activeRate >= 80 ? "positive" : activeRate >= 55 ? "info" : "attention"}>
          <DashboardProgress value={metrics.active} max={metrics.total || 1} label="Weekly roster activation" detail={`${metrics.active} of ${metrics.total}`} />
        </DashboardInsightCard>
      </SecondaryPageEvidence>
    </SecondaryPageShell>
  );
}

export function CoachEventsInteractiveDashboard({ metrics, rows = [], status, type, query, onStatusChange, onTypeChange, onQueryChange, onCreateEvent, onOpenEvent }) {
  const next = metrics.next;
  const gapEvents = rows.filter((row) => row.needsResponse);
  const metricItems = [
    { key: "upcoming", label: "Upcoming", value: metrics.upcoming, detail: next ? `Next: ${formatScheduleDate(next.date)}` : "No event scheduled", tone: "info" },
    { key: "gaps", label: "Missing RSVPs", value: metrics.missing, detail: `${gapEvents.length} affected events`, tone: "attention" },
    { key: "all", label: "Response Rate", value: `${metrics.responseRate}%`, detail: `${metrics.confirmed} confirmations`, tone: "positive" },
    { key: "past", label: "Completed", value: metrics.past, detail: `${metrics.total} total events` },
  ];
  return (
    <SecondaryPageShell testId="coach-events-interactive-dashboard">
      <SecondaryPageIntro eyebrow="Schedule intelligence" title="Events" summary="Run the team agenda, resolve attendance gaps, and move from schedule insight to action." status={next ? `${formatScheduleDate(next.date, { weekday: true })} · ${next.time}` : "No upcoming event"} actions={[{ key: "create", label: "Create Event", onClick: onCreateEvent }]} testId="coach-events-command-bar" />
      <SecondaryPageToolbar testId="coach-events-toolbar">
        <InteractiveMetricStrip items={metricItems} activeKey={status} onSelect={onStatusChange} testId="coach-events-metric-strip" />
        <DashboardFilterRail searchValue={query} onSearchChange={onQueryChange} searchPlaceholder="Search title, location, or type" filters={[{ key: "all", label: "All Types", count: rows.length }, { key: "run", label: "Practice" }, { key: "game", label: "Game" }, { key: "clinic", label: "Camp" }, { key: "recovery", label: "Meeting" }]} activeFilter={type} onFilterChange={onTypeChange} testId="coach-events-filter-rail" />
      </SecondaryPageToolbar>
      <SecondaryPageDecision eyebrow="Next team moment" title={next ? next.title : "Calendar is open"} detail={next ? `${formatScheduleDate(next.date, { weekday: true })} at ${next.time} · ${next.location}. ${next.confirmed} confirmed and ${next.missing} still missing.` : "Create the next event to begin attendance tracking and player communication."} tone={metrics.missing ? "attention" : "info"} action={next ? { label: "Manage Attendance", onClick: () => onOpenEvent(next.event.id) } : { label: "Create Event", onClick: onCreateEvent }} testId="coach-events-decision-brief">
        <DashboardProgress value={metrics.responseRate} max={100} label="Upcoming RSVP completion" />
      </SecondaryPageDecision>
      <SecondaryPageEvidence testId="coach-events-insight-grid">
        <DashboardInsightCard eyebrow="Attendance risk" title={metrics.missing ? `${metrics.missing} unresolved responses` : "No RSVP gaps"} body={metrics.missing ? `${gapEvents.length} upcoming ${gapEvents.length === 1 ? "event has" : "events have"} players who have not confirmed.` : "Every currently scheduled event has complete roster responses."} tone={metrics.missing ? "attention" : "positive"} action={{ label: metrics.missing ? "Show Gaps" : "Show Upcoming", onClick: () => onStatusChange(metrics.missing ? "gaps" : "upcoming") }} />
        <DashboardInsightCard eyebrow="Response health" title={`${metrics.responseRate}% average response`} body="This measures roster confirmation across upcoming events and should be treated as the schedule-readiness signal." tone="positive" />
        <DashboardInsightCard eyebrow="Calendar depth" title={`${metrics.upcoming} upcoming events`} body={`${metrics.past} completed events remain available for historical context without competing with the current agenda.`} tone="info" />
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
