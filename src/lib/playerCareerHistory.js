import { filterLiveRowsOutsideArchivedSeasons } from "./seasonLeaderboardAnalytics.js";

const toArray = (value) => (Array.isArray(value) ? value : []);
const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase();
const finite = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const teamIdOf = (row = {}) => clean(row.teamId ?? row.team_id);
const nameOf = (row = {}) => clean(
  row.name
  || [row.firstName, row.lastName].filter(Boolean).join(" ")
  || [row.first_name, row.last_name].filter(Boolean).join(" "),
);

const identityValues = (row = {}, includeGenericId = false) => [
  row.email,
  row.player_email,
  row.playerEmail,
  row.playerId,
  row.player_id,
  row.profileId,
  row.profile_id,
  row.userId,
  row.user_id,
  ...(includeGenericId ? [row.id] : []),
].map(key).filter(Boolean);

export function getPlayerCareerIdentity(player = {}) {
  const tokens = new Set(identityValues(player, true));
  return {
    tokens,
    name: key(nameOf(player)),
    hasStableIdentity: tokens.size > 0,
  };
}

export function playerCareerRowMatches(row = {}, identity = getPlayerCareerIdentity()) {
  // Generic activity-row IDs are deliberately excluded. A score/log ID must
  // never be treated as a player ID merely because the strings happen to match.
  const rowTokens = identityValues(row, false);
  if (rowTokens.some((token) => identity.tokens.has(token))) return true;
  if (identity.hasStableIdentity || rowTokens.length > 0) return false;
  const rowName = key(nameOf(row));
  return Boolean(identity.name && rowName && identity.name === rowName);
}

const rowBelongsToTeam = (row, teamId) => {
  const normalizedTeamId = clean(teamId);
  if (!normalizedTeamId) return true;
  return teamIdOf(row) === normalizedTeamId;
};

const numberFrom = (row = {}, fields = []) => {
  for (const field of fields) {
    const value = Number(row?.[field]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const valueFrom = (row = {}, fields = [], fallback = "") => {
  for (const field of fields) {
    const value = row?.[field];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

const rowsForPlayer = (rows, identity, teamId) => toArray(rows)
  .filter((row) => rowBelongsToTeam(row, teamId) && playerCareerRowMatches(row, identity));

const archiveDate = (archive = {}) => clean(
  archive.seasonEndDate
  || archive.season_end_date
  || archive.seasonStartDate
  || archive.season_start_date
  || archive.createdAt
  || archive.created_at,
);
const archiveTeamId = (archive = {}) => clean(archive.teamId || archive.team_id);

function normalizeSeasonSummary(summary = {}, archive = {}) {
  const homeMakes = finite(valueFrom(summary, ["totalHomeMakes", "total_home_makes"], 0));
  const homeScoreCount = finite(valueFrom(summary, ["homeScoreCount", "home_score_count"], 0));
  const programScore = finite(valueFrom(summary, ["totalProgramScore", "total_program_score"], 0));
  const programScoreCount = finite(valueFrom(summary, ["programScoreCount", "program_score_count"], 0));
  const shotLogMakes = finite(valueFrom(summary, ["totalShotLogMakes", "total_shot_log_makes"], 0));
  const shotLogCount = finite(valueFrom(summary, ["shotLogCount", "shot_log_count"], 0));
  const eventRsvps = finite(valueFrom(summary, ["eventRsvpCount", "event_rsvp_count"], 0));
  const scRsvps = finite(valueFrom(summary, ["scRsvpCount", "sc_rsvp_count"], 0));
  const scLogs = finite(valueFrom(summary, ["scLogCount", "sc_log_count"], 0));
  const bestProgramScore = valueFrom(summary, ["bestProgramScore", "best_program_score"], null);
  return {
    id: clean(archive.id),
    archiveId: clean(archive.id),
    isCurrent: false,
    seasonName: clean(archive.seasonName || archive.season_name) || "Archived Season",
    seasonStartDate: clean(archive.seasonStartDate || archive.season_start_date),
    seasonEndDate: clean(archive.seasonEndDate || archive.season_end_date),
    createdAt: clean(archive.createdAt || archive.created_at),
    totalHomeMakes: homeMakes,
    homeScoreCount,
    totalProgramScore: programScore,
    programScoreCount,
    programEntries: programScoreCount,
    totalShotLogMakes: shotLogMakes,
    shotLogCount,
    eventRsvpCount: eventRsvps,
    scRsvpCount: scRsvps,
    scLogCount: scLogs,
    bestProgramScore: Number.isFinite(Number(bestProgramScore)) ? Number(bestProgramScore) : null,
    lastActivityDate: clean(valueFrom(summary, ["lastActivityDate", "last_activity_date"])),
    shootingMakes: homeMakes + shotLogMakes,
    participationTotal: eventRsvps + scRsvps + scLogs,
  };
}

function deriveArchiveSummary(archive, identity) {
  const teamId = archiveTeamId(archive);
  const homeRows = rowsForPlayer(archive.homeScoresSnapshot, identity, teamId);
  const programRows = rowsForPlayer(archive.programScoresSnapshot, identity, teamId);
  const shotRows = rowsForPlayer(archive.shotLogsSnapshot, identity, teamId);
  const eventRows = rowsForPlayer(archive.eventRsvpSnapshot, identity, teamId);
  const scRsvpRows = rowsForPlayer(archive.scRsvpSnapshot, identity, teamId);
  const scLogRows = rowsForPlayer(archive.scLogSnapshot, identity, teamId);
  const programValues = programRows.map((row) => numberFrom(row, ["score", "makes", "made"]));
  if (![homeRows, programRows, shotRows, eventRows, scRsvpRows, scLogRows].some((rows) => rows.length)) return null;
  return {
    totalHomeMakes: homeRows.reduce((sum, row) => sum + numberFrom(row, ["makes", "made", "score"]), 0),
    homeScoreCount: homeRows.length,
    totalProgramScore: programRows.reduce((sum, row) => sum + numberFrom(row, ["score", "makes", "made"]), 0),
    programScoreCount: programRows.length,
    totalShotLogMakes: shotRows.reduce((sum, row) => sum + numberFrom(row, ["makes", "made", "score"]), 0),
    shotLogCount: shotRows.length,
    eventRsvpCount: eventRows.length,
    scRsvpCount: scRsvpRows.length,
    scLogCount: scLogRows.length,
    bestProgramScore: programValues.length ? Math.max(...programValues) : null,
    lastActivityDate: "",
  };
}

export function getArchivedPlayerSeasons({ player, teamId, seasonArchives = [] } = {}) {
  const identity = getPlayerCareerIdentity(player);
  const normalizedTeamId = clean(teamId);
  return toArray(seasonArchives)
    .filter((archive) => archive && (!normalizedTeamId || archiveTeamId(archive) === normalizedTeamId))
    .map((archive) => {
      const summaries = toArray(archive.playerSeasonSummaries || archive.player_season_summaries);
      const stored = summaries.find((summary) => playerCareerRowMatches(summary, identity));
      const summary = stored || deriveArchiveSummary(archive, identity);
      return summary ? normalizeSeasonSummary(summary, archive) : null;
    })
    .filter(Boolean)
    .sort((a, b) => archiveDate(a).localeCompare(archiveDate(b)) || a.seasonName.localeCompare(b.seasonName));
}

const relatedDateRows = (rows = [], parents = [], parentKeys = []) => {
  const dateById = new Map(toArray(parents).map((parent) => [
    clean(parent?.id),
    clean(parent?.date || parent?.session_date || parent?.sessionDate || parent?.created_at || parent?.createdAt),
  ]));
  return toArray(rows).map((row) => {
    if (row?.date || row?.session_date || row?.sessionDate || row?.created_at || row?.createdAt) return row;
    const parentId = clean(valueFrom(row, parentKeys));
    const date = dateById.get(parentId);
    return date ? { ...row, date } : row;
  });
};

const currentRows = (rows, seasonArchives, teamId) => filterLiveRowsOutsideArchivedSeasons(
  rows,
  { seasonArchives, teamId },
);

export function buildCurrentPlayerSeason({
  player,
  teamId,
  seasonArchives = [],
  seasonName = "Current Season",
  scores = [],
  programScores = [],
  shotLogs = [],
  events = [],
  rsvps = [],
  scSessions = [],
  scRsvps = [],
  scLogs = [],
} = {}) {
  const identity = getPlayerCareerIdentity(player);
  const normalizedTeamId = clean(teamId);
  const homeRows = rowsForPlayer(currentRows(scores, seasonArchives, normalizedTeamId), identity, normalizedTeamId)
    .filter((row) => key(row.src || row.source || "home") !== "program");
  const programRows = rowsForPlayer(currentRows(programScores, seasonArchives, normalizedTeamId), identity, normalizedTeamId);
  const shotRows = rowsForPlayer(currentRows(shotLogs, seasonArchives, normalizedTeamId), identity, normalizedTeamId);
  const eventRows = rowsForPlayer(
    currentRows(relatedDateRows(rsvps, events, ["eventId", "event_id"]), seasonArchives, normalizedTeamId),
    identity,
    normalizedTeamId,
  );
  const datedScRsvps = relatedDateRows(scRsvps, scSessions, ["sessionId", "session_id"]);
  const datedScLogs = relatedDateRows(scLogs, scSessions, ["sessionId", "session_id"]);
  const scRsvpRows = rowsForPlayer(currentRows(datedScRsvps, seasonArchives, normalizedTeamId), identity, normalizedTeamId);
  const scLogRows = rowsForPlayer(currentRows(datedScLogs, seasonArchives, normalizedTeamId), identity, normalizedTeamId);
  const programValues = programRows.map((row) => numberFrom(row, ["score", "makes", "made"]));
  return normalizeSeasonSummary({
    totalHomeMakes: homeRows.reduce((sum, row) => sum + numberFrom(row, ["score", "makes", "made"]), 0),
    homeScoreCount: homeRows.length,
    totalProgramScore: programRows.reduce((sum, row) => sum + numberFrom(row, ["score", "makes", "made"]), 0),
    programScoreCount: programRows.length,
    totalShotLogMakes: shotRows.reduce((sum, row) => sum + numberFrom(row, ["made", "makes", "score"]), 0),
    shotLogCount: shotRows.length,
    eventRsvpCount: eventRows.length,
    scRsvpCount: scRsvpRows.length,
    scLogCount: scLogRows.length,
    bestProgramScore: programValues.length ? Math.max(...programValues) : null,
  }, { id: "current", seasonName, teamId: normalizedTeamId, seasonEndDate: "9999-12-31" });
}

const sum = (rows, field) => rows.reduce((total, row) => total + finite(row[field]), 0);
const bestPositiveSeasonBy = (rows, field) => rows.reduce((best, row) => {
  const value = finite(row[field]);
  if (value <= 0) return best;
  return !best || value > finite(best[field]) ? row : best;
}, null);

export function buildPlayerCareerHistory({
  player,
  teamId,
  seasonArchives = [],
  currentSeasonName = "Current Season",
  scores = [],
  programScores = [],
  shotLogs = [],
  events = [],
  rsvps = [],
  scSessions = [],
  scRsvps = [],
  scLogs = [],
  includeCurrentSeason = true,
} = {}) {
  const archived = getArchivedPlayerSeasons({ player, teamId, seasonArchives });
  const current = buildCurrentPlayerSeason({
    player,
    teamId,
    seasonArchives,
    seasonName: currentSeasonName,
    scores,
    programScores,
    shotLogs,
    events,
    rsvps,
    scSessions,
    scRsvps,
    scLogs,
  });
  current.isCurrent = true;
  current.archiveId = "";
  const seasons = includeCurrentSeason ? [...archived, current] : archived;
  const career = {
    seasons: seasons.length,
    archivedSeasons: archived.length,
    totalShootingMakes: sum(seasons, "shootingMakes"),
    totalHomeMakes: sum(seasons, "totalHomeMakes"),
    totalShotLogMakes: sum(seasons, "totalShotLogMakes"),
    programEntryCount: sum(seasons, "programScoreCount"),
    eventRsvpCount: sum(seasons, "eventRsvpCount"),
    scRsvpCount: sum(seasons, "scRsvpCount"),
    scLogCount: sum(seasons, "scLogCount"),
  };
  const bestShootingSeason = bestPositiveSeasonBy(seasons, "shootingMakes");
  const bestHomeSeason = bestPositiveSeasonBy(seasons, "totalHomeMakes");
  const mostProgramEntries = bestPositiveSeasonBy(seasons, "programScoreCount");
  const previous = archived.at(-1) || null;
  const comparison = previous ? {
    comparedTo: previous.seasonName,
    previousValue: previous.shootingMakes,
    currentValue: current.shootingMakes,
    delta: current.shootingMakes - previous.shootingMakes,
    percent: previous.shootingMakes > 0
      ? Math.round(((current.shootingMakes - previous.shootingMakes) / previous.shootingMakes) * 100)
      : null,
  } : null;
  return {
    player: {
      name: nameOf(player) || clean(player?.email) || "Player",
      email: clean(player?.email || player?.player_email),
    },
    seasons,
    career,
    records: {
      bestShootingSeason,
      bestHomeSeason,
      mostProgramEntries,
    },
    comparison,
    // Compatibility for the original unfinished career-history draft.
    improvement: comparison,
    hasHistory: seasons.some((season) => (
      season.shootingMakes > 0
      || season.programScoreCount > 0
      || season.participationTotal > 0
    )),
  };
}
