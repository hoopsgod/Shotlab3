import { buildAtHomeLeaderboardRows } from "./homeLeaderboardRows.js";
import { getAllProgramScoreRows, getProgramLeaderboardRows } from "./programDrillScoring.js";
import { normalizeArchiveDate } from "./seasonArchive.js";
import { filterActiveTeamLeaderboardRows, getActiveTeamPlayerIdentity } from "./playerDataManagement.js";

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

const teamArchives = (seasonArchives = [], teamId = "") =>
  toArray(seasonArchives).filter((archive) => archiveTeamMatches(archive, teamId));

const activeIdentityFor = ({ players = [], profiles = [], teamId = "" } = {}) => {
  const combined = [...toArray(players), ...toArray(profiles)];
  if (!clean(teamId)) return { players: combined, keySet: new Set(), emailSet: new Set(), nameSet: new Set() };
  return getActiveTeamPlayerIdentity(combined, teamId);
};

const rowMatchesIdentity = (row = {}, identity = {}) => {
  const allowed = new Set([...(identity?.keySet || []), ...(identity?.emailSet || [])]);
  if (!allowed.size) return true;
  return identityTokens(row).some((token) => allowed.has(token));
};

export function getArchivedSeasonRanges({ seasonArchives = [], teamId = "" } = {}) {
  const ranges = teamArchives(seasonArchives, teamId)
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
      merged.push({
        ...range,
        archiveIds: range.archiveId ? [range.archiveId] : [],
        seasonNames: range.seasonName ? [range.seasonName] : [],
      });
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
  const rawRows = buildAtHomeLeaderboardRows({
    scores: currentScores,
    shotLogs: currentShotLogs,
    programDrills,
    players,
    profiles,
  });
  const activeIdentity = activeIdentityFor({ players, profiles, teamId });
  const activeRows = activeIdentity.players.length > 0
    ? filterActiveTeamLeaderboardRows(rawRows, activeIdentity.keySet, activeIdentity.emailSet, activeIdentity.nameSet)
    : rawRows;
  const rows = activeRows.map((row) => ({ ...row, timeScope: LEADERBOARD_TIME_SCOPES.CURRENT }));
  return Number.isFinite(limit) ? rows.slice(0, limit) : rows;
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

const relatedId = (row = {}, fields = []) => {
  for (const field of fields) {
    const value = clean(row?.[field]);
    if (value) return value;
  }
  return "";
};

const withRelatedDates = (rows = [], schedules = [], relationFields = []) => {
  const scheduleDates = new Map(
    toArray(schedules)
      .map((schedule) => [clean(schedule?.id), rowDate(schedule)])
      .filter(([id, date]) => id && date),
  );
  return toArray(rows).map((row) => {
    if (rowDate(row)) return row;
    const date = scheduleDates.get(relatedId(row, relationFields)) || "";
    return date ? { ...row, date } : row;
  });
};

const participationKey = (row = {}, relationFields = [], kind = "record") => {
  const identity = identityTokens(row).sort()[0] || `name:${lower(playerName(row))}`;
  if (!identity || identity === "name:") return "";
  if (kind === "event") {
    const eventId = relatedId(row, relationFields);
    return eventId ? `${identity}::event::${eventId}` : "";
  }
  const id = clean(row?.id);
  if (id) return `${identity}::log::${id}`;
  const fallback = [rowDate(row), clean(row?.sport), clean(row?.place), clean(row?.time), clean(row?.ts)].join("::");
  return fallback.replaceAll(":", "") ? `${identity}::log::${fallback}` : "";
};

function buildCurrentParticipationLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  participationRows = [],
  scheduleRows = [],
  relationFields = [],
  players = [],
  profiles = [],
  kind = "record",
  metric = "participation",
  limit,
} = {}) {
  const datedRows = withRelatedDates(participationRows, scheduleRows, relationFields);
  const currentRows = filterLiveRowsOutsideArchivedSeasons(datedRows, { seasonArchives, teamId });
  const activeIdentity = activeIdentityFor({ players, profiles, teamId });
  const eligibleRows = activeIdentity.players.length > 0
    ? currentRows.filter((row) => rowMatchesIdentity(row, activeIdentity))
    : currentRows;
  const accumulator = buildIdentityAccumulator();
  const seen = new Set();
  for (const row of eligibleRows) {
    const key = participationKey(row, relationFields, kind);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    accumulator.add(row, 1, { source: "current", lastActivityDate: rowDate(row) });
  }
  return accumulator.rows(limit).map((row) => ({
    ...row,
    total_home_shots: undefined,
    metricValue: row.total,
    metric,
    timeScope: LEADERBOARD_TIME_SCOPES.CURRENT,
  }));
}

function buildAllTimeParticipationLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  summaryField,
  currentRows = [],
  metric = "participation",
  limit,
} = {}) {
  const accumulator = buildIdentityAccumulator();
  for (const archive of teamArchives(seasonArchives, teamId)) {
    for (const summary of toArray(archive?.playerSeasonSummaries)) {
      accumulator.add(
        summary,
        finiteNumber(summary?.[summaryField]),
        { source: "archive", archiveId: clean(archive?.id), lastActivityDate: summary?.lastActivityDate },
      );
    }
  }
  currentRows.forEach((row) => accumulator.add(
    row,
    row?.metricValue ?? row?.total ?? row?.score,
    { source: "current", lastActivityDate: row?.lastActivityDate },
  ));
  return accumulator.rows(limit).map((row) => ({
    ...row,
    total_home_shots: undefined,
    metricValue: row.total,
    metric,
    timeScope: LEADERBOARD_TIME_SCOPES.ALL_TIME,
  }));
}

export function buildCurrentEventParticipationLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  events = [],
  rsvps = [],
  players = [],
  profiles = [],
  limit,
} = {}) {
  return buildCurrentParticipationLeaderboardRows({
    seasonArchives,
    teamId,
    participationRows: rsvps,
    scheduleRows: events,
    relationFields: ["eventId", "event_id"],
    players,
    profiles,
    kind: "event",
    metric: "events_attended",
    limit,
  });
}

export function buildAllTimeEventParticipationLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  events = [],
  rsvps = [],
  players = [],
  profiles = [],
  limit,
} = {}) {
  const currentRows = buildCurrentEventParticipationLeaderboardRows({
    seasonArchives,
    teamId,
    events,
    rsvps,
    players,
    profiles,
  });
  return buildAllTimeParticipationLeaderboardRows({
    seasonArchives,
    teamId,
    summaryField: "eventRsvpCount",
    currentRows,
    metric: "events_attended",
    limit,
  });
}

export function buildCurrentStrengthParticipationLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  scSessions = [],
  scLogs = [],
  players = [],
  profiles = [],
  limit,
} = {}) {
  return buildCurrentParticipationLeaderboardRows({
    seasonArchives,
    teamId,
    participationRows: scLogs,
    scheduleRows: scSessions,
    relationFields: ["sessionId", "session_id"],
    players,
    profiles,
    kind: "log",
    metric: "strength_sessions_completed",
    limit,
  });
}

export function buildAllTimeStrengthParticipationLeaderboardRows({
  seasonArchives = [],
  teamId = "",
  scSessions = [],
  scLogs = [],
  players = [],
  profiles = [],
  limit,
} = {}) {
  const currentRows = buildCurrentStrengthParticipationLeaderboardRows({
    seasonArchives,
    teamId,
    scSessions,
    scLogs,
    players,
    profiles,
  });
  return buildAllTimeParticipationLeaderboardRows({
    seasonArchives,
    teamId,
    summaryField: "scLogCount",
    currentRows,
    metric: "strength_sessions_completed",
    limit,
  });
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
  const aliasToIndex = new Map();
  const remember = (player = {}) => {
    const tokens = identityTokens(player);
    const fallbackToken = `name:${lower(playerName(player))}`;
    if (!tokens.length && fallbackToken === "name:") return;
    const existingIndex = tokens.map((token) => aliasToIndex.get(token)).find((index) => Number.isInteger(index));
    const archivedIdentity = player?.archivedLeaderboardIdentity === true;
    const normalizedEmail = lower(player?.email ?? player?.player_email);
    const normalizedPlayerId = clean(player?.playerId ?? player?.player_id ?? player?.userId ?? player?.user_id ?? player?.profileId ?? player?.profile_id ?? normalizedEmail);
    const normalized = {
      ...player,
      teamId: clean(player?.teamId ?? player?.team_id ?? teamId),
      role: player?.role === "coach" ? "player" : (player?.role || "player"),
      name: playerName(player) || normalizedEmail || "Archived player",
      email: normalizedEmail,
      playerId: normalizedPlayerId,
      archivedLeaderboardIdentity: archivedIdentity,
      ...(archivedIdentity ? {
        archived: false,
        removed: false,
        deleted: false,
        hidden: false,
        hideFromLeaderboards: false,
        hide_from_leaderboards: false,
        rosterStatus: "active",
        roster_status: "active",
      } : {}),
    };

    const index = Number.isInteger(existingIndex) ? existingIndex : output.length;
    if (!Number.isInteger(existingIndex)) output.push(normalized);
    else {
      const existing = output[index];
      const preferredPlayerId = normalized.playerId && normalized.playerId !== normalized.email
        ? normalized.playerId
        : existing.playerId || normalized.playerId;
      output[index] = {
        ...existing,
        ...(archivedIdentity ? normalized : {}),
        email: existing.email || normalized.email,
        playerId: preferredPlayerId,
        name: existing.name || normalized.name,
        archivedLeaderboardIdentity: existing.archivedLeaderboardIdentity || archivedIdentity,
      };
    }

    [...tokens, fallbackToken, normalized.email, normalized.playerId]
      .filter((token) => token && token !== "name:")
      .forEach((token) => aliasToIndex.set(lower(token), index));
  };

  const activeIdentity = activeIdentityFor({ players, teamId });
  const currentPlayers = clean(teamId) ? activeIdentity.players : toArray(players);
  currentPlayers.forEach(remember);
  for (const archive of teamArchives(seasonArchives, teamId)) {
    toArray(archive?.rosterSnapshot).forEach((player) => remember({ ...player, archivedLeaderboardIdentity: true }));
    toArray(archive?.playerSeasonSummaries).forEach((player) => remember({ ...player, archivedLeaderboardIdentity: true }));
  }
  return output;
}

export function getAllTimeProgramScores({ seasonArchives = [], teamId = "", programScores = [], players = [] } = {}) {
  const activeIdentity = activeIdentityFor({ players, teamId });
  const current = filterLiveRowsOutsideArchivedSeasons(getAllProgramScoreRows(programScores), { seasonArchives, teamId })
    .filter((row) => activeIdentity.players.length === 0 || rowMatchesIdentity(row, activeIdentity));
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
  const allTimeScores = getAllTimeProgramScores({ seasonArchives, teamId, programScores, players });
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
