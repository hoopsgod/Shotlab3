import { buildAtHomeLeaderboardRows } from "./homeLeaderboardRows.js";
import { getAllProgramScoreRows, getProgramLeaderboardRows } from "./programDrillScoring.js";
import { normalizeArchiveDate } from "./seasonArchive.js";

export const LEADERBOARD_TIME_SCOPES = Object.freeze({
  CURRENT: "current",
  ALL_TIME: "all_time",
});

const toArray = (value) => (Array.isArray(value) ? value : []);
const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();
const teamIdOf = (row = {}) => clean(row?.teamId ?? row?.team_id);
const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const playerName = (row = {}) => clean(
  row?.player_display_name
  ?? row?.displayName
  ?? row?.playerName
  ?? row?.player_name
  ?? row?.name
  ?? [row?.firstName ?? row?.first_name, row?.lastName ?? row?.last_name].filter(Boolean).join(" "),
);

const identityTokens = (row = {}) => {
  const tokens = [
    row?.email,
    row?.player_email,
    row?.playerEmail,
    row?.playerId,
    row?.player_id,
    row?.profileId,
    row?.profile_id,
    row?.userId,
    row?.user_id,
  ].map(lower).filter(Boolean);
  if (!tokens.length) {
    const name = lower(playerName(row));
    if (name) tokens.push(`name:${name}`);
  }
  return [...new Set(tokens)];
};

const rowDate = (row = {}) => {
  const candidates = [
    row?.date,
    row?.session_date,
    row?.sessionDate,
    row?.logged_at,
    row?.loggedAt,
    row?.completed_at,
    row?.completedAt,
    row?.created_at,
    row?.createdAt,
    row?.ts,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeArchiveDate(candidate);
    if (normalized) return normalized;
  }
  return "";
};

const archiveTeamMatches = (archive = {}, teamId = "") => {
  const requestedTeamId = clean(teamId);
  return !requestedTeamId || teamIdOf(archive) === requestedTeamId;
};

export function getArchivedSeasonRanges({ seasonArchives = [], teamId = "" } = {}) {
  const ranges = toArray(seasonArchives)
    .filter((archive) => archiveTeamMatches(archive, teamId))
    .map((archive) => ({
      archiveId: clean(archive?.id),
      seasonName: clean(archive?.seasonName ?? archive?.season_name),
      start: normalizeArchiveDate(archive?.seasonStartDate ?? archive?.season_start_date),
      end: normalizeArchiveDate(archive?.seasonEndDate ?? archive?.season_end_date),
    }))
    .filter((range) => range.start && range.end && range.start <= range.end)
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));

  const merged = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (!previous || range.start > previous.end) {
      merged.push({ ...range, archiveIds: range.archiveId ? [range.archiveId] : [], seasonNames: range.seasonName ? [range.seasonName] : [] });
      continue;
    }
    previous.end = previous.end > range.end ? previous.end : range.end;
    if (range.archiveId && !previous.archiveIds.includes(range.archiveId)) previous.archiveIds.push(range.archiveId);
    if (range.seasonName && !previous.seasonNames.includes(range.seasonName)) previous.seasonNames.push(range.seasonName);
  }
  return merged;
}

export const isDateInsideArchivedSeason = (date, ranges = []) => {
  const normalized = normalizeArchiveDate(date);
  return Boolean(normalized && toArray(ranges).some((range) => normalized >= range.start && normalized <= range.end));
};

export function filterLiveRowsOutsideArchivedSeasons(rows = [], { seasonArchives = [], teamId = "" } = {}) {
  const requestedTeamId = clean(teamId);
  const ranges = getArchivedSeasonRanges({ seasonArchives, teamId: requestedTeamId });
  return toArray(rows).filter((row) => {
    if (requestedTeamId && teamIdOf(row) && teamIdOf(row) !== requestedTeamId) return false;
    const date = rowDate(row);
    if (!ranges.length) return true;
    if (!date) return false;
    return !isDateInsideArchivedSeason(date, ranges);
  });
}

const buildIdentityAccumulator = () => {
  const records = new Map();
  const aliasToKey = new Map();
  let sequence = 0;

  const mergeRecordInto = (targetKey, sourceKey) => {
    if (targetKey === sourceKey || !records.has(sourceKey)) return;
    const target = records.get(targetKey);
    const source = records.get(sourceKey);
    target.total += source.total;
    target.archivedTotal += source.archivedTotal;
    target.currentTotal += source.currentTotal;
    target.lastActivityDate = [target.lastActivityDate, source.lastActivityDate].filter(Boolean).sort().reverse()[0] || "";
    source.seasonIds.forEach((id) => target.seasonIds.add(id));
    if (!target.email) target.email = source.email;
    if (!target.playerId) target.playerId = source.playerId;
    if (!target.name) target.name = source.name;
    for (const [alias, key] of aliasToKey.entries()) {
      if (key === sourceKey) aliasToKey.set(alias, targetKey);
    }
    records.delete(sourceKey);
  };

  const add = (row = {}, amount = 0, { source = "current", archiveId = "", lastActivityDate = "" } = {}) => {
    const value = finiteNumber(amount);
    if (value <= 0) return;
    const tokens = identityTokens(row);
    const existingKeys = [...new Set(tokens.map((token) => aliasToKey.get(token)).filter(Boolean))];
    const fallbackName = playerName(row);
    const key = existingKeys[0] || tokens[0] || `anonymous:${lower(fallbackName) || ++sequence}`;
    if (!records.has(key)) {
      const email = lower(row?.email ?? row?.player_email ?? row?.playerEmail);
      const playerId = clean(row?.playerId ?? row?.player_id ?? row?.userId ?? row?.user_id ?? row?.profileId ?? row?.profile_id ?? email);
      records.set(key, {
        email,
        playerId,
        name: fallbackName || (email ? email.split("@")[0] : playerId || "Archived player"),
        total: 0,
        archivedTotal: 0,
        currentTotal: 0,
        lastActivityDate: "",
        seasonIds: new Set(),
      });
    }
    existingKeys.slice(1).forEach((sourceKey) => mergeRecordInto(key, sourceKey));
    const record = records.get(key);
    tokens.forEach((token) => aliasToKey.set(token, key));
    record.total += value;
    if (source === "archive") record.archivedTotal += value;
    else record.currentTotal += value;
    if (archiveId) record.seasonIds.add(archiveId);
    const normalizedLastActivity = normalizeArchiveDate(lastActivityDate);
    if (normalizedLastActivity && normalizedLastActivity > record.lastActivityDate) record.lastActivityDate = normalizedLastActivity;
    if (!record.email) record.email = lower(row?.email ?? row?.player_email ?? row?.playerEmail);
    if (!record.playerId) record.playerId = clean(row?.playerId ?? row?.player_id ?? row?.userId ?? row?.user_id ?? row?.profileId ?? row?.profile_id);
    if ((!record.name || record.name === "Archived player") && fallbackName) record.name = fallbackName;
  };

  const rows = (limit) => {
    const output = [...records.values()]
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
      .map((record, index) => ({
        rank: index + 1,
        email: record.email,
        playerId: record.playerId || record.email,
        player_id: record.playerId || record.email,
        name: record.name,
        displayName: record.name,
        player_display_name: record.name,
        total: record.total,
        score: record.total,
        total_home_shots: record.total,
        archivedTotal: record.archivedTotal,
        currentTotal: record.currentTotal,
        archivedSeasonCount: record.seasonIds.size,
        lastActivityDate: record.lastActivityDate,
        timeScope: LEADERBOARD_TIME_SCOPES.ALL_TIME,
      }));
    return Number.isFinite(limit) ? output.slice(0, limit) : output;
  };

  return { add, rows };
};

const teamArchives = (seasonArchives = [], teamId = "") => toArray(seasonArchives).filter((archive) => archiveTeamMatches(archive, teamId));

export function buildCurrentOffseasonHomeLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  homeScores = [],
  shotLogs = [],
  programDrills = [],
  players = [],
  profiles = [],
  limit,
} = {}) {
  const currentScores = filterLiveRowsOutsideArchivedSeasons(homeScores, { seasonArchives, teamId });
  const currentShotLogs = filterLiveRowsOutsideArchivedSeasons(shotLogs, { seasonArchives, teamId });
  return buildAtHomeLeaderboardRows({ scores: currentScores, shotLogs: currentShotLogs, programDrills, players, profiles, limit })
    .map((row) => ({ ...row, timeScope: LEADERBOARD_TIME_SCOPES.CURRENT }));
}

export function buildAllTimeHomeLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  homeScores = [],
  shotLogs = [],
  programDrills = [],
  players = [],
  profiles = [],
  limit,
} = {}) {
  const accumulator = buildIdentityAccumulator();
  for (const archive of teamArchives(seasonArchives, teamId)) {
    for (const summary of toArray(archive?.playerSeasonSummaries)) {
      accumulator.add(
        summary,
        finiteNumber(summary?.totalHomeMakes) + finiteNumber(summary?.totalShotLogMakes),
        { source: "archive", archiveId: clean(archive?.id), lastActivityDate: summary?.lastActivityDate },
      );
    }
  }
  const currentRows = buildCurrentOffseasonHomeLeaderboardRows({
    seasonArchives,
    teamId,
    homeScores,
    shotLogs,
    programDrills,
    players,
    profiles,
  });
  currentRows.forEach((row) => accumulator.add(row, row?.total_home_shots ?? row?.total ?? row?.score, { source: "current" }));
  return accumulator.rows(limit);
}

export function getAllTimeProgramDrills({ seasonArchives = [], teamId = "", programDrills = [] } = {}) {
  const drills = [];
  const seen = new Set();
  const remember = (drill = {}) => {
    const id = clean(drill?.id ?? drill?.drill_id ?? drill?.key ?? drill?.slug ?? drill?.name);
    const name = clean(drill?.name ?? drill?.drillName ?? drill?.drill_name ?? id);
    const key = lower(id || name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    drills.push({ ...drill, id: id || name, name: name || id, historical: drill?.historical === true });
  };
  toArray(programDrills).forEach(remember);
  for (const archive of teamArchives(seasonArchives, teamId)) {
    toArray(archive?.programDrillSnapshot).forEach((drill) => remember({ ...drill, historical: true }));
  }
  return drills;
}

export function getAllTimeLeaderboardPlayers({ seasonArchives = [], teamId = "", players = [] } = {}) {
  const output = [];
  const seen = new Set();
  const remember = (player = {}) => {
    const tokens = identityTokens(player);
    const key = tokens.find((token) => seen.has(token)) || tokens[0] || `name:${lower(playerName(player))}`;
    if (!key || seen.has(key)) return;
    tokens.forEach((token) => seen.add(token));
    output.push({
      ...player,
      teamId: clean(player?.teamId ?? player?.team_id ?? teamId),
      role: player?.role === "coach" ? "player" : (player?.role || "player"),
      name: playerName(player) || player?.email || "Archived player",
      email: lower(player?.email ?? player?.player_email),
      playerId: clean(player?.playerId ?? player?.player_id ?? player?.userId ?? player?.user_id ?? player?.profileId ?? player?.profile_id ?? player?.email),
      archivedLeaderboardIdentity: player?.archivedLeaderboardIdentity === true,
    });
  };
  toArray(players).forEach(remember);
  for (const archive of teamArchives(seasonArchives, teamId)) {
    toArray(archive?.rosterSnapshot).forEach((player) => remember({ ...player, archivedLeaderboardIdentity: true }));
    toArray(archive?.playerSeasonSummaries).forEach((player) => remember({ ...player, archivedLeaderboardIdentity: true }));
  }
  return output;
}

export function getAllTimeProgramScores({ seasonArchives = [], teamId = "", programScores = [] } = {}) {
  const current = filterLiveRowsOutsideArchivedSeasons(getAllProgramScoreRows(programScores), { seasonArchives, teamId });
  const archived = teamArchives(seasonArchives, teamId).flatMap((archive) => toArray(archive?.programScoresSnapshot));
  return getAllProgramScoreRows([...archived, ...current]);
}

export function buildCurrentOffseasonProgramLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  programScores = [],
  drill,
  players = [],
  limit,
} = {}) {
  const current = filterLiveRowsOutsideArchivedSeasons(getAllProgramScoreRows(programScores), { seasonArchives, teamId });
  return getProgramLeaderboardRows(current, drill, players, limit)
    .map((row) => ({ ...row, timeScope: LEADERBOARD_TIME_SCOPES.CURRENT }));
}

export function buildAllTimeProgramLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  programScores = [],
  drill,
  players = [],
  limit,
} = {}) {
  const allTimeScores = getAllTimeProgramScores({ seasonArchives, teamId, programScores });
  const allTimePlayers = getAllTimeLeaderboardPlayers({ seasonArchives, teamId, players });
  return getProgramLeaderboardRows(allTimeScores, drill, allTimePlayers, limit)
    .map((row) => ({ ...row, timeScope: LEADERBOARD_TIME_SCOPES.ALL_TIME }));
}

export function getSeasonLeaderboardCoverage({ seasonArchives = [], teamId = "" } = {}) {
  const archives = teamArchives(seasonArchives, teamId);
  const ranges = getArchivedSeasonRanges({ seasonArchives: archives, teamId });
  return {
    archiveCount: archives.length,
    ranges,
    latestArchiveEndDate: ranges.map((range) => range.end).sort().reverse()[0] || "",
  };
}
