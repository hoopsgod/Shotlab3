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

export const deriveMomentumLabel = ({ weeklyMakes = 0, weeklyGoal = 1, streak = 0, weeklyPct = 0 } = {}) => {
  const goal = Math.max(1, safeNumber(weeklyGoal));
  const makes = safeNumber(weeklyMakes);
  const pct = safeNumber(weeklyPct) || Math.round((makes / goal) * 100);
  const streakDays = safeNumber(streak);

  if (pct >= 100 && streakDays >= 8) return "Championship standard";
  if (pct >= 85 && streakDays >= 5) return "Game-speed rhythm";
  if (pct >= 70 && streakDays >= 3) return "Locked in";
  if (pct >= 40 || streakDays >= 2) return "Stacking quality reps";
  return "Building base volume";
};

export const deriveNextFocusLabel = ({ todaysMakes = 0, dailyGoal = 1 } = {}) => (safeNumber(todaysMakes) < Math.max(1, safeNumber(dailyGoal))
  ? "Close daily make target + confirm attendance"
  : "Sustain shot quality under fatigue");


export const deriveUpcomingSchedule = ({ events = [], rsvps = [], scSessions = [], scRsvps = [], userEmail = "", today = "" } = {}) => {
  const normalizedEmail = normalizeEmail(userEmail || "");
  const day = today || new Date().toISOString().slice(0, 10);
  const nextEvent = safeArray(events)
    .filter((event) => event?.date && String(event.date) >= day)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time || "").localeCompare(String(b.time || "")))[0] || null;
  const nextScSession = safeArray(scSessions)
    .filter((session) => session?.date && String(session.date) >= day)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.time || "").localeCompare(String(b.time || "")))[0] || null;
  const eventRsvp = nextEvent ? safeArray(rsvps).find((row) => row?.eventId === nextEvent.id && normalizeEmail(row?.email || row?.playerId || "") === normalizedEmail) : null;
  const scRsvp = nextScSession ? safeArray(scRsvps).find((row) => row?.sessionId === nextScSession.id && normalizeEmail(row?.email || row?.playerId || "") === normalizedEmail) : null;
  return [
    nextEvent ? { kind: "event", label: "Next Event", item: nextEvent, title: nextEvent.title || "Team event", date: nextEvent.date, time: nextEvent.time || "TBD", location: nextEvent.location || "Location TBD", rsvpStatus: eventRsvp ? "Going" : "Not RSVP’d", target: "program", cta: "Open Events" } : null,
    nextScSession ? { kind: "sc", label: "Next S&C", item: nextScSession, title: nextScSession.sport || nextScSession.title || "Strength & Conditioning", date: nextScSession.date, time: nextScSession.time || "TBD", location: nextScSession.location || nextScSession.sessionType || "Location TBD", rsvpStatus: scRsvp ? "Going" : "Not RSVP’d", target: "sc", cta: "Open S&C" } : null,
  ].filter(Boolean);
};

export const derivePlayerNotificationBriefing = ({ nextEvent = null, dayLabel = () => "UPCOMING", weekMissingCount = 0, unresolvedBadgeLabel = "All RSVPs set", scSessions = [], streak = 0 } = {}) => [
  nextEvent ? { priority: (dayLabel(nextEvent.date) === "TODAY" || dayLabel(nextEvent.date) === "TOMORROW") ? "important" : "passive", title: "Upcoming team session", detail: `${nextEvent.title} · ${dayLabel(nextEvent.date)} ${nextEvent.time || "TBD"}`, cta: "Open schedule", target: "program" } : null,
  weekMissingCount > 0 ? { priority: weekMissingCount >= 2 ? "critical" : "important", title: "Unresolved RSVPs", detail: `${unresolvedBadgeLabel} in the next 7 days.`, cta: "Resolve now", target: "program" } : null,
  safeArray(scSessions).length ? { priority: "passive", title: "Upcoming lift / recovery", detail: `${scSessions[0]?.sport || scSessions[0]?.title || "Session"} · ${scSessions[0]?.date || "TBD"}`, cta: "Open S&C", target: "sc" } : null,
  streak <= 1 ? { priority: "important", title: "Consistency chain", detail: "Get first makes in early to set rhythm for tonight's work.", cta: "Log activity", target: "log-drill" } : { priority: "passive", title: "Consistency chain", detail: `${streak}-day run is active — defend the standard.`, cta: "View progress", target: "profile" },
].filter(Boolean).slice(0, 4);

export const deriveFirstWeekActivationMilestones = ({ hasRsvped = false, firstWorkoutComplete = false, firstEventInteraction = false } = {}) => ([
  { label: "First RSVP", done: Boolean(hasRsvped), target: "program" },
  { label: "First completed training block", done: Boolean(firstWorkoutComplete), target: "sc" },
  { label: "First event interaction", done: Boolean(firstEventInteraction), target: "program" },
]);


export const deriveInterpretedPerformanceTrends = ({ shotLogs = [], scores = [], drills = [], today = new Date().toISOString().slice(0,10) } = {}) => {
  const logs = safeArray(shotLogs);
  const allScores = safeArray(scores);
  const last14Start = new Date(`${today}T00:00:00`);
  if (!Number.isNaN(last14Start.getTime())) last14Start.setDate(last14Start.getDate() - 13);
  const startStr = `${last14Start.getFullYear()}-${String(last14Start.getMonth()+1).padStart(2,"0")}-${String(last14Start.getDate()).padStart(2,"0")}`;
  const last14 = logs.filter((l)=>String(l?.date||"") >= startStr);
  const first7 = last14.filter((l)=>String(l?.date||"") < today).slice(0, Math.max(0, last14.length - 7));
  const last7 = last14.slice(-7);
  const sum = (rows)=>rows.reduce((acc,row)=>acc+safeNumber(row?.made),0);
  const earlyMakes = sum(first7);
  const recentMakes = sum(last7);
  const momentum = recentMakes >= earlyMakes * 1.1 ? "rising" : recentMakes <= Math.max(1, earlyMakes) * 0.9 ? "cooling" : "steady";
  const volume = recentMakes > earlyMakes ? "increasing" : recentMakes < earlyMakes ? "decreasing" : "stable";
  const consistency = deriveStreakDays(allScores) >= 4 ? "improving" : "building";
  const byDrill = new Map();
  allScores.forEach((s)=>{const k=String(s?.drillName||s?.drillId||"Drill"); byDrill.set(k,(byDrill.get(k)||0)+1);});
  const strongestDrill = [...byDrill.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] || "Not enough data yet";
  const weakArea = momentum === "cooling" ? "Recent output dipped — schedule one extra focused session." : (volume === "decreasing" ? "Training volume is trending down — protect your daily reps." : "Keep reinforcing consistency under fatigue.");
  return { consistency, momentum, volume, strongestDrill, weakArea };
};
export const deriveTrainingIdentityLabels = ({ eventsAttended = 0, weeklyMakes = 0, weeklyGoal = 1, weeklyPct = 0, streak = 0 } = {}) => {
  const goal = Math.max(1, safeNumber(weeklyGoal));
  return {
    trainingIdentity: weeklyPct >= 85 && streak >= 5 ? "Rhythm scorer" : weeklyMakes >= Math.round(goal * 0.8) ? "Shot creator" : weeklyPct >= 55 ? "Volume builder" : streak >= 2 || eventsAttended >= 2 ? "Consistency focus" : "Foundation phase",
    commitmentLevel: weeklyPct >= 95 && streak >= 7 ? "Championship standard" : weeklyPct >= 75 ? "Locked in" : weeklyPct >= 45 ? "Stacking reps" : "Building base volume",
  };
};
