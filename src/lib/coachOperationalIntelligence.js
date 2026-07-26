const safeArray = (value) => (Array.isArray(value) ? value : []);
const normalize = (value) => String(value || "").trim().toLowerCase();
const numberFrom = (row = {}, keys = []) => {
  for (const key of keys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};
const dateOf = (row = {}) => String(
  row.date || row.session_date || row.sessionDate || row.event_date || row.eventDate ||
  row.completed_at || row.completedAt || row.created_at || row.createdAt || row.updated_at || row.updatedAt || ""
).slice(0, 10);
const identityKeys = (row = {}) => new Set([
  row.email, row.player_email, row.playerEmail, row.playerId, row.player_id,
  row.userId, row.user_id, row.profileId, row.profile_id, row.id,
].map(normalize).filter(Boolean));
const rowsMatch = (row = {}, keys = new Set()) => {
  for (const key of identityKeys(row)) if (keys.has(key)) return true;
  return false;
};
const nameOf = (row = {}) => row.name || row.displayName || [row.firstName, row.lastName].filter(Boolean).join(" ") || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || "Player";
const sum = (rows, keys) => safeArray(rows).reduce((total, row) => total + numberFrom(row, keys), 0);
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));

export function buildPlayerIntelligenceModel({
  playerRow,
  scores = [],
  shotLogs = [],
  rsvps = [],
  events = [],
  scRsvps = [],
  scLogs = [],
  weekStart = "",
  previousWeekStart = "",
  today = "",
} = {}) {
  if (!playerRow) return null;
  const player = playerRow.player || playerRow;
  const keys = identityKeys(player);
  const playerScores = safeArray(scores).filter((row) => rowsMatch(row, keys));
  const playerShots = safeArray(shotLogs).filter((row) => rowsMatch(row, keys));
  const playerRsvps = safeArray(rsvps).filter((row) => rowsMatch(row, keys));
  const playerScRsvps = safeArray(scRsvps).filter((row) => rowsMatch(row, keys));
  const playerScLogs = safeArray(scLogs).filter((row) => rowsMatch(row, keys));
  const currentRows = [...playerScores, ...playerShots, ...playerScLogs].filter((row) => !weekStart || dateOf(row) >= weekStart);
  const priorRows = [...playerScores, ...playerShots, ...playerScLogs].filter((row) => previousWeekStart && dateOf(row) >= previousWeekStart && (!weekStart || dateOf(row) < weekStart));
  const currentMakes = sum(playerShots.filter((row) => !weekStart || dateOf(row) >= weekStart), ["made", "makes", "score"]);
  const priorMakes = sum(playerShots.filter((row) => previousWeekStart && dateOf(row) >= previousWeekStart && (!weekStart || dateOf(row) < weekStart)), ["made", "makes", "score"]);
  const eventById = new Map(safeArray(events).map((event) => [String(event.id || ""), event]));
  const upcomingRsvps = playerRsvps.filter((row) => {
    const event = eventById.get(String(row.eventId || row.event_id || ""));
    return event && (!today || String(event.date || "") >= today);
  });
  const scheduledEvents = safeArray(events).filter((event) => !today || String(event.date || "") >= today).length;
  const attendanceRate = scheduledEvents ? Math.round((upcomingRsvps.length / scheduledEvents) * 100) : 0;
  const scCompletionRate = playerScRsvps.length ? Math.round((playerScLogs.length / playerScRsvps.length) * 100) : 0;
  const latestActivity = [...playerScores, ...playerShots, ...playerScLogs].map(dateOf).filter(Boolean).sort().at(-1) || "";
  const trendDelta = currentRows.length - priorRows.length;
  return {
    key: playerRow.key || normalize(player.email || player.playerId || player.id || nameOf(player)),
    player,
    name: nameOf(player),
    email: player.email || player.player_email || "",
    weeklyActions: currentRows.length,
    previousWeeklyActions: priorRows.length,
    trendDelta,
    weeklyMakes: currentMakes,
    previousWeeklyMakes: priorMakes,
    totalMakes: sum(playerShots, ["made", "makes", "score"]),
    attendanceConfirmed: upcomingRsvps.length,
    attendancePossible: scheduledEvents,
    attendanceRate: clamp(attendanceRate),
    scCompleted: playerScLogs.length,
    scCommitted: playerScRsvps.length,
    scCompletionRate: clamp(scCompletionRate),
    lastActivityDate: latestActivity,
    statusKey: playerRow.statusKey || (currentRows.length ? "active" : latestActivity ? "attention" : "new"),
    statusLabel: playerRow.statusLabel || (currentRows.length ? "Active this week" : latestActivity ? "Needs follow-up" : "No activity yet"),
    recentActivity: [...playerScores, ...playerShots, ...playerScLogs]
      .map((row) => ({
        id: row.id || `${dateOf(row)}-${normalize(row.drillId || row.sessionId || row.eventId)}`,
        date: dateOf(row),
        type: playerShots.includes(row) ? "Shooting" : playerScLogs.includes(row) ? "S&C" : "Drill score",
        value: playerShots.includes(row) ? `${numberFrom(row, ["made", "makes", "score"])} makes` : playerScores.includes(row) ? `${numberFrom(row, ["score", "made", "makes"])} score` : "Completed",
      }))
      .filter((row) => row.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8),
  };
}

export function buildEventIntelligenceModel({ eventRow, roster = [], rsvps = [] } = {}) {
  if (!eventRow) return null;
  const event = eventRow.event || eventRow;
  const eventId = String(event.id || eventRow.key || "");
  const eventRsvps = safeArray(rsvps).filter((row) => String(row.eventId || row.event_id || "") === eventId);
  const confirmedKeys = new Set(eventRsvps.flatMap((row) => [...identityKeys(row)]));
  const confirmed = safeArray(roster).filter((player) => [...identityKeys(player)].some((key) => confirmedKeys.has(key)));
  const missing = safeArray(roster).filter((player) => ![...identityKeys(player)].some((key) => confirmedKeys.has(key)));
  const walkIns = eventRsvps.filter((row) => row.walkIn === true || row.walk_in === true || normalize(row.source) === "walk-in");
  const responseRate = roster.length ? Math.round((confirmed.length / roster.length) * 100) : 0;
  return {
    id: eventId,
    event,
    title: event.title || eventRow.title || "Team Event",
    date: event.date || eventRow.date || "",
    time: event.time || eventRow.time || "TBD",
    location: event.location || eventRow.location || "Location TBD",
    type: event.type || eventRow.type || "event",
    description: event.desc || event.description || "No additional details.",
    confirmed,
    missing,
    walkIns,
    responseRate: clamp(responseRate),
  };
}

export function buildDrillIntelligenceRows({ drills = [], programDrills = [], scores = [], programScores = [] } = {}) {
  const makeRows = (items, type, scoreRows) => safeArray(items).map((drill) => {
    const attempts = safeArray(scoreRows).filter((row) => String(row.drillId || row.drill_id || "") === String(drill.id || ""));
    const values = attempts.map((row) => numberFrom(row, ["score", "made", "makes"]));
    const lastUsed = attempts.map(dateOf).filter(Boolean).sort().at(-1) || "";
    return {
      key: String(drill.id || `${type}-${drill.name}`),
      drill,
      type,
      name: drill.name || "Untitled drill",
      description: drill.desc || drill.description || "",
      attempts: attempts.length,
      average: values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0,
      best: values.length ? Math.max(...values) : 0,
      lastUsed,
      statusKey: attempts.length === 0 ? "unused" : attempts.length < 3 ? "underused" : "active",
    };
  });
  return [...makeRows(drills, "home", scores), ...makeRows(programDrills, "program", programScores)]
    .sort((a, b) => b.attempts - a.attempts || a.name.localeCompare(b.name));
}

export function filterDrillIntelligenceRows(rows = [], { scope = "all", query = "" } = {}) {
  const q = normalize(query);
  return safeArray(rows).filter((row) => {
    if (scope === "home" && row.type !== "home") return false;
    if (scope === "program" && row.type !== "program") return false;
    if (scope === "underused" && !["unused", "underused"].includes(row.statusKey)) return false;
    return !q || normalize(`${row.name} ${row.description}`).includes(q);
  });
}

export function buildStrengthIntelligenceRows({ sessions = [], rsvps = [], logs = [], roster = [], today = "" } = {}) {
  return safeArray(sessions).map((session) => {
    const sessionId = String(session.id || "");
    const commitments = safeArray(rsvps).filter((row) => String(row.sessionId || row.session_id || "") === sessionId);
    const completions = safeArray(logs).filter((row) => String(row.sessionId || row.session_id || "") === sessionId);
    const committedKeys = new Set(commitments.flatMap((row) => [...identityKeys(row)]));
    const completedKeys = new Set(completions.flatMap((row) => [...identityKeys(row)]));
    const overduePlayers = safeArray(roster).filter((player) => [...identityKeys(player)].some((key) => committedKeys.has(key)) && ![...identityKeys(player)].some((key) => completedKeys.has(key)));
    const completionRate = commitments.length ? Math.round((completions.length / commitments.length) * 100) : 0;
    const date = String(session.date || "");
    const statusKey = date && today && date < today && overduePlayers.length ? "overdue" : completions.length ? "completed" : "upcoming";
    return {
      key: sessionId || `${session.sport || session.title}-${date}`,
      session,
      title: session.sport || session.title || "S&C Session",
      date,
      time: session.time || "TBD",
      location: session.location || session.sessionType || "School",
      commitments: commitments.length,
      completions: completions.length,
      completionRate: clamp(completionRate),
      overduePlayers,
      statusKey,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export function filterStrengthIntelligenceRows(rows = [], { scope = "all", query = "" } = {}) {
  const q = normalize(query);
  return safeArray(rows).filter((row) => {
    if (scope !== "all" && row.statusKey !== scope) return false;
    return !q || normalize(`${row.title} ${row.location} ${row.date}`).includes(q);
  });
}

export function buildLeaderboardIntelligenceRows({ leaderboardRows = [], shotLogs = [], weekStart = "", previousWeekStart = "" } = {}) {
  return safeArray(leaderboardRows).map((row, index) => {
    const keys = identityKeys(row);
    const logs = safeArray(shotLogs).filter((log) => rowsMatch(log, keys));
    const weekly = sum(logs.filter((log) => !weekStart || dateOf(log) >= weekStart), ["made", "makes", "score"]);
    const previous = sum(logs.filter((log) => previousWeekStart && dateOf(log) >= previousWeekStart && (!weekStart || dateOf(log) < weekStart)), ["made", "makes", "score"]);
    return {
      key: normalize(row.email || row.playerId || row.id || row.name || index),
      row,
      name: row.name || row.email || "Player",
      rank: Number(row.rank) || index + 1,
      total: numberFrom(row, ["total", "makes", "made", "score"]),
      weekly,
      previous,
      improvement: weekly - previous,
      lastActivity: logs.map(dateOf).filter(Boolean).sort().at(-1) || "",
    };
  });
}

export function filterLeaderboardIntelligenceRows(rows = [], { scope = "all", query = "" } = {}) {
  const q = normalize(query);
  let output = safeArray(rows).filter((row) => !q || normalize(row.name).includes(q));
  if (scope === "top") output = output.filter((row) => row.rank <= 5);
  if (scope === "risers") output = [...output].sort((a, b) => b.improvement - a.improvement || a.rank - b.rank).filter((row) => row.improvement > 0);
  if (scope === "weekly") output = [...output].sort((a, b) => b.weekly - a.weekly || a.rank - b.rank);
  return output;
}

export function buildActivityIntelligenceRows({ scores = [], shotLogs = [], scLogs = [], events = [], today = "" } = {}) {
  const rows = [
    ...safeArray(scores).map((row) => ({ id: `score-${row.id || Math.random()}`, date: dateOf(row), type: "score", player: nameOf(row), title: row.name || row.email || "Player", detail: `${numberFrom(row, ["score", "made", "makes"])} logged`, priority: "normal", source: row })),
    ...safeArray(shotLogs).map((row) => ({ id: `shot-${row.id || Math.random()}`, date: dateOf(row), type: "shooting", player: nameOf(row), title: row.name || row.email || "Player", detail: `${numberFrom(row, ["made", "makes", "score"])} makes`, priority: "positive", source: row })),
    ...safeArray(scLogs).map((row) => ({ id: `sc-${row.id || Math.random()}`, date: dateOf(row), type: "strength", player: nameOf(row), title: row.name || row.email || "Player", detail: "S&C completed", priority: "positive", source: row })),
    ...safeArray(events).filter((event) => !today || String(event.date || "") >= today).map((event) => ({ id: `event-${event.id}`, date: String(event.date || ""), type: "event", player: "Team", title: event.title || "Team Event", detail: `${event.time || "TBD"} · ${event.location || "Location TBD"}`, priority: "info", source: event })),
  ];
  return rows.filter((row) => row.date).sort((a, b) => b.date.localeCompare(a.date));
}

export function filterActivityIntelligenceRows(rows = [], { scope = "all", query = "" } = {}) {
  const q = normalize(query);
  return safeArray(rows).filter((row) => {
    if (scope !== "all" && row.type !== scope) return false;
    return !q || normalize(`${row.player} ${row.title} ${row.detail}`).includes(q);
  });
}

export function buildSeasonComparisonModel({
  currentRoster = [],
  currentScores = [],
  currentShotLogs = [],
  currentEvents = [],
  currentRsvps = [],
  currentScSessions = [],
  currentScLogs = [],
  archives = [],
  selectedArchiveId = "",
} = {}) {
  const archiveList = safeArray(archives);
  const selected = archiveList.find((archive) => String(archive.id || "") === String(selectedArchiveId || "")) || archiveList.at(-1) || null;
  const current = {
    rosterCount: safeArray(currentRoster).length,
    homeScoreCount: safeArray(currentScores).length,
    shotLogCount: safeArray(currentShotLogs).length,
    eventCount: safeArray(currentEvents).length,
    eventRsvpCount: safeArray(currentRsvps).length,
    scSessionCount: safeArray(currentScSessions).length,
    scLogCount: safeArray(currentScLogs).length,
    totalShotLogMakes: sum(currentShotLogs, ["made", "makes", "score"]),
  };
  const previous = selected?.summary || {};
  const metrics = [
    ["Roster", "rosterCount"],
    ["Shot logs", "shotLogCount"],
    ["Total makes", "totalShotLogMakes"],
    ["Events", "eventCount"],
    ["Event RSVPs", "eventRsvpCount"],
    ["S&C sessions", "scSessionCount"],
    ["S&C completions", "scLogCount"],
  ].map(([label, key]) => ({ label, key, current: Number(current[key] || 0), previous: Number(previous[key] || 0), delta: Number(current[key] || 0) - Number(previous[key] || 0) }));
  return { selected, current, previous, metrics, archives: archiveList };
}
