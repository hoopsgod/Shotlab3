const toArray = (value) => (Array.isArray(value) ? value : []);
const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase();
const finite = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const teamIdOf = (row = {}) => clean(row.teamId ?? row.team_id);
const nameOf = (row = {}) => clean(row.name || [row.firstName, row.lastName].filter(Boolean).join(" ") || [row.first_name, row.last_name].filter(Boolean).join(" "));

const identityValues = (row = {}, includeId = true) => [
  row.email,
  row.player_email,
  row.playerEmail,
  row.playerId,
  row.player_id,
  row.profileId,
  row.profile_id,
  row.userId,
  row.user_id,
  ...(includeId ? [row.id] : []),
].map(key).filter(Boolean);

export function getPlayerCareerIdentity(player = {}) {
  const tokens = new Set(identityValues(player));
  return {
    tokens,
    name: key(nameOf(player)),
    hasStableIdentity: tokens.size > 0,
  };
}

export function playerCareerRowMatches(row = {}, identity = getPlayerCareerIdentity()) {
  const rowTokens = identityValues(row);
  if (rowTokens.some((token) => identity.tokens.has(token))) return true;
  if (identity.hasStableIdentity || rowTokens.length > 0) return false;
  const rowName = key(nameOf(row));
  return Boolean(identity.name && rowName && identity.name === rowName);
}

const rowBelongsToTeam = (row, teamId) => {
  const rowTeamId = teamIdOf(row);
  return !rowTeamId || rowTeamId === clean(teamId);
};

const numberFrom = (row = {}, fields = []) => {
  for (const field of fields) {
    const value = Number(row?.[field]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const rowsForPlayer = (rows, identity, teamId) => toArray(rows).filter((row) => rowBelongsToTeam(row, teamId) && playerCareerRowMatches(row, identity));

const archiveDate = (archive = {}) => clean(archive.seasonEndDate || archive.season_end_date || archive.seasonStartDate || archive.season_start_date || archive.createdAt || archive.created_at);
const archiveTeamId = (archive = {}) => clean(archive.teamId || archive.team_id);

function normalizeSeasonSummary(summary = {}, archive = {}) {
  const homeMakes = finite(summary.totalHomeMakes);
  const programScore = finite(summary.totalProgramScore);
  const shotLogMakes = finite(summary.totalShotLogMakes);
  const eventRsvps = finite(summary.eventRsvpCount);
  const scRsvps = finite(summary.scRsvpCount);
  const scLogs = finite(summary.scLogCount);
  return {
    id: clean(archive.id),
    archiveId: clean(archive.id),
    isCurrent: false,
    seasonName: clean(archive.seasonName || archive.season_name) || "Archived Season",
    seasonStartDate: clean(archive.seasonStartDate || archive.season_start_date),
    seasonEndDate: clean(archive.seasonEndDate || archive.season_end_date),
    createdAt: clean(archive.createdAt || archive.created_at),
    totalHomeMakes: homeMakes,
    homeScoreCount: finite(summary.homeScoreCount),
    totalProgramScore: programScore,
    programScoreCount: finite(summary.programScoreCount),
    totalShotLogMakes: shotLogMakes,
    shotLogCount: finite(summary.shotLogCount),
    eventRsvpCount: eventRsvps,
    scRsvpCount: scRsvps,
    scLogCount: scLogs,
    bestProgramScore: Number.isFinite(Number(summary.bestProgramScore)) ? Number(summary.bestProgramScore) : null,
    lastActivityDate: clean(summary.lastActivityDate),
    trainingTotal: homeMakes + programScore + shotLogMakes,
    participationTotal: eventRsvps + scRsvps + scLogs,
  };
}

function deriveArchiveSummary(archive, identity) {
  const homeRows = rowsForPlayer(archive.homeScoresSnapshot, identity, archiveTeamId(archive));
  const programRows = rowsForPlayer(archive.programScoresSnapshot, identity, archiveTeamId(archive));
  const shotRows = rowsForPlayer(archive.shotLogsSnapshot, identity, archiveTeamId(archive));
  const eventRows = rowsForPlayer(archive.eventRsvpSnapshot, identity, archiveTeamId(archive));
  const scRsvpRows = rowsForPlayer(archive.scRsvpSnapshot, identity, archiveTeamId(archive));
  const scLogRows = rowsForPlayer(archive.scLogSnapshot, identity, archiveTeamId(archive));
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
      const stored = toArray(archive.playerSeasonSummaries).find((summary) => playerCareerRowMatches(summary, identity));
      const summary = stored || deriveArchiveSummary(archive, identity);
      return summary ? normalizeSeasonSummary(summary, archive) : null;
    })
    .filter(Boolean)
    .sort((a, b) => archiveDate(a).localeCompare(archiveDate(b)) || a.seasonName.localeCompare(b.seasonName));
}

export function buildCurrentPlayerSeason({
  player,
  teamId,
  seasonName = "Current Season",
  scores = [],
  programScores = [],
  shotLogs = [],
  rsvps = [],
  scRsvps = [],
  scLogs = [],
} = {}) {
  const identity = getPlayerCareerIdentity(player);
  const normalizedTeamId = clean(teamId);
  const homeRows = rowsForPlayer(scores, identity, normalizedTeamId).filter((row) => key(row.src || row.source || "home") !== "program");
  const programRows = rowsForPlayer(programScores, identity, normalizedTeamId);
  const shotRows = rowsForPlayer(shotLogs, identity, normalizedTeamId);
  const eventRows = rowsForPlayer(rsvps, identity, normalizedTeamId);
  const scRsvpRows = rowsForPlayer(scRsvps, identity, normalizedTeamId);
  const scLogRows = rowsForPlayer(scLogs, identity, normalizedTeamId);
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
const bestSeasonBy = (rows, field) => rows.reduce((best, row) => !best || finite(row[field]) > finite(best[field]) ? row : best, null);

export function buildPlayerCareerHistory({
  player,
  teamId,
  seasonArchives = [],
  currentSeasonName = "Current Season",
  scores = [],
  programScores = [],
  shotLogs = [],
  rsvps = [],
  scRsvps = [],
  scLogs = [],
  includeCurrentSeason = true,
} = {}) {
  const archived = getArchivedPlayerSeasons({ player, teamId, seasonArchives });
  const current = buildCurrentPlayerSeason({ player, teamId, seasonName: currentSeasonName, scores, programScores, shotLogs, rsvps, scRsvps, scLogs });
  current.isCurrent = true;
  current.archiveId = "";
  const seasons = includeCurrentSeason ? [...archived, current] : archived;
  const career = {
    seasons: seasons.length,
    archivedSeasons: archived.length,
    totalHomeMakes: sum(seasons, "totalHomeMakes"),
    totalProgramScore: sum(seasons, "totalProgramScore"),
    totalShotLogMakes: sum(seasons, "totalShotLogMakes"),
    trainingTotal: sum(seasons, "trainingTotal"),
    eventRsvpCount: sum(seasons, "eventRsvpCount"),
    scRsvpCount: sum(seasons, "scRsvpCount"),
    scLogCount: sum(seasons, "scLogCount"),
  };
  const bestTrainingSeason = bestSeasonBy(seasons, "trainingTotal");
  const bestHomeSeason = bestSeasonBy(seasons, "totalHomeMakes");
  const bestProgramScore = seasons.reduce((best, season) => season.bestProgramScore == null ? best : Math.max(best, season.bestProgramScore), 0);
  const previous = archived.at(-1) || null;
  const improvement = previous ? {
    comparedTo: previous.seasonName,
    previousValue: previous.trainingTotal,
    currentValue: current.trainingTotal,
    delta: current.trainingTotal - previous.trainingTotal,
    percent: previous.trainingTotal > 0 ? Math.round(((current.trainingTotal - previous.trainingTotal) / previous.trainingTotal) * 100) : null,
  } : null;
  return {
    player: {
      name: nameOf(player) || clean(player?.email) || "Player",
      email: clean(player?.email || player?.player_email),
    },
    seasons,
    career,
    records: {
      bestTrainingSeason,
      bestHomeSeason,
      bestProgramScore,
    },
    improvement,
    hasHistory: seasons.some((season) => season.trainingTotal > 0 || season.participationTotal > 0),
  };
}
