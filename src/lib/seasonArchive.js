const toArray = (value) => (Array.isArray(value) ? value : []);
const rowTeamId = (row) => String(row?.teamId ?? row?.team_id ?? "");
const sameTeam = (teamId) => (row) => rowTeamId(row) === String(teamId || "");
const inactiveRosterStatuses = new Set(["removed", "deleted", "archived", "inactive", "removed_from_team"]);
const isActiveRosterRow = (row = {}) => {
  const role = String(row.role || "").trim().toLowerCase();
  const status = String(row.rosterStatus || row.roster_status || row.status || row.membershipStatus || row.membership_status || "").trim().toLowerCase();
  if (role === "coach" || row.isCoach === true) return false;
  if (row.archived === true || row.removed === true || row.removedFromTeam === true || row.removed_from_team === true) return false;
  if (row.hidden === true || row.hideFromLeaderboards === true || row.hide_from_leaderboards === true) return false;
  if (inactiveRosterStatuses.has(status)) return false;
  return true;
};
const deepClone = (value) => JSON.parse(JSON.stringify(value ?? null));
const numberFrom = (row, keys) => {
  for (const key of keys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const normalizeKey = (value) => String(value || "").trim().toLowerCase();
const rowIdentityValues = (row = {}) => [
  row.email,
  row.player_email,
  row.playerId,
  row.player_id,
  row.profileId,
  row.profile_id,
  row.userId,
  row.user_id,
  row.user_id,
  row.id,
].map(normalizeKey).filter(Boolean);
const profileName = (row = {}) => row.name || [row.firstName, row.lastName].filter(Boolean).join(" ") || [row.first_name, row.last_name].filter(Boolean).join(" ");
const rowDateValue = (row = {}) => row.date || row.session_date || row.createdAt || row.created_at || row.updatedAt || row.updated_at || row.ts || "";
const latestDate = (rows = []) => rows.map(rowDateValue).filter(Boolean).map((value) => ({ raw: value, time: Number.isFinite(Number(value)) ? Number(value) : Date.parse(value) })).filter((entry) => Number.isFinite(entry.time)).sort((a, b) => b.time - a.time)[0]?.raw || "";
const buildRosterEntries = (rosterSnapshot = [], playerProfileSnapshot = []) => {
  const entries = [];
  const seen = new Set();
  const add = (row = {}, fallbackSource = "roster") => {
    const keys = rowIdentityValues(row);
    const dedupeKey = keys[0] || normalizeKey(profileName(row)) || `${fallbackSource}:${entries.length}`;
    if (seen.has(dedupeKey)) return;
    keys.forEach((key) => seen.add(key));
    seen.add(dedupeKey);
    entries.push({
      name: profileName(row) || row.email || row.player_email || "Archived player",
      email: row.email || row.player_email || "",
      playerId: row.playerId || row.player_id || row.id || "",
      profileId: row.profileId || row.profile_id || (fallbackSource === "profile" ? row.id : ""),
      userId: row.userId || row.user_id || row.user_id || "",
      rosterSource: row.source || row.rosterSource || row.roster_source || fallbackSource,
      identityKeys: new Set(keys),
    });
  };
  toArray(rosterSnapshot).forEach((row) => add(row, row.source || "roster"));
  toArray(playerProfileSnapshot).forEach((row) => add(row, "profile"));
  return entries;
};
const rowsForPlayer = (rows = [], entry = {}) => toArray(rows).filter((row) => rowIdentityValues(row).some((key) => entry.identityKeys?.has(key)));
const buildPlayerSeasonSummaries = ({ rosterSnapshot, homeScoresSnapshot, programScoresSnapshot, shotLogsSnapshot, eventRsvpSnapshot, scRsvpSnapshot, scLogSnapshot }) => buildRosterEntries(rosterSnapshot, []).map((entry) => {
  const homeRows = rowsForPlayer(homeScoresSnapshot, entry);
  const programRows = rowsForPlayer(programScoresSnapshot, entry);
  const shotRows = rowsForPlayer(shotLogsSnapshot, entry);
  const eventRows = rowsForPlayer(eventRsvpSnapshot, entry);
  const scRsvpRows = rowsForPlayer(scRsvpSnapshot, entry);
  const scLogRows = rowsForPlayer(scLogSnapshot, entry);
  const bestProgramScore = programRows.map((row) => numberFrom(row, ["score", "makes", "made"])).filter((value) => Number.isFinite(value)).sort((a, b) => b - a)[0];
  return {
    name: entry.name,
    email: entry.email,
    playerId: entry.playerId,
    profileId: entry.profileId,
    userId: entry.userId,
    rosterSource: entry.rosterSource,
    totalHomeMakes: homeRows.reduce((sum, row) => sum + numberFrom(row, ["makes", "made", "score"]), 0),
    homeScoreCount: homeRows.length,
    totalProgramScore: programRows.reduce((sum, row) => sum + numberFrom(row, ["score", "makes", "made"]), 0),
    programScoreCount: programRows.length,
    totalShotLogMakes: shotRows.reduce((sum, row) => sum + numberFrom(row, ["makes", "made", "score"]), 0),
    shotLogCount: shotRows.length,
    eventRsvpCount: eventRows.length,
    scRsvpCount: scRsvpRows.length,
    scLogCount: scLogRows.length,
    programDrillAttemptCount: programRows.length,
    bestProgramScore,
    lastActivityDate: latestDate([...homeRows, ...programRows, ...shotRows, ...eventRows, ...scRsvpRows, ...scLogRows]),
  };
});

const makeArchiveId = ({ teamId, seasonName, createdAt }) => {
  const slug = String(seasonName || "season").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "season";
  return `season_${String(teamId).replace(/[^a-zA-Z0-9_-]/g, "")}_${slug}_${String(createdAt).replace(/[^0-9]/g, "") || Date.now()}`;
};

export function createSeasonArchive({
  teamId,
  coach,
  seasonName,
  seasonStartDate = "",
  seasonEndDate = "",
  players = [],
  playerProfiles = [],
  activeRosterPlayers = null,
  scores = [],
  programScores = [],
  shotLogs = [],
  events = [],
  rsvps = [],
  scSessions = [],
  scRsvps = [],
  scLogs = [],
  programDrills = [],
  drills = [],
  challenges = [],
  existingArchives = [],
  now = () => new Date().toISOString(),
} = {}) {
  const normalizedTeamId = String(teamId || "").trim();
  if (!coach || coach.role !== "coach" || String(coach.teamId || "") !== normalizedTeamId) {
    return { ok: false, error: "Only an authenticated coach for the active team can archive a season." };
  }
  if (!normalizedTeamId) return { ok: false, error: "A teamId is required to archive a season." };
  const normalizedSeasonName = String(seasonName || "").trim();
  if (!normalizedSeasonName) return { ok: false, error: "Season name is required." };

  const createdAt = typeof now === "function" ? now() : now;
  const inTeam = sameTeam(normalizedTeamId);
  const activeRosterSource = Array.isArray(activeRosterPlayers) ? activeRosterPlayers : players;
  const rosterSnapshot = deepClone(toArray(activeRosterSource).filter((row) => inTeam(row) && isActiveRosterRow(row)));
  const activeRosterKeys = new Set(rosterSnapshot.flatMap(rowIdentityValues));
  const playerProfileSnapshot = deepClone(toArray(playerProfiles).filter((row) => inTeam(row) && rowIdentityValues(row).some((key) => activeRosterKeys.has(key))));
  const homeScoresSnapshot = deepClone(toArray(scores).filter(inTeam));
  const programScoresSnapshot = deepClone(toArray(programScores).filter(inTeam));
  const shotLogsSnapshot = deepClone(toArray(shotLogs).filter(inTeam));
  const eventSnapshot = deepClone(toArray(events).filter(inTeam));
  const eventRsvpSnapshot = deepClone(toArray(rsvps).filter(inTeam));
  const scSessionSnapshot = deepClone(toArray(scSessions).filter(inTeam));
  const scRsvpSnapshot = deepClone(toArray(scRsvps).filter(inTeam));
  const scLogSnapshot = deepClone(toArray(scLogs).filter(inTeam));
  const programDrillSnapshot = deepClone(toArray(programDrills));
  const drillSnapshot = deepClone(toArray(drills));
  const challengeSnapshot = deepClone(toArray(challenges).filter(inTeam));

  const playerSeasonSummaries = buildPlayerSeasonSummaries({ rosterSnapshot, homeScoresSnapshot, programScoresSnapshot, shotLogsSnapshot, eventRsvpSnapshot, scRsvpSnapshot, scLogSnapshot });

  const summary = {
    rosterCount: rosterSnapshot.length,
    playerProfileCount: playerProfileSnapshot.length,
    homeScoreCount: homeScoresSnapshot.length,
    programScoreCount: programScoresSnapshot.length,
    shotLogCount: shotLogsSnapshot.length,
    eventCount: eventSnapshot.length,
    eventRsvpCount: eventRsvpSnapshot.length,
    scSessionCount: scSessionSnapshot.length,
    scRsvpCount: scRsvpSnapshot.length,
    scLogCount: scLogSnapshot.length,
    totalHomeMakes: homeScoresSnapshot.reduce((sum, row) => sum + numberFrom(row, ["makes", "made", "score"]), 0),
    totalProgramScore: programScoresSnapshot.reduce((sum, row) => sum + numberFrom(row, ["score", "makes", "made"]), 0),
    totalShotLogMakes: shotLogsSnapshot.reduce((sum, row) => sum + numberFrom(row, ["makes", "made", "score"]), 0),
  };

  const archive = {
    id: makeArchiveId({ teamId: normalizedTeamId, seasonName: normalizedSeasonName, createdAt }),
    teamId: normalizedTeamId,
    seasonName: normalizedSeasonName,
    seasonStartDate: seasonStartDate || "",
    seasonEndDate: seasonEndDate || "",
    createdAt,
    archivedBy: { email: coach.email || "", name: coach.name || "", role: "coach" },
    version: 1,
    rosterSnapshot,
    playerProfileSnapshot,
    homeScoresSnapshot,
    programScoresSnapshot,
    shotLogsSnapshot,
    eventSnapshot,
    eventRsvpSnapshot,
    scSessionSnapshot,
    scRsvpSnapshot,
    scLogSnapshot,
    programDrillSnapshot,
    drillSnapshot,
    challengeSnapshot,
    playerSeasonSummaries,
    summary,
  };

  return { ok: true, archive, seasonArchives: [...toArray(existingArchives), archive] };
}


export function getSeasonArchiveDetailModel(archive = {}) {
  const summary = archive?.summary || {};
  const roster = toArray(archive?.rosterSnapshot);
  const events = toArray(archive?.eventSnapshot);
  const scSessions = toArray(archive?.scSessionSnapshot);
  const programDrills = toArray(archive?.programDrillSnapshot);
  const playerSeasonSummaries = toArray(archive?.playerSeasonSummaries);
  const playerLabel = (p = {}) => p.name || [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || p.player_email || p.id || "Archived player";
  const eventLabel = (e = {}) => [e.title || e.name || e.type || "Archived event", e.date].filter(Boolean).join(" · ");
  const scLabel = (s = {}) => [s.title || s.sport || s.sessionType || "Archived S&C session", s.date].filter(Boolean).join(" · ");
  const drillLabel = (d = {}) => d.name || d.drillName || d.title || "Archived program drill";
  return {
    id: archive?.id || "",
    seasonName: archive?.seasonName || "Archived Season",
    createdAt: archive?.createdAt || "",
    archivedBy: [archive?.archivedBy?.name, archive?.archivedBy?.email].filter(Boolean).join(" · ") || "Unknown coach",
    seasonRange: [archive?.seasonStartDate, archive?.seasonEndDate].filter(Boolean).join(" — "),
    summaryStats: [
      ["Roster", summary.rosterCount],
      ["Home Scores", summary.homeScoreCount],
      ["Program Scores", summary.programScoreCount],
      ["Shot Logs", summary.shotLogCount],
      ["Events", summary.eventCount],
      ["Event RSVPs", summary.eventRsvpCount],
      ["S&C Sessions", summary.scSessionCount],
      ["S&C RSVPs", summary.scRsvpCount],
      ["S&C Logs", summary.scLogCount],
      ["Home Makes", summary.totalHomeMakes],
      ["Program Score", summary.totalProgramScore],
      ["Shot Log Makes", summary.totalShotLogMakes],
    ].map(([label, value]) => ({ label, value: value ?? 0 })),
    sections: [
      { title: "ROSTER SNAPSHOT", empty: "No roster rows in this archive.", rows: roster.slice(0, 8).map((p) => `${playerLabel(p)}${p?.email || p?.player_email ? ` (${p.email || p.player_email})` : ""}`) },
      { title: "EVENT SNAPSHOT", empty: "No events in this archive.", rows: events.slice(0, 8).map(eventLabel) },
      { title: "S&C SNAPSHOT", empty: "No S&C sessions in this archive.", rows: scSessions.slice(0, 8).map(scLabel) },
      { title: "PROGRAM DRILL SNAPSHOT", empty: "No program drills in this archive.", rows: programDrills.slice(0, 8).map(drillLabel) },
      { title: "PLAYER SEASON SUMMARIES", empty: "No player season summaries in this archive.", rows: playerSeasonSummaries.slice(0, 12).map((player) => `${player.name || player.email || "Archived player"}${player.email ? ` (${player.email})` : ""} · Home ${player.totalHomeMakes || 0} · Program ${player.totalProgramScore || 0} · Event RSVPs ${player.eventRsvpCount || 0} · S&C Logs ${player.scLogCount || 0}`) },
    ],
  };
}
