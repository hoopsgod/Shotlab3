const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase();
const rowTeamId = (row = {}) => clean(row?.teamId || row?.team_id);
const rowDate = (row = {}) => clean(row?.date || row?.session_date || row?.created_at).slice(0, 10);
const rowDrillId = (row = {}) => clean(row?.drillId || row?.drill_id || row?.id || row?.key || row?.slug);

const identityMatches = (row = {}, userEmail = "") => {
  const target = key(userEmail);
  if (!target) return false;
  return [row?.email, row?.player_email, row?.playerId, row?.player_id, row?.userId, row?.user_id]
    .map(key)
    .some((candidate) => candidate === target);
};

const teamMatches = (row = {}, teamId = "") => {
  const target = clean(teamId);
  const candidate = rowTeamId(row);
  return !target || !candidate || candidate === target;
};

const scopedRows = (rows, userEmail, teamId) => safeArray(rows).filter((row) => identityMatches(row, userEmail) && teamMatches(row, teamId));
const scopedTeamRows = (rows, teamId) => safeArray(rows).filter((row) => teamMatches(row, teamId));
const pct = (value, total) => Math.min(100, Math.round((safeNumber(value) / Math.max(1, safeNumber(total))) * 100));
const drillIds = (drills = []) => new Set(safeArray(drills).map(rowDrillId).filter(Boolean));
const completedIdsForDrills = (drills = [], scores = []) => {
  const allowed = drillIds(drills);
  return new Set(safeArray(scores).map(rowDrillId).filter((id) => id && allowed.has(id)));
};

export const filterAtHomeDrills = ({ drills = [], todayScores = [], filter = "all" } = {}) => {
  const completed = completedIdsForDrills(drills, todayScores);
  const rows = safeArray(drills);
  if (filter === "open") return rows.filter((drill) => !completed.has(rowDrillId(drill)));
  if (filter === "completed") return rows.filter((drill) => completed.has(rowDrillId(drill)));
  return rows;
};

export const filterProgramSessionBlocks = ({ blocks = [], todayScores = [], filter = "all" } = {}) => {
  if (filter === "all") return safeArray(blocks);
  const allDrills = safeArray(blocks).flatMap((block) => safeArray(block?.drills));
  const completed = completedIdsForDrills(allDrills, todayScores);
  return safeArray(blocks)
    .map((block) => ({
      ...block,
      drills: safeArray(block?.drills).filter((drill) => filter === "completed" ? completed.has(rowDrillId(drill)) : !completed.has(rowDrillId(drill))),
    }))
    .filter((block) => block.drills.length > 0);
};

export const buildAtHomeWorkspaceModel = ({
  today = new Date().toISOString().slice(0, 10),
  userEmail = "",
  teamId = "",
  drills = [],
  todayScores = [],
  shotLogs = [],
  streak = 0,
  dailyGoal = 100,
} = {}) => {
  const completed = completedIdsForDrills(drills, todayScores);
  const myShots = scopedRows(shotLogs, userEmail, teamId);
  const todayMakes = myShots.filter((row) => rowDate(row) === today).reduce((sum, row) => sum + safeNumber(row?.made), 0);
  const openDrills = safeArray(drills).filter((drill) => !completed.has(rowDrillId(drill)));
  const primaryAction = openDrills[0]
    ? { label: "Start next drill", target: "log-drill", drillId: rowDrillId(openDrills[0]) }
    : todayMakes < Math.max(1, safeNumber(dailyGoal))
      ? { label: "Log shots", target: "log-drill", focus: "shot-tracker" }
      : { label: "Review shot stats", target: "log-drill", focus: "shot-stats" };
  return {
    id: "at-home",
    eyebrow: "Player workspace",
    title: "At Home Training",
    subtitle: openDrills.length ? `${openDrills.length} drill${openDrills.length === 1 ? "" : "s"} still open today.` : "Daily drill block complete. Protect the standard with quality makes.",
    status: openDrills.length ? "Training active" : "Block complete",
    primaryAction,
    metrics: [
      { id: "today", label: "Today", value: todayMakes, detail: `${pct(todayMakes, dailyGoal)}% of make goal`, action: { target: "log-drill", focus: "shot-tracker" } },
      { id: "open", label: "Open drills", value: openDrills.length, detail: "Ready to complete", filter: "open" },
      { id: "complete", label: "Completed", value: completed.size, detail: `${safeArray(drills).length} assigned`, filter: "completed" },
      { id: "streak", label: "Streak", value: `${safeNumber(streak)}D`, detail: "Training days", action: { target: "profile" } },
    ],
  };
};

export const buildProgramWorkspaceModel = ({
  programDrills = [],
  todayScores = [],
  allScores = [],
  coachPriorities = {},
} = {}) => {
  const completed = completedIdsForDrills(programDrills, todayScores);
  const openDrills = safeArray(programDrills).filter((drill) => !completed.has(rowDrillId(drill)));
  const priorityText = clean(coachPriorities?.priorityDrillText);
  const priorityDrill = openDrills.find((drill) => {
    const name = key(drill?.name || drill?.drillName);
    const wanted = key(priorityText);
    return wanted && (name === wanted || name.includes(wanted) || wanted.includes(name));
  }) || openDrills[0] || null;
  const programIds = drillIds(programDrills);
  const personalBest = safeArray(allScores)
    .filter((row) => programIds.has(rowDrillId(row)))
    .reduce((best, row) => Math.max(best, safeNumber(row?.score)), 0);
  return {
    id: "program",
    eyebrow: "Coach-directed work",
    title: "Program Training",
    subtitle: priorityDrill ? `Next priority: ${clean(priorityDrill?.name || priorityDrill?.drillName)}` : "All coach-assigned work is complete for today.",
    status: openDrills.length ? "Coach plan active" : "Program complete",
    primaryAction: priorityDrill ? { label: "Start coach priority", target: "duels", drillId: rowDrillId(priorityDrill) } : { label: "Review rankings", target: "leaderboards" },
    metrics: [
      { id: "progress", label: "Today", value: `${completed.size}/${safeArray(programDrills).length}`, detail: `${pct(completed.size, safeArray(programDrills).length)}% complete` },
      { id: "open", label: "Open drills", value: openDrills.length, detail: "Remaining today", filter: "open" },
      { id: "complete", label: "Completed", value: completed.size, detail: "Logged today", filter: "completed" },
      { id: "pb", label: "Best score", value: personalBest || "—", detail: "Program PB", action: { target: "leaderboards" } },
    ],
  };
};

export const buildEventsWorkspaceModel = ({ events = [], rsvps = [], userEmail = "", teamId = "", today = new Date().toISOString().slice(0, 10) } = {}) => {
  const upcoming = scopedTeamRows(events, teamId).filter((event) => rowDate(event) >= today).sort((a, b) => rowDate(a).localeCompare(rowDate(b)) || clean(a?.time).localeCompare(clean(b?.time)));
  const myRsvps = scopedRows(rsvps, userEmail, teamId);
  const hasRsvp = (event) => myRsvps.some((row) => clean(row?.eventId || row?.event_id) === clean(event?.id));
  const missing = upcoming.filter((event) => !hasRsvp(event));
  const confirmed = upcoming.filter(hasRsvp);
  const next = upcoming[0] || null;
  return {
    id: "events",
    eyebrow: "Team commitments",
    title: "Events & Attendance",
    subtitle: next ? `${clean(next?.title) || "Next event"} · ${rowDate(next)} · ${clean(next?.time) || "TBD"}` : "No upcoming team events are scheduled.",
    status: missing.length ? `${missing.length} response${missing.length === 1 ? "" : "s"} needed` : "Attendance current",
    primaryAction: missing[0] ? { label: "Resolve next RSVP", target: "program", eventId: clean(missing[0]?.id) } : { label: "Review schedule", target: "program" },
    metrics: [
      { id: "upcoming", label: "Upcoming", value: upcoming.length, detail: "Team events" },
      { id: "missing", label: "Need RSVP", value: missing.length, detail: "Action required" },
      { id: "confirmed", label: "Confirmed", value: confirmed.length, detail: "Attendance set" },
      { id: "next", label: "Next", value: next ? rowDate(next).slice(5).replace("-", "/") : "—", detail: next ? clean(next?.time) || "TBD" : "No event" },
    ],
  };
};

export const buildStrengthWorkspaceModel = ({ sessions = [], rsvps = [], logs = [], userEmail = "", teamId = "", today = new Date().toISOString().slice(0, 10) } = {}) => {
  const upcoming = scopedTeamRows(sessions, teamId).filter((session) => rowDate(session) >= today).sort((a, b) => rowDate(a).localeCompare(rowDate(b)) || clean(a?.time).localeCompare(clean(b?.time)));
  const myRsvps = scopedRows(rsvps, userEmail, teamId);
  const myLogs = scopedRows(logs, userEmail, teamId);
  const hasRsvp = (session) => myRsvps.some((row) => clean(row?.sessionId || row?.session_id) === clean(session?.id));
  const missing = upcoming.filter((session) => !hasRsvp(session));
  const next = upcoming[0] || null;
  return {
    id: "strength",
    eyebrow: "Physical development",
    title: "Strength & Conditioning",
    subtitle: next ? `${clean(next?.sport || next?.title) || "Next session"} · ${rowDate(next)} · ${clean(next?.time) || "TBD"}` : "No upcoming strength session is scheduled.",
    status: missing.length ? `${missing.length} commitment${missing.length === 1 ? "" : "s"} open` : "Commitments current",
    primaryAction: missing[0] ? { label: "Open next session", target: "sc", sessionId: clean(missing[0]?.id) } : { label: "Log S&C work", target: "sc", focus: "sc-log" },
    metrics: [
      { id: "upcoming", label: "Upcoming", value: upcoming.length, detail: "Scheduled sessions" },
      { id: "commitments", label: "Committed", value: myRsvps.length, detail: "RSVP total" },
      { id: "logged", label: "Logged", value: myLogs.length, detail: "Completed work" },
      { id: "next", label: "Next", value: next ? rowDate(next).slice(5).replace("-", "/") : "—", detail: next ? clean(next?.time) || "TBD" : "No session" },
    ],
  };
};

export const buildLeaderboardWorkspaceModel = ({ rows = [], userEmail = "", weeklyMakes = 0, streak = 0 } = {}) => {
  const index = safeArray(rows).findIndex((row) => identityMatches(row, userEmail));
  const rank = index >= 0 ? index + 1 : 0;
  const currentTotal = index >= 0 ? safeNumber(rows[index]?.total || rows[index]?.makes || rows[index]?.value) : 0;
  const nextTotal = index > 0 ? safeNumber(rows[index - 1]?.total || rows[index - 1]?.makes || rows[index - 1]?.value) : currentTotal;
  const gap = rank > 1 ? Math.max(0, nextTotal - currentTotal) : 0;
  return {
    id: "leaderboards",
    eyebrow: "Competitive progress",
    title: "Leaderboards",
    subtitle: rank ? `You are ranked #${rank}. ${gap ? `${gap} makes separate you from the next position.` : "You own the top spot."}` : "Log verified work to enter the rankings.",
    status: rank ? "Ranking active" : "Awaiting first result",
    primaryAction: { label: rank ? "Review rankings" : "Log qualifying work", target: rank ? "leaderboards" : "log-drill" },
    metrics: [
      { id: "rank", label: "Your rank", value: rank ? `#${rank}` : "—", detail: "Home shots" },
      { id: "gap", label: "Gap", value: rank > 1 ? gap : "—", detail: rank === 1 ? "Top position" : "Makes to advance" },
      { id: "weekly", label: "This week", value: safeNumber(weeklyMakes), detail: "Makes logged" },
      { id: "streak", label: "Streak", value: `${safeNumber(streak)}D`, detail: "Training days", action: { target: "profile" } },
    ],
  };
};

export const buildProfileWorkspaceModel = ({ shotLogs = [], scores = [], rsvps = [], scLogs = [], userEmail = "", teamId = "", streak = 0 } = {}) => {
  const myShots = scopedRows(shotLogs, userEmail, teamId);
  const myScores = scopedRows(scores, userEmail, teamId);
  const myRsvps = scopedRows(rsvps, userEmail, teamId);
  const myScLogs = scopedRows(scLogs, userEmail, teamId);
  const totalMakes = myShots.reduce((sum, row) => sum + safeNumber(row?.made), 0);
  const bestScore = myScores.reduce((best, row) => Math.max(best, safeNumber(row?.score)), 0);
  return {
    id: "profile",
    eyebrow: "Development record",
    title: "Player Profile",
    subtitle: totalMakes || myScores.length ? "Your verified training identity, progress history, and account controls." : "Complete your first training block to establish your development record.",
    status: totalMakes || myScores.length ? "Progress active" : "Foundation phase",
    primaryAction: { label: totalMakes || myScores.length ? "Continue training" : "Log first result", target: "log-drill" },
    metrics: [
      { id: "makes", label: "Total makes", value: totalMakes, detail: "At Home logged" },
      { id: "best", label: "Best score", value: bestScore || "—", detail: "Drill PB" },
      { id: "events", label: "Commitments", value: myRsvps.length, detail: "Event RSVPs" },
      { id: "strength", label: "S&C logs", value: myScLogs.length, detail: `${safeNumber(streak)}D streak` },
    ],
  };
};
