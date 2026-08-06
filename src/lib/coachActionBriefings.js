const safeArray = (value) => Array.isArray(value) ? value : [];
const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};
const firstName = (row) => String(row?.name || row?.email || "Player").trim().split(/\s+/)[0] || "Player";
const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;
const namedSummary = (rows, limit = 3) => {
  const names = safeArray(rows).slice(0, limit).map(firstName);
  if (!names.length) return "No players";
  const remainder = Math.max(0, safeArray(rows).length - names.length);
  return `${names.join(", ")}${remainder ? ` and ${remainder} more` : ""}`;
};

export function formatCoachScheduleDate(value, { weekday = false } = {}) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw || "TBD";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  if (Number.isNaN(date.getTime())) return raw;
  const options = { month: "short", day: "numeric" };
  if (weekday) options.weekday = "short";
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function buildCoachPlayerActionBriefing({ metrics = {}, rows = [] } = {}) {
  const safeRows = safeArray(rows);
  const attentionRows = safeRows.filter((row) => row?.statusKey !== "active");
  const noActivityRows = safeRows.filter((row) => row?.statusKey === "new");
  const followUpRows = safeRows.filter((row) => row?.statusKey === "attention");
  const activeRows = safeRows.filter((row) => row?.statusKey === "active");
  const total = safeNumber(metrics.total || safeRows.length);
  const active = safeNumber(metrics.active || activeRows.length);
  const activeRate = total ? Math.min(100, Math.round((active / total) * 100)) : 0;
  const leader = metrics.leader || [...safeRows].sort((a, b) => safeNumber(b?.engagementScore) - safeNumber(a?.engagementScore))[0] || null;
  const engagementDistribution = safeRows.slice(0, 7).map((row) => safeNumber(row?.engagementScore));

  const decision = !total
    ? {
        title: "Build the roster intelligence signal",
        detail: "Add the first player to unlock engagement, follow-up, and recognition guidance.",
        tone: "info",
        action: { kind: "add-player", label: "Add Player" },
      }
    : attentionRows.length
      ? {
          title: `${pluralize(attentionRows.length, "player")} need a coaching touchpoint`,
          detail: `${pluralize(noActivityRows.length, "player")} have no recorded activity and ${pluralize(followUpRows.length, "player")} were active previously but not this week.`,
          tone: "attention",
          action: { kind: "filter", value: "attention", label: "Open attention queue" },
        }
      : {
          title: "Roster engagement is current",
          detail: `${pluralize(activeRows.length, "player")} have current-week activity. Protect the standard with direct recognition and a specific next assignment.`,
          tone: "positive",
          action: { kind: "filter", value: "active", label: "Recognize active players" },
        };

  const insights = [
    {
      key: "follow-up",
      eyebrow: "Immediate follow-up",
      title: !total ? "No roster signal yet" : attentionRows.length ? `${pluralize(attentionRows.length, "player")} need a touchpoint` : "Roster engagement is current",
      body: !total
        ? "The first rostered player will create a real coaching signal here."
        : attentionRows.length
          ? `${namedSummary(attentionRows)} need a direct next step, not another generic reminder.`
          : "Every rostered player has current-week activity.",
      tone: attentionRows.length ? "attention" : total ? "positive" : "info",
      action: total
        ? { kind: "filter", value: attentionRows.length ? "attention" : "active", label: attentionRows.length ? "Show Players" : "View Active" }
        : { kind: "add-player", label: "Add Player" },
    },
    {
      key: "recognition",
      eyebrow: "Recognition opportunity",
      title: leader?.name || "No engagement leader yet",
      body: leader
        ? `${safeNumber(leader.weeklyMakes)} weekly makes and ${safeNumber(leader.weeklyActivityCount)} logged actions currently set the pace. Use this as recognition, not only a ranking.`
        : "Verified player activity will surface the first recognition opportunity.",
      tone: leader ? "positive" : "info",
      action: leader ? { kind: "filter", value: "leaders", label: "Open Top Five" } : undefined,
    },
    {
      key: "team-pulse",
      eyebrow: "Team pulse",
      title: `${activeRate}% active this week`,
      body: !total
        ? "Roster activation begins after the first player joins."
        : activeRate >= 80
          ? "Engagement is strong. Reinforce the behavior and keep the next assignment specific."
          : activeRate >= 55
            ? "Engagement is building, but individual blockers still need direct follow-up."
            : "Roster activation needs intervention before more programming is added.",
      tone: !total ? "info" : activeRate >= 80 ? "positive" : activeRate >= 55 ? "info" : "attention",
      progress: { value: active, max: total || 1, label: "Weekly roster activation", detail: `${active} of ${total}` },
    },
  ];

  return {
    total,
    active,
    activeRate,
    attentionRows,
    noActivityRows,
    followUpRows,
    activeRows,
    leader,
    engagementDistribution,
    decision,
    insights,
  };
}

export function buildCoachEventActionBriefing({ metrics = {}, rows = [] } = {}) {
  const safeRows = safeArray(rows);
  const gapEvents = safeRows.filter((row) => Boolean(row?.needsResponse));
  const next = metrics.next || null;
  const upcoming = safeNumber(metrics.upcoming);
  const missing = safeNumber(metrics.missing);
  const confirmed = safeNumber(metrics.confirmed);
  const responseRate = Math.min(100, safeNumber(metrics.responseRate));
  const past = safeNumber(metrics.past);
  const total = safeNumber(metrics.total || safeRows.length);
  const nextId = next?.event?.id ?? next?.id ?? null;

  const decision = !next
    ? {
        title: "Calendar is open",
        detail: "Create the next event to begin attendance tracking and player communication.",
        tone: "info",
        action: { kind: "create-event", label: "Create Event" },
      }
    : {
        title: next.title || "Next team event",
        detail: `${formatCoachScheduleDate(next.date, { weekday: true })} at ${next.time || "TBD"} · ${next.location || "Location TBD"}. ${safeNumber(next.confirmed)} confirmed and ${safeNumber(next.missing)} still missing.`,
        tone: safeNumber(next.missing) ? "attention" : "positive",
        action: { kind: "open-event", id: nextId, label: safeNumber(next.missing) ? "Manage Attendance" : "Open Event" },
      };

  const insights = [
    {
      key: "attendance-risk",
      eyebrow: "Attendance risk",
      title: missing ? `${pluralize(missing, "unresolved response")}` : next ? "No RSVP gaps" : "No event to evaluate",
      body: missing
        ? `${pluralize(gapEvents.length, "upcoming event")} ${gapEvents.length === 1 ? "has" : "have"} players who have not confirmed.`
        : next
          ? "Every currently scheduled event has complete roster responses."
          : "Create the next event to start measuring attendance readiness.",
      tone: missing ? "attention" : next ? "positive" : "info",
      action: next
        ? { kind: "status-filter", value: missing ? "gaps" : "upcoming", label: missing ? "Show Gaps" : "Show Upcoming" }
        : { kind: "create-event", label: "Create Event" },
    },
    {
      key: "response-health",
      eyebrow: "Response health",
      title: `${responseRate}% average response`,
      body: next
        ? `${confirmed} confirmed responses currently support the schedule-readiness signal.`
        : "Response health will become meaningful after an event is scheduled.",
      tone: !next ? "info" : responseRate >= 80 ? "positive" : responseRate >= 55 ? "info" : "attention",
      progress: { value: responseRate, max: 100, label: "Upcoming RSVP completion", detail: `${confirmed} confirmed` },
    },
    {
      key: "calendar-depth",
      eyebrow: "Calendar depth",
      title: `${pluralize(upcoming, "upcoming event")}`,
      body: `${pluralize(past, "completed event")} remain available for historical context without competing with the current agenda.`,
      tone: upcoming ? "info" : "attention",
      action: upcoming
        ? { kind: "status-filter", value: "upcoming", label: "Show Upcoming" }
        : { kind: "create-event", label: "Create Event" },
    },
  ];

  return {
    next,
    nextId,
    upcoming,
    missing,
    confirmed,
    responseRate,
    past,
    total,
    gapEvents,
    decision,
    insights,
  };
}
