const normalize = (value) => String(value || "").trim().toLowerCase();
const safeArray = (value) => Array.isArray(value) ? value : [];
const safeNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const identityKeys = (row = {}) => new Set([
  row.email,
  row.player_email,
  row.playerId,
  row.player_id,
  row.userId,
  row.user_id,
  row.profileId,
  row.profile_id,
  row.id,
].map(normalize).filter(Boolean));

const isCoachIdentity = (row = {}) => (
  normalize(row.role) === "coach" ||
  row.isCoach === true ||
  row.is_coach === true
);

const rowsMatchPlayer = (row, playerKeys) => {
  const rowKeys = identityKeys(row);
  for (const key of rowKeys) if (playerKeys.has(key)) return true;
  return false;
};

const rowDate = (row = {}) => String(row.date || row.session_date || row.created_at || row.createdAt || "").slice(0, 10);

const latestDate = (rows) => rows.map(rowDate).filter(Boolean).sort().at(-1) || "";

const rsvpPlayerIdentity = (row = {}) => normalize(
  row.playerId || row.player_id || row.email || row.player_email || row.userId || row.user_id || row.name,
);

const latestRosterRsvpsForEvent = ({ rsvps = [], eventId = "", roster = [] } = {}) => {
  const rosterPlayers = safeArray(roster).filter((player) => !isCoachIdentity(player));
  const rosterIdentities = new Set();
  for (const player of rosterPlayers) for (const key of identityKeys(player)) rosterIdentities.add(key);

  const latestByPlayer = new Map();
  for (const row of safeArray(rsvps)) {
    if (String(row.eventId || row.event_id || "") !== String(eventId || "")) continue;
    const identity = rsvpPlayerIdentity(row);
    if (!identity || !rosterIdentities.has(identity)) continue;
    const prior = latestByPlayer.get(identity);
    const rowTs = safeNumber(row.ts || row.updatedAt || row.updated_at || row.createdAt || row.created_at);
    const priorTs = safeNumber(prior?.ts || prior?.updatedAt || prior?.updated_at || prior?.createdAt || prior?.created_at);
    if (!prior || rowTs >= priorTs) latestByPlayer.set(identity, row);
  }
  return { rosterPlayers, responses: [...latestByPlayer.values()] };
};

export function buildCoachPlayerDashboardRows({
  players = [],
  scores = [],
  shotLogs = [],
  rsvps = [],
  scLogs = [],
  weekStart = "",
} = {}) {
  return safeArray(players)
    .filter((player) => !isCoachIdentity(player))
    .map((player) => {
      const keys = identityKeys(player);
      const playerScores = safeArray(scores).filter((row) => rowsMatchPlayer(row, keys));
      const playerShots = safeArray(shotLogs).filter((row) => rowsMatchPlayer(row, keys));
      const playerRsvps = safeArray(rsvps).filter((row) => rowsMatchPlayer(row, keys));
      const playerScLogs = safeArray(scLogs).filter((row) => rowsMatchPlayer(row, keys));
      const activityRows = [...playerScores, ...playerShots, ...playerScLogs];
      const weeklyRows = weekStart ? activityRows.filter((row) => rowDate(row) >= weekStart) : activityRows;
      const weeklyMakes = playerShots
        .filter((row) => !weekStart || rowDate(row) >= weekStart)
        .reduce((total, row) => total + safeNumber(row.made), 0);
      const totalMakes = playerShots.reduce((total, row) => total + safeNumber(row.made), 0);
      const lastActivityDate = latestDate(activityRows);
      const statusKey = weeklyRows.length > 0 ? "active" : activityRows.length > 0 ? "attention" : "new";
      const statusLabel = statusKey === "active" ? "Active this week" : statusKey === "attention" ? "Needs follow-up" : "No activity yet";
      const name = player.name || player.displayName || player.email || "Player";
      return {
        key: normalize(player.email || player.playerId || player.player_id || player.id || name),
        player,
        name,
        email: player.email || player.player_email || "",
        weeklyActivityCount: weeklyRows.length,
        weeklyMakes,
        totalMakes,
        lastActivityDate,
        eventRsvpCount: playerRsvps.length,
        scLogCount: playerScLogs.length,
        statusKey,
        statusLabel,
        engagementScore: weeklyRows.length * 12 + weeklyMakes + playerRsvps.length * 4 + playerScLogs.length * 6,
      };
    })
    .sort((a, b) => b.engagementScore - a.engagementScore || a.name.localeCompare(b.name));
}

export function filterCoachPlayerDashboardRows(rows = [], { filter = "all", query = "" } = {}) {
  const normalizedQuery = normalize(query);
  let result = safeArray(rows).filter((row) => !normalizedQuery || normalize(`${row.name} ${row.email}`).includes(normalizedQuery));
  if (filter === "active") result = result.filter((row) => row.statusKey === "active");
  if (filter === "attention") result = result.filter((row) => row.statusKey === "attention" || row.statusKey === "new");
  if (filter === "new") result = result.filter((row) => row.statusKey === "new");
  if (filter === "leaders") result = [...result].sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 5);
  return result;
}

export function buildCoachPlayerDashboardMetrics(rows = []) {
  const safeRows = safeArray(rows);
  return {
    total: safeRows.length,
    active: safeRows.filter((row) => row.statusKey === "active").length,
    attention: safeRows.filter((row) => row.statusKey !== "active").length,
    weeklyMakes: safeRows.reduce((total, row) => total + row.weeklyMakes, 0),
    weeklyActions: safeRows.reduce((total, row) => total + row.weeklyActivityCount, 0),
    leader: safeRows[0] || null,
  };
}

export function buildCoachEventDashboardRows({ events = [], rsvps = [], roster = [], today = "" } = {}) {
  const rosterCount = safeArray(roster).filter((player) => !isCoachIdentity(player)).length;
  return safeArray(events).map((event) => {
    const { responses } = latestRosterRsvpsForEvent({ rsvps, eventId: event.id, roster });
    const responded = Math.min(responses.length, rosterCount);
    const attending = responses.filter((row) => row?.attended === true).length;
    const unavailable = Math.max(responded - attending, 0);
    const awaitingResponse = Math.max(rosterCount - responded, 0);
    const responseRate = rosterCount > 0 ? Math.round((responded / rosterCount) * 100) : 0;
    const availabilityRate = rosterCount > 0 ? Math.round((attending / rosterCount) * 100) : 0;
    const date = String(event.date || "");
    const statusKey = date && today && date < today ? "past" : "upcoming";
    return {
      key: String(event.id || `${event.title}-${date}`),
      event,
      title: event.title || "Team Event",
      type: String(event.type || "event").toLowerCase(),
      date,
      time: event.time || "TBD",
      location: event.location || "Location TBD",
      rosterCount,
      responded,
      attending,
      unavailable,
      awaitingResponse,
      confirmed: attending,
      missing: awaitingResponse,
      responseRate,
      availabilityRate,
      statusKey,
      needsResponse: statusKey === "upcoming" && awaitingResponse > 0,
    };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export function filterCoachEventDashboardRows(rows = [], { status = "upcoming", type = "all", query = "" } = {}) {
  const normalizedQuery = normalize(query);
  return safeArray(rows).filter((row) => {
    if (status === "upcoming" && row.statusKey !== "upcoming") return false;
    if (status === "past" && row.statusKey !== "past") return false;
    if (status === "gaps" && !row.needsResponse) return false;
    if (type !== "all" && row.type !== type) return false;
    if (normalizedQuery && !normalize(`${row.title} ${row.location} ${row.type}`).includes(normalizedQuery)) return false;
    return true;
  });
}

export function buildCoachEventDashboardMetrics(rows = []) {
  const safeRows = safeArray(rows);
  const upcoming = safeRows.filter((row) => row.statusKey === "upcoming");
  const responded = upcoming.reduce((total, row) => total + safeNumber(row.responded), 0);
  const attending = upcoming.reduce((total, row) => total + safeNumber(row.attending ?? row.confirmed), 0);
  const unavailable = upcoming.reduce((total, row) => total + safeNumber(row.unavailable), 0);
  const awaitingResponse = upcoming.reduce((total, row) => total + safeNumber(row.awaitingResponse ?? row.missing), 0);
  const rosterSlots = upcoming.reduce((total, row) => total + safeNumber(row.rosterCount || (safeNumber(row.responded) + safeNumber(row.awaitingResponse))), 0);
  const responseRate = rosterSlots ? Math.round((responded / rosterSlots) * 100) : 0;
  const availabilityRate = rosterSlots ? Math.round((attending / rosterSlots) * 100) : 0;
  return {
    total: safeRows.length,
    upcoming: upcoming.length,
    past: safeRows.filter((row) => row.statusKey === "past").length,
    responded,
    attending,
    unavailable,
    awaitingResponse,
    confirmed: attending,
    missing: awaitingResponse,
    responseRate,
    availabilityRate,
    next: upcoming[0] || null,
  };
}

export function buildCoachPageDashboardSummary({
  drills = [],
  programDrills = [],
  scSessions = [],
  scRsvps = [],
  scLogs = [],
  leaderboardRows = [],
  activityRows = [],
  seasonArchives = [],
} = {}) {
  return {
    drills: {
      active: safeArray(drills).length,
      program: safeArray(programDrills).length,
      total: safeArray(drills).length + safeArray(programDrills).length,
    },
    strength: {
      sessions: safeArray(scSessions).length,
      rsvps: safeArray(scRsvps).length,
      logs: safeArray(scLogs).length,
    },
    leaderboards: {
      ranked: safeArray(leaderboardRows).length,
      leader: safeArray(leaderboardRows)[0] || null,
    },
    activity: {
      total: safeArray(activityRows).length,
      recent: safeArray(activityRows).slice(-7).length,
    },
    archives: {
      total: safeArray(seasonArchives).length,
      latest: safeArray(seasonArchives).at(-1) || null,
    },
  };
}