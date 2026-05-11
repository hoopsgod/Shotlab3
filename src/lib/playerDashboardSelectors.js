import { normalizeEmail } from "./authFlow.js";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const normalizePlayerActivity = ({ shotLogs = [], scLogs = [], scores = [], userEmail = "", teamId = "" } = {}) => {
  const normalizedEmail = normalizeEmail(userEmail || "");
  const scoped = (row) => {
    const rowEmail = normalizeEmail(row?.email || "");
    if (normalizedEmail && rowEmail !== normalizedEmail) return false;
    if (teamId && row?.teamId && row.teamId !== teamId) return false;
    return true;
  };
  return {
    shotLogs: safeArray(shotLogs).filter(scoped),
    scLogs: safeArray(scLogs).filter(scoped),
    scores: safeArray(scores).filter(scoped),
  };
};

export const normalizeWorkoutAndLogs = ({ shotLogs = [], scLogs = [] } = {}) => ({
  shotLogs: safeArray(shotLogs).map((log) => ({ ...log, made: safeNumber(log?.made) })),
  scLogs: safeArray(scLogs),
});

export const normalizeEventsAndRsvps = ({ events = [], rsvps = [], userEmail = "", today = "" } = {}) => {
  const normalizedEmail = normalizeEmail(userEmail || "");
  const sortedEvents = safeArray(events).filter((event) => event?.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const upcomingEvents = today ? sortedEvents.filter((event) => String(event.date) >= today) : sortedEvents;
  const attendanceRows = safeArray(rsvps).filter((row) => normalizeEmail(row?.email || "") === normalizedEmail);
  return { sortedEvents, upcomingEvents, attendanceRows };
};

export const deriveStreakDays = (scores = []) => {
  const dates = [...new Set(safeArray(scores).map((s) => s?.date).filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a)));
  if (!dates.length) return 0;
  let streak = 0;
  const cursor = new Date(`${dates[0]}T00:00:00`);
  if (Number.isNaN(cursor.getTime())) return 0;
  for (const dateValue of dates) {
    const next = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(next.getTime())) continue;
    const diff = Math.round((cursor - next) / 86400000);
    if (streak === 0 || diff === 0) {
      streak += diff === 0 ? 0 : 1;
      if (streak === 0) streak = 1;
      continue;
    }
    if (diff === 1) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return Math.max(0, streak);
};

export const deriveCompletionRatio = ({ todayMakes = 0, dailyGoal = 1 } = {}) => {
  const goal = Math.max(1, safeNumber(dailyGoal));
  return Math.min(100, Math.round((safeNumber(todayMakes) / goal) * 100));
};

export const deriveMomentumLabel = ({ weeklyMakes = 0, weeklyGoal = 1 } = {}) => {
  const goal = Math.max(1, safeNumber(weeklyGoal));
  if (safeNumber(weeklyMakes) >= goal) return "Rising fast";
  if (safeNumber(weeklyMakes) >= Math.round(goal * 0.65)) return "Building";
  return "Early in cycle";
};

export const deriveNextFocusLabel = ({ todaysMakes = 0, dailyGoal = 1 } = {}) => (safeNumber(todaysMakes) < Math.max(1, safeNumber(dailyGoal))
  ? "Daily shot volume + attendance"
  : "Sustain form and quality reps");

export const derivePlayerNotificationBriefing = ({ nextEvent = null, dayLabel = () => "UPCOMING", weekMissingCount = 0, unresolvedBadgeLabel = "All RSVPs set", scSessions = [], streak = 0 } = {}) => [
  nextEvent ? { priority: (dayLabel(nextEvent.date) === "TODAY" || dayLabel(nextEvent.date) === "TOMORROW") ? "important" : "passive", title: "Upcoming event", detail: `${nextEvent.title} · ${dayLabel(nextEvent.date)} ${nextEvent.time || "TBD"}`, cta: "Open events", target: "program" } : null,
  weekMissingCount > 0 ? { priority: weekMissingCount >= 2 ? "critical" : "important", title: "Unresolved RSVPs", detail: `${unresolvedBadgeLabel} in the next 7 days.`, cta: "Resolve now", target: "program" } : null,
  safeArray(scSessions).length ? { priority: "passive", title: "Upcoming workout", detail: `${scSessions[0]?.sport || scSessions[0]?.title || "Session"} · ${scSessions[0]?.date || "TBD"}`, cta: "Open S&C", target: "sc" } : null,
  streak <= 1 ? { priority: "important", title: "Streak continuity", detail: "Log activity today to keep your momentum uninterrupted.", cta: "Log activity", target: "log-drill" } : { priority: "passive", title: "Streak continuity", detail: `${streak}-day streak is active — protect the standard.`, cta: "View progress", target: "profile" },
].filter(Boolean).slice(0, 4);

export const deriveFirstWeekActivationMilestones = ({ hasRsvped = false, firstWorkoutComplete = false, firstEventInteraction = false } = {}) => ([
  { label: "First RSVP", done: Boolean(hasRsvped), target: "program" },
  { label: "First completed workout", done: Boolean(firstWorkoutComplete), target: "sc" },
  { label: "First event interaction", done: Boolean(firstEventInteraction), target: "program" },
]);

export const deriveTrainingIdentityLabels = ({ eventsAttended = 0, weeklyMakes = 0, weeklyGoal = 1, weeklyPct = 0, streak = 0 } = {}) => {
  const goal = Math.max(1, safeNumber(weeklyGoal));
  return {
    trainingIdentity: eventsAttended >= 3 && weeklyMakes >= Math.round(goal * 0.75) ? "Two-way standard" : weeklyMakes >= Math.round(goal * 0.75) ? "Skill-volume specialist" : eventsAttended >= 3 ? "Team-first competitor" : "Foundation phase",
    commitmentLevel: weeklyPct >= 90 && streak >= 5 ? "Elite discipline" : weeklyPct >= 70 ? "Reliable builder" : weeklyPct >= 45 ? "Work in progress" : "Needs consistency",
  };
};
