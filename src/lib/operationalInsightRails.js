const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};
const clean = (value) => String(value ?? "").trim();

const metricValue = (model, id, fallback = 0) => {
  const metric = safeArray(model?.metrics).find((item) => item?.id === id);
  return metric?.value ?? fallback;
};

const numericMetric = (model, id) => safeNumber(metricValue(model, id, 0));

const playerPriority = ({ atHome, program, events, strength, leaderboard }) => {
  const eventGaps = numericMetric(events, "missing");
  if (eventGaps > 0) {
    return {
      eyebrow: "Next best action",
      title: `${eventGaps} event response${eventGaps === 1 ? "" : "s"} open`,
      body: clean(events?.subtitle) || "Confirm the next team commitment.",
      tone: "attention",
      action: events?.primaryAction,
    };
  }

  const programOpen = numericMetric(program, "open");
  if (programOpen > 0) {
    return {
      eyebrow: "Coach priority",
      title: clean(program?.subtitle).replace(/^Next priority:\s*/i, "") || `${programOpen} drills remaining`,
      body: `${programOpen} coach-assigned drill${programOpen === 1 ? "" : "s"} still open today.`,
      tone: "info",
      action: program?.primaryAction,
    };
  }

  const homeOpen = numericMetric(atHome, "open");
  if (homeOpen > 0) {
    return {
      eyebrow: "Next best action",
      title: `${homeOpen} At Home drill${homeOpen === 1 ? "" : "s"} open`,
      body: clean(atHome?.subtitle) || "Continue today's shooting block.",
      tone: "primary",
      action: atHome?.primaryAction,
    };
  }

  const strengthStatus = clean(strength?.status);
  if (/open|needed/i.test(strengthStatus)) {
    return {
      eyebrow: "Commitment check",
      title: strengthStatus,
      body: clean(strength?.subtitle) || "Resolve the next strength commitment.",
      tone: "attention",
      action: strength?.primaryAction,
    };
  }

  return {
    eyebrow: "Standard protected",
    title: "Today's assigned work is current",
    body: clean(leaderboard?.subtitle) || "Review your ranking and choose the next quality block.",
    tone: "positive",
    action: leaderboard?.primaryAction,
  };
};

export function buildPlayerOperationalInsightRail({
  activeTab = "home",
  atHome = {},
  program = {},
  events = {},
  strength = {},
  leaderboard = {},
  profile = {},
} = {}) {
  const eventGaps = numericMetric(events, "missing");
  const programOpen = numericMetric(program, "open");
  const weeklyMakes = metricValue(leaderboard, "weekly", 0);
  const rank = metricValue(leaderboard, "rank", "—");
  const streak = metricValue(leaderboard, "streak", "0D");
  const totalMakes = metricValue(profile, "makes", 0);
  const sAndCLogged = metricValue(strength, "logged", 0);
  const openCount = eventGaps + programOpen + numericMetric(atHome, "open");
  const priority = playerPriority({ atHome, program, events, strength, leaderboard });

  return {
    title: "Player Intelligence",
    status: openCount > 0 ? `${openCount} open` : "Current",
    activeTab,
    items: [
      {
        ...priority,
        actionLabel: priority.action?.label || "Open",
      },
      {
        eyebrow: "Momentum",
        title: rank === "—" ? `${weeklyMakes} makes this week` : `${rank} · ${weeklyMakes} weekly makes`,
        body: `${streak} training streak · ${totalMakes} verified At Home makes in your development record.`,
        tone: safeNumber(weeklyMakes) > 0 ? "positive" : "neutral",
        action: leaderboard?.primaryAction,
        actionLabel: "View rankings",
      },
      {
        eyebrow: "Commitments",
        title: eventGaps > 0 ? `${eventGaps} RSVP${eventGaps === 1 ? "" : "s"} need action` : "Team responses are current",
        body: `${sAndCLogged} S&C log${safeNumber(sAndCLogged) === 1 ? "" : "s"} recorded · ${programOpen} Program drill${programOpen === 1 ? "" : "s"} open.`,
        tone: eventGaps > 0 ? "attention" : "info",
        action: eventGaps > 0 ? events?.primaryAction : strength?.primaryAction,
        actionLabel: eventGaps > 0 ? "Resolve RSVP" : "Open S&C",
      },
    ],
  };
}

export function buildCoachOperationalInsightRail({
  activeTab = "feed",
  rosterCount = 0,
  activeTodayCount = 0,
  activeThisWeekCount = 0,
  inactivePlayersCount = 0,
  eventMetrics = {},
  strengthRows = [],
  pageSummary = {},
} = {}) {
  const totalPlayers = safeNumber(rosterCount);
  const missingRsvps = safeNumber(eventMetrics?.missing);
  const upcomingEvents = safeNumber(eventMetrics?.upcoming);
  const overdueStrength = safeArray(strengthRows).filter((row) => row?.statusKey === "overdue");
  const nextEvent = eventMetrics?.next || null;
  const archiveCount = safeNumber(pageSummary?.archives?.total);
  const rankedPlayers = safeNumber(pageSummary?.leaderboards?.ranked);
  const attentionCount = missingRsvps + safeNumber(inactivePlayersCount) + overdueStrength.length;

  let priority;
  if (totalPlayers === 0) {
    priority = {
      eyebrow: "Activation",
      title: "Build the active roster",
      body: "Add the first player to unlock attendance, leaderboard, and development intelligence.",
      tone: "attention",
      action: { target: "players", intent: "add" },
      actionLabel: "Add player",
    };
  } else if (missingRsvps > 0) {
    priority = {
      eyebrow: "Attendance risk",
      title: `${missingRsvps} unresolved RSVP slot${missingRsvps === 1 ? "" : "s"}`,
      body: `${upcomingEvents} upcoming event${upcomingEvents === 1 ? "" : "s"} need a complete readiness picture.`,
      tone: "attention",
      action: { target: "events", filter: "gaps" },
      actionLabel: "Resolve RSVPs",
    };
  } else if (inactivePlayersCount > 0) {
    priority = {
      eyebrow: "Player follow-up",
      title: `${inactivePlayersCount} player${inactivePlayersCount === 1 ? "" : "s"} losing momentum`,
      body: "Open the attention view and identify the right follow-up before the gap grows.",
      tone: "attention",
      action: { target: "players", filter: "attention" },
      actionLabel: "Open attention view",
    };
  } else if (overdueStrength.length > 0) {
    priority = {
      eyebrow: "S&C compliance",
      title: `${overdueStrength.length} overdue session${overdueStrength.length === 1 ? "" : "s"}`,
      body: "Committed work is missing a completion record.",
      tone: "attention",
      action: { target: "sc", filter: "overdue" },
      actionLabel: "Review overdue",
    };
  } else {
    priority = {
      eyebrow: "Team standard",
      title: "No urgent follow-up gaps",
      body: "Roster activity, attendance responses, and S&C commitments are aligned.",
      tone: "positive",
      action: { target: "activity" },
      actionLabel: "Review activity",
    };
  }

  const activeRate = totalPlayers > 0 ? Math.round((safeNumber(activeThisWeekCount) / totalPlayers) * 100) : 0;

  return {
    title: "Coach Intelligence",
    status: attentionCount > 0 ? `${attentionCount} signals` : "Current",
    activeTab,
    items: [
      priority,
      {
        eyebrow: "Next session",
        title: nextEvent?.title || "No upcoming event",
        body: nextEvent
          ? `${nextEvent.date || "Date TBD"} · ${nextEvent.time || "Time TBD"} · ${nextEvent.responseRate || 0}% response rate.`
          : "Schedule the next team touchpoint to protect the seven-day rhythm.",
        tone: nextEvent ? "info" : "neutral",
        action: { target: "events", intent: nextEvent ? "open" : "add" },
        actionLabel: nextEvent ? "Open events" : "Schedule event",
      },
      {
        eyebrow: "Team pulse",
        title: `${safeNumber(activeTodayCount)}/${totalPlayers} active today`,
        body: `${safeNumber(activeThisWeekCount)}/${totalPlayers} active this week · ${activeRate}% roster engagement.`,
        tone: activeRate >= 70 ? "positive" : activeRate >= 45 ? "info" : "attention",
        action: { target: "activity" },
        actionLabel: "Inspect activity",
      },
      {
        eyebrow: "Program continuity",
        title: `${rankedPlayers} ranked · ${archiveCount} archived season${archiveCount === 1 ? "" : "s"}`,
        body: archiveCount > 0
          ? "Live rankings and immutable season history are both available for comparison."
          : "Archive the completed season when ready to preserve longitudinal player records.",
        tone: archiveCount > 0 ? "positive" : "neutral",
        action: { target: archiveCount > 0 ? "leaderboards" : "players", intent: archiveCount > 0 ? "open" : "archive" },
        actionLabel: archiveCount > 0 ? "View rankings" : "Open season tools",
      },
    ],
  };
}
