import { derivePriorityFreshness } from "./coachAssignmentOutcomes.js";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};
const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase();
const clampPct = (value) => Math.max(0, Math.min(100, Math.round(safeNumber(value))));

const identityMatches = (row = {}, userEmail = "") => {
  const target = key(userEmail);
  if (!target) return false;
  return [row?.email, row?.player_email, row?.playerId, row?.player_id, row?.userId, row?.user_id]
    .map(key)
    .some((candidate) => candidate === target);
};

const teamMatches = (row = {}, teamId = "") => {
  const target = clean(teamId);
  const rowTeam = clean(row?.teamId || row?.team_id);
  return !target || !rowTeam || rowTeam === target;
};

const dateValue = (row = {}) => clean(row?.date || row?.session_date || row?.created_at).slice(0, 10);

const daysUntil = (today, targetDate) => {
  const start = Date.parse(`${today}T00:00:00Z`);
  const end = Date.parse(`${targetDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return Infinity;
  return Math.round((end - start) / 86400000);
};

const drillId = (row = {}) => clean(row?.drillId || row?.drill_id || row?.id || row?.key || row?.slug);
const drillName = (row = {}) => clean(row?.name || row?.drillName || row?.drill_name || "Training drill");
const normalizeDrillName = (value = "") => key(value).replace(/[^a-z0-9]+/g, " ").trim();

const findCoachPriorityDrill = ({ coachPriority = "", drills = [], programDrills = [] } = {}) => {
  const wanted = normalizeDrillName(coachPriority);
  if (!wanted) return null;
  const candidates = [
    ...safeArray(drills).map((drill) => ({ ...drill, lane: "home", target: "log-drill" })),
    ...safeArray(programDrills).map((drill) => ({ ...drill, lane: "program", target: "duels" })),
  ];
  return candidates.find((drill) => {
    const candidate = normalizeDrillName(drillName(drill));
    return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate);
  }) || null;
};

const buildDrillTask = (drill, { source = "plan", urgency = "normal" } = {}) => ({
  id: `${drill?.lane || "home"}-drill:${drillId(drill) || normalizeDrillName(drillName(drill))}`,
  kind: drill?.lane === "program" ? "program-drill" : "home-drill",
  title: drillName(drill),
  detail: source === "coach" ? "Coach-priority work" : drill?.lane === "program" ? "Program training block" : "At Home training block",
  target: drill?.target || (drill?.lane === "program" ? "duels" : "log-drill"),
  drillId: drillId(drill),
  actionLabel: source === "coach" ? "Start coach priority" : "Start drill",
  estimatedMinutes: safeNumber(drill?.estimatedMinutes || drill?.durationMinutes) || 8,
  urgency,
  source,
});

const buildFirstResultTask = (drill = null) => {
  if (!drill) {
    return {
      id: "first-result:shots",
      kind: "first-training",
      title: "Log your first makes",
      detail: "One shooting result creates your baseline and activates progress tracking.",
      target: "log-drill",
      actionLabel: "Log first result",
      estimatedMinutes: 5,
      urgency: "priority",
      source: "activation",
      milestone: "first-training-result",
    };
  }
  return {
    ...buildDrillTask(drill, { source: "activation", urgency: "priority" }),
    id: `first-result:${drillId(drill) || normalizeDrillName(drillName(drill))}`,
    kind: "first-training",
    title: `Log your first ${drillName(drill)} result`,
    detail: "Complete one result to create your training baseline and activate progress tracking.",
    actionLabel: "Start first result",
    source: "activation",
    milestone: "first-training-result",
  };
};

const dedupeTasks = (tasks = []) => {
  const seen = new Set();
  return tasks.filter((task) => {
    const id = clean(task?.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const derivePlayerDailyCommandCenter = ({
  today = new Date().toISOString().slice(0, 10),
  now = new Date(),
  userEmail = "",
  teamId = "",
  todayMakes = 0,
  weeklyMakes = 0,
  dailyGoal = 100,
  weeklyGoal = 500,
  streak = 0,
  leaderboardRank = 0,
  drills = [],
  programDrills = [],
  todayHomeScores = [],
  todayProgramScores = [],
  events = [],
  rsvps = [],
  scSessions = [],
  scRsvps = [],
  shotLogs = [],
  scLogs = [],
  coachPriorities = {},
} = {}) => {
  const normalizedEmail = key(userEmail);
  const homeCompleted = new Set(safeArray(todayHomeScores).map(drillId).filter(Boolean));
  const programCompleted = new Set(safeArray(todayProgramScores).map(drillId).filter(Boolean));
  const eventRsvpRows = safeArray(rsvps).filter((row) => identityMatches(row, normalizedEmail) && teamMatches(row, teamId));
  const scRsvpRows = safeArray(scRsvps).filter((row) => identityMatches(row, normalizedEmail) && teamMatches(row, teamId));
  const hasEventRsvp = (event) => eventRsvpRows.some((row) => clean(row?.eventId || row?.event_id) === clean(event?.id));
  const hasScRsvp = (session) => scRsvpRows.some((row) => clean(row?.sessionId || row?.session_id) === clean(session?.id));

  const upcomingEvents = safeArray(events)
    .filter((event) => teamMatches(event, teamId) && dateValue(event) >= today)
    .sort((a, b) => dateValue(a).localeCompare(dateValue(b)) || clean(a?.time).localeCompare(clean(b?.time)));
  const upcomingSc = safeArray(scSessions)
    .filter((session) => teamMatches(session, teamId) && dateValue(session) >= today)
    .sort((a, b) => dateValue(a).localeCompare(dateValue(b)) || clean(a?.time).localeCompare(clean(b?.time)));

  const missingEvents = upcomingEvents.filter((event) => !hasEventRsvp(event));
  const missingSc = upcomingSc.filter((session) => !hasScRsvp(session));
  const urgentEvent = missingEvents.find((event) => daysUntil(today, dateValue(event)) <= 2) || null;
  const urgentSc = missingSc.find((session) => daysUntil(today, dateValue(session)) <= 2) || null;

  const homeDrills = safeArray(drills).map((drill) => ({ ...drill, lane: "home", target: "log-drill" }));
  const teamProgramDrills = safeArray(programDrills).map((drill) => ({ ...drill, lane: "program", target: "duels" }));
  const incompleteHome = homeDrills.filter((drill) => !homeCompleted.has(drillId(drill)));
  const incompleteProgram = teamProgramDrills.filter((drill) => !programCompleted.has(drillId(drill)));

  const priorityFreshness = derivePriorityFreshness({ priority: coachPriorities, now });
  const coachPriorityText = clean(coachPriorities?.priorityDrillText);
  const coachPriorityDrill = priorityFreshness.stale
    ? null
    : findCoachPriorityDrill({ coachPriority: coachPriorityText, drills: homeDrills, programDrills: teamProgramDrills });
  const coachPriorityComplete = coachPriorityDrill
    ? (coachPriorityDrill.lane === "program" ? programCompleted : homeCompleted).has(drillId(coachPriorityDrill))
    : false;

  const hasTraining = safeArray(shotLogs).some((row) => identityMatches(row, normalizedEmail) && teamMatches(row, teamId) && safeNumber(row?.made) > 0)
    || safeArray(todayHomeScores).length > 0
    || safeArray(todayProgramScores).length > 0
    || safeArray(scLogs).some((row) => identityMatches(row, normalizedEmail) && teamMatches(row, teamId));
  const firstResultPending = Boolean(clean(teamId)) && !hasTraining;
  const firstResultDrill = coachPriorityDrill || incompleteHome[0] || incompleteProgram[0] || null;
  const firstResultTask = firstResultPending ? buildFirstResultTask(firstResultDrill) : null;

  const tasks = [];
  if (urgentEvent) {
    tasks.push({
      id: `event-rsvp:${urgentEvent.id}`,
      kind: "event-rsvp",
      title: `Confirm ${clean(urgentEvent.title) || "team event"}`,
      detail: `${dateValue(urgentEvent)} · ${clean(urgentEvent.time) || "Time TBD"}`,
      target: "program",
      actionLabel: "Confirm attendance",
      estimatedMinutes: 1,
      urgency: "urgent",
      source: "team",
    });
  }

  if (firstResultTask) {
    tasks.push(firstResultTask);
  } else {
    if (coachPriorityDrill && !coachPriorityComplete) tasks.push(buildDrillTask(coachPriorityDrill, { source: "coach", urgency: "priority" }));
    if (safeNumber(todayMakes) < Math.max(1, safeNumber(dailyGoal))) {
      const remaining = Math.max(0, Math.max(1, safeNumber(dailyGoal)) - safeNumber(todayMakes));
      tasks.push({
        id: "daily-shot-target",
        kind: "shots",
        title: `${remaining} makes to close today’s target`,
        detail: `${safeNumber(todayMakes)} of ${Math.max(1, safeNumber(dailyGoal))} makes logged`,
        target: "log-drill",
        actionLabel: safeNumber(todayMakes) > 0 ? "Continue shooting" : "Log first makes",
        estimatedMinutes: Math.max(5, Math.ceil(remaining / 10)),
        urgency: "priority",
        source: "daily-goal",
      });
    }
  }

  if (urgentSc) {
    tasks.push({
      id: `sc-rsvp:${urgentSc.id}`,
      kind: "sc-rsvp",
      title: `Commit to ${clean(urgentSc.sport || urgentSc.title) || "S&C session"}`,
      detail: `${dateValue(urgentSc)} · ${clean(urgentSc.time) || "Time TBD"}`,
      target: "sc",
      actionLabel: "Open S&C",
      estimatedMinutes: 1,
      urgency: "urgent",
      source: "team",
    });
  }

  if (!firstResultPending) {
    if (incompleteHome[0]) tasks.push(buildDrillTask(incompleteHome[0]));
    if (incompleteProgram[0]) tasks.push(buildDrillTask(incompleteProgram[0]));
  }
  if (missingEvents[0]) {
    tasks.push({
      id: `event-rsvp:${missingEvents[0].id}`,
      kind: "event-rsvp",
      title: `Set RSVP for ${clean(missingEvents[0].title) || "team event"}`,
      detail: `${dateValue(missingEvents[0])} · ${clean(missingEvents[0].time) || "Time TBD"}`,
      target: "program",
      actionLabel: "Review event",
      estimatedMinutes: 1,
      urgency: "normal",
      source: "team",
    });
  }
  if (missingSc[0]) {
    tasks.push({
      id: `sc-rsvp:${missingSc[0].id}`,
      kind: "sc-rsvp",
      title: `Review ${clean(missingSc[0].sport || missingSc[0].title) || "S&C session"}`,
      detail: `${dateValue(missingSc[0])} · ${clean(missingSc[0].time) || "Time TBD"}`,
      target: "sc",
      actionLabel: "Review session",
      estimatedMinutes: 1,
      urgency: "normal",
      source: "team",
    });
  }

  const actionableTasks = dedupeTasks(tasks);
  const allCoreComplete = actionableTasks.length === 0;
  const reviewTask = {
    id: "progress-review",
    kind: "progress",
    title: allCoreComplete ? "Today’s work is complete" : "Review your progress",
    detail: allCoreComplete ? "Protect the standard and review the gains you stacked today." : "See streak, leaderboard movement, and recent performance.",
    target: "profile",
    actionLabel: allCoreComplete ? "Review today" : "Open progress",
    estimatedMinutes: 2,
    urgency: allCoreComplete ? "complete" : "normal",
    source: "progress",
  };
  const queue = [...actionableTasks, reviewTask];
  const primaryAction = queue[0];

  const hasTeamCommitment = eventRsvpRows.length > 0 || scRsvpRows.length > 0;
  const activationSteps = [
    { id: "team", label: "Team connected", done: Boolean(teamId), target: "home" },
    { id: "training", label: hasTraining ? "First training result banked" : "First training result", done: hasTraining, target: firstResultTask?.target || "log-drill", actionLabel: firstResultTask?.actionLabel || "Start first result" },
    { id: "commitment", label: "First team commitment", done: hasTeamCommitment, target: missingEvents.length ? "program" : "sc" },
  ];
  const activationCompleteCount = activationSteps.filter((step) => step.done).length;
  const dailyPct = clampPct((safeNumber(todayMakes) / Math.max(1, safeNumber(dailyGoal))) * 100);
  const weeklyPct = clampPct((safeNumber(weeklyMakes) / Math.max(1, safeNumber(weeklyGoal))) * 100);

  return {
    primaryAction,
    queue: queue.slice(0, 4),
    actionableCount: actionableTasks.length,
    allCoreComplete,
    daily: { makes: safeNumber(todayMakes), goal: Math.max(1, safeNumber(dailyGoal)), pct: dailyPct },
    weekly: { makes: safeNumber(weeklyMakes), goal: Math.max(1, safeNumber(weeklyGoal)), pct: weeklyPct },
    streak: safeNumber(streak),
    leaderboardRank: safeNumber(leaderboardRank),
    activation: {
      steps: activationSteps,
      completeCount: activationCompleteCount,
      total: activationSteps.length,
      pct: clampPct((activationCompleteCount / activationSteps.length) * 100),
      complete: activationCompleteCount === activationSteps.length,
    },
    firstSession: {
      pending: firstResultPending,
      complete: hasTraining,
      task: firstResultTask,
      title: firstResultPending ? "One result starts your ShotLab progress" : "First result banked",
      detail: firstResultPending
        ? "Complete one bounded training result. ShotLab will use it as your baseline instead of asking you to finish the full daily goal first."
        : "Your training baseline is active. Every result from here builds your progress history.",
    },
    coachSignal: {
      focus: priorityFreshness.stale ? "" : clean(coachPriorities?.todayFocusText) || "Build quality reps today",
      priorityDrill: priorityFreshness.stale ? "" : coachPriorityText || drillName(coachPriorityDrill) || "Next unfinished training block",
      challenge: priorityFreshness.stale ? "" : clean(coachPriorities?.challengeText) || "Complete one focused block and log the result.",
      freshness: priorityFreshness.freshness,
      stale: priorityFreshness.stale,
      ageDays: priorityFreshness.ageDays,
      updatedAt: priorityFreshness.updatedAt,
    },
    nextAfterPrimary: queue[1] || reviewTask,
  };
};