import { isInactiveRosterRecord } from "./rosterIdentity.js";

const ARCHIVE_STORAGE_KEY = "sl:season-archives";
const SESSION_STORAGE_KEY = "sl:session";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const inFlightArchiveKeys = new Map();

const toArray = (value) => (Array.isArray(value) ? value : []);
const deepClone = (value) => JSON.parse(JSON.stringify(value ?? null));
const normalizeKey = (value) => String(value || "").trim().toLowerCase();
const rowTeamId = (row) => String(row?.teamId ?? row?.team_id ?? "").trim();
const sameTeam = (teamId) => (row) => rowTeamId(row) === String(teamId || "").trim();
const profileName = (row = {}) => row.name || [row.firstName, row.lastName].filter(Boolean).join(" ") || [row.first_name, row.last_name].filter(Boolean).join(" ");

const numberFrom = (row, keys) => {
  for (const key of keys) {
    const value = Number(row?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const isActiveSeasonRosterRow = (row = {}) => {
  const role = normalizeKey(row.role || row.player_role || row.playerRole);
  const status = normalizeKey(row.rosterStatus || row.roster_status || row.status || row.membershipStatus || row.membership_status);
  if (role === "coach" || role === "assistant_coach" || row.isCoach === true) return false;
  if (row.removedFromTeam === true || row.removed_from_team === true) return false;
  if (row.removedFromTeamId || row.removed_from_team_id || row.deletedFromTeamId || row.deleted_from_team_id) return false;
  if (row.teamLocalDataDeleted === true || row.team_local_data_deleted === true || row.teamLocalDataDeletedFromTeamId || row.team_local_data_deleted_from_team_id) return false;
  if (["inactive", "removed", "removed_from_team", "archived", "deleted"].includes(status)) return false;
  return !isInactiveRosterRecord(row);
};

const identityTokens = (row = {}, { includeRecordId = false, participantFields = false } = {}) => {
  const values = [
    row.email,
    row.player_email,
    row.playerEmail,
    row.playerId,
    row.player_id,
    row.profileId,
    row.profile_id,
    row.userId,
    row.user_id,
    ...(includeRecordId ? [row.id] : []),
  ];
  if (participantFields) values.push(row.from, row.to, row.fromEmail, row.toEmail, row.challengerEmail, row.opponentEmail);
  const tokens = values.map(normalizeKey).filter(Boolean);
  const name = normalizeKey(profileName(row));
  if (name) tokens.push(`name:${name}`);
  return [...new Set(tokens)];
};

const activeIdentityIndex = (rosterSnapshot = []) => {
  const keys = new Set();
  for (const row of toArray(rosterSnapshot)) {
    for (const token of identityTokens(row, { includeRecordId: true })) keys.add(token);
  }
  return keys;
};

const rowMatchesActiveRoster = (row, activeKeys) => identityTokens(row).some((token) => activeKeys.has(token));

const validIsoDate = (value) => {
  const raw = String(value || "").trim();
  if (!ISO_DATE.test(raw)) return false;
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw;
};

export const normalizeArchiveDate = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  if (validIsoDate(raw)) return raw;
  if (/^[0-9]+$/.test(raw)) {
    const parsed = new Date(Number(raw));
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const rowDate = (row = {}) => {
  const candidates = [
    row.date,
    row.session_date,
    row.sessionDate,
    row.event_date,
    row.eventDate,
    row.logged_at,
    row.loggedAt,
    row.completed_at,
    row.completedAt,
    row.created_at,
    row.createdAt,
    row.updated_at,
    row.updatedAt,
    row.ts,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeArchiveDate(candidate);
    if (normalized) return normalized;
  }
  return "";
};

const inSeasonRange = (date, start, end) => Boolean(date && date >= start && date <= end);
const eventIdOf = (row = {}) => String(row.eventId ?? row.event_id ?? "").trim();
const sessionIdOf = (row = {}) => String(row.sessionId ?? row.session_id ?? "").trim();

const filterSnapshotRows = ({ rows, teamId, start, end, collection, diagnostics, playerLinked = false, activeKeys, resolveDate = rowDate }) => {
  const output = [];
  for (const row of toArray(rows)) {
    if (!sameTeam(teamId)(row)) {
      diagnostics.excludedOtherTeam[collection] += 1;
      continue;
    }
    if (playerLinked && !rowMatchesActiveRoster(row, activeKeys)) {
      diagnostics.excludedInactivePlayer[collection] += 1;
      continue;
    }
    const date = resolveDate(row);
    if (!date) {
      diagnostics.excludedMissingDate[collection] += 1;
      continue;
    }
    if (!inSeasonRange(date, start, end)) {
      diagnostics.excludedOutsideSeason[collection] += 1;
      continue;
    }
    output.push(row);
  }
  return deepClone(output);
};

const buildRosterEntries = (rosterSnapshot = []) => {
  const entries = [];
  const seen = new Set();
  for (const row of toArray(rosterSnapshot)) {
    const keys = identityTokens(row, { includeRecordId: true });
    const dedupeKey = keys[0] || normalizeKey(profileName(row)) || `roster:${entries.length}`;
    if (seen.has(dedupeKey)) continue;
    keys.forEach((key) => seen.add(key));
    seen.add(dedupeKey);
    entries.push({
      name: profileName(row) || row.email || row.player_email || "Archived player",
      email: row.email || row.player_email || "",
      playerId: row.playerId || row.player_id || row.id || "",
      profileId: row.profileId || row.profile_id || "",
      userId: row.userId || row.user_id || "",
      rosterSource: row.source || row.rosterSource || row.roster_source || "roster",
      identityKeys: new Set(keys),
    });
  }
  return entries;
};

const rowsForPlayer = (rows = [], entry = {}) => toArray(rows).filter((row) => identityTokens(row).some((key) => entry.identityKeys?.has(key)));
const latestDate = (rows = []) => rows.map(rowDate).filter(Boolean).sort().reverse()[0] || "";

const buildPlayerSeasonSummaries = ({ rosterSnapshot, homeScoresSnapshot, programScoresSnapshot, shotLogsSnapshot, eventRsvpSnapshot, scRsvpSnapshot, scLogSnapshot }) => buildRosterEntries(rosterSnapshot).map((entry) => {
  const homeRows = rowsForPlayer(homeScoresSnapshot, entry);
  const programRows = rowsForPlayer(programScoresSnapshot, entry);
  const shotRows = rowsForPlayer(shotLogsSnapshot, entry);
  const eventRows = rowsForPlayer(eventRsvpSnapshot, entry);
  const scRsvpRows = rowsForPlayer(scRsvpSnapshot, entry);
  const scLogRows = rowsForPlayer(scLogSnapshot, entry);
  const programValues = programRows.map((row) => numberFrom(row, ["score", "makes", "made"]));
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
    bestProgramScore: programValues.length ? Math.max(...programValues) : undefined,
    lastActivityDate: latestDate([...homeRows, ...programRows, ...shotRows, ...eventRows, ...scRsvpRows, ...scLogRows]),
  };
});

const makeArchiveId = ({ teamId, seasonName, createdAt }) => {
  const slug = String(seasonName || "season").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "season";
  return `season_${String(teamId).replace(/[^a-zA-Z0-9_-]/g, "")}_${slug}_${String(createdAt).replace(/[^0-9]/g, "") || Date.now()}`;
};

const archiveNaturalKey = (archive = {}) => [
  String(archive.teamId || archive.team_id || "").trim(),
  normalizeKey(archive.seasonName || archive.season_name),
  String(archive.seasonStartDate || archive.season_start_date || "").trim(),
  String(archive.seasonEndDate || archive.season_end_date || "").trim(),
].join("|");

const emptyDiagnostics = () => ({
  excludedOtherTeam: {},
  excludedInactivePlayer: {},
  excludedMissingDate: {},
  excludedOutsideSeason: {},
});

const initializeDiagnostics = (diagnostics, collections) => {
  for (const bucket of Object.values(diagnostics)) {
    for (const collection of collections) bucket[collection] = 0;
  }
};

export function buildSeasonArchive({
  teamId,
  coach,
  seasonName,
  seasonStartDate = "",
  seasonEndDate = "",
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
  if (!coach || coach.role !== "coach" || String(coach.teamId || "").trim() !== normalizedTeamId) {
    return { ok: false, error: "Only an authenticated coach for the active team can archive a season." };
  }
  if (!normalizedTeamId) return { ok: false, error: "A teamId is required to archive a season." };

  const normalizedSeasonName = String(seasonName || "").trim();
  if (!normalizedSeasonName) return { ok: false, error: "Season name is required." };
  const start = normalizeArchiveDate(seasonStartDate);
  const end = normalizeArchiveDate(seasonEndDate);
  if (!start || !end) return { ok: false, error: "Season start and end dates are required." };
  if (start > end) return { ok: false, error: "Season start date must be on or before the end date." };

  const naturalKey = [normalizedTeamId, normalizeKey(normalizedSeasonName), start, end].join("|");
  if (toArray(existingArchives).some((archive) => archiveNaturalKey(archive) === naturalKey)) {
    return { ok: false, error: "This season has already been archived for this team.", code: "duplicate_archive" };
  }

  const activeRosterSource = Array.isArray(activeRosterPlayers) ? activeRosterPlayers : [];
  const rosterSnapshot = deepClone(activeRosterSource.filter((row) => sameTeam(normalizedTeamId)(row) && isActiveSeasonRosterRow(row)));
  const activeKeys = activeIdentityIndex(rosterSnapshot);
  const playerProfileSnapshot = deepClone(toArray(playerProfiles).filter((row) => sameTeam(normalizedTeamId)(row) && identityTokens(row, { includeRecordId: true }).some((key) => activeKeys.has(key))));

  const collections = ["homeScores", "programScores", "shotLogs", "events", "eventRsvps", "scSessions", "scRsvps", "scLogs", "challenges"];
  const diagnostics = emptyDiagnostics();
  initializeDiagnostics(diagnostics, collections);

  const eventDateById = new Map(toArray(events).map((event) => [String(event?.id || ""), rowDate(event)]));
  const sessionDateById = new Map(toArray(scSessions).map((session) => [String(session?.id || ""), rowDate(session)]));
  const relatedEventDate = (row) => eventDateById.get(eventIdOf(row)) || rowDate(row);
  const relatedSessionDate = (row) => sessionDateById.get(sessionIdOf(row)) || rowDate(row);

  const common = { teamId: normalizedTeamId, start, end, diagnostics, activeKeys };
  const homeScoresSnapshot = filterSnapshotRows({ ...common, rows: scores, collection: "homeScores", playerLinked: true });
  const programScoresSnapshot = filterSnapshotRows({ ...common, rows: programScores, collection: "programScores", playerLinked: true });
  const shotLogsSnapshot = filterSnapshotRows({ ...common, rows: shotLogs, collection: "shotLogs", playerLinked: true });
  const eventSnapshot = filterSnapshotRows({ ...common, rows: events, collection: "events" });
  const eventRsvpSnapshot = filterSnapshotRows({ ...common, rows: rsvps, collection: "eventRsvps", playerLinked: true, resolveDate: relatedEventDate });
  const scSessionSnapshot = filterSnapshotRows({ ...common, rows: scSessions, collection: "scSessions" });
  const scRsvpSnapshot = filterSnapshotRows({ ...common, rows: scRsvps, collection: "scRsvps", playerLinked: true, resolveDate: relatedSessionDate });
  const scLogSnapshot = filterSnapshotRows({ ...common, rows: scLogs, collection: "scLogs", playerLinked: true, resolveDate: relatedSessionDate });

  const challengeRows = [];
  for (const row of toArray(challenges)) {
    if (!sameTeam(normalizedTeamId)(row)) {
      diagnostics.excludedOtherTeam.challenges += 1;
      continue;
    }
    const participants = identityTokens(row, { participantFields: true }).filter((token) => !token.startsWith("name:"));
    if (!participants.length || participants.some((token) => !activeKeys.has(token))) {
      diagnostics.excludedInactivePlayer.challenges += 1;
      continue;
    }
    const date = rowDate(row);
    if (!date) {
      diagnostics.excludedMissingDate.challenges += 1;
      continue;
    }
    if (!inSeasonRange(date, start, end)) {
      diagnostics.excludedOutsideSeason.challenges += 1;
      continue;
    }
    challengeRows.push(row);
  }
  const challengeSnapshot = deepClone(challengeRows);

  const programDrillSnapshot = deepClone(toArray(programDrills));
  const drillSnapshot = deepClone(toArray(drills));
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

  const createdAt = typeof now === "function" ? now() : now;
  const archive = {
    id: makeArchiveId({ teamId: normalizedTeamId, seasonName: normalizedSeasonName, createdAt }),
    teamId: normalizedTeamId,
    seasonName: normalizedSeasonName,
    seasonStartDate: start,
    seasonEndDate: end,
    createdAt,
    archivedBy: { email: coach.email || "", name: coach.name || "", role: "coach" },
    version: 2,
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
    diagnostics,
  };

  return { ok: true, archive };
}

const parseJson = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

const cachedArchives = () => {
  if (typeof window === "undefined") return [];
  return toArray(parseJson(window.localStorage?.getItem(ARCHIVE_STORAGE_KEY), []));
};

const cacheArchives = (archives) => {
  if (typeof window === "undefined") return;
  try { window.localStorage?.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(toArray(archives))); } catch {}
};

const currentSessionEmail = () => {
  if (typeof window === "undefined") return "";
  const session = parseJson(window.localStorage?.getItem(SESSION_STORAGE_KEY), null);
  return normalizeKey(session?.email);
};

const archiveErrorMessage = (code, status = 0) => {
  if (status === 401 || code === "unauthorized") return "Sign in again before archiving the season.";
  if (status === 403 || code === "forbidden") return "Only an authorized coach for this team can archive the season.";
  if (status === 409 || code === "duplicate_archive") return "This season has already been archived for this team.";
  if (status === 429 || code === "rate_limited") return "Too many archive attempts. Wait briefly and try again.";
  if (code === "archive_snapshot_too_large") return "This archive is too large to save safely. Contact support.";
  if (code === "invalid_season_range") return "The season date range is invalid.";
  return "Could not save the season archive to the server. No archive was created.";
};

export async function loadSeasonArchivesRemote({ requesterEmail = currentSessionEmail(), fetchImpl = globalThis.fetch } = {}) {
  const requester = normalizeKey(requesterEmail);
  if (!requester || typeof fetchImpl !== "function") return { ok: false, error: "unauthorized", archives: cachedArchives() };
  try {
    const response = await fetchImpl("/v1/season-archives", { headers: { "x-user-id": requester } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: body?.error || "archive_load_failed", archives: cachedArchives() };
    const archives = toArray(body?.archives);
    cacheArchives(archives);
    return { ok: true, archives };
  } catch {
    return { ok: false, error: "network_error", archives: cachedArchives() };
  }
}

export async function persistSeasonArchiveRemote({ archive, coach, fetchImpl = globalThis.fetch } = {}) {
  if (!archive || typeof fetchImpl !== "function") return { ok: false, error: "archive_write_failed" };
  const requester = normalizeKey(coach?.email || currentSessionEmail());
  if (!requester) return { ok: false, error: "unauthorized" };
  try {
    const response = await fetchImpl("/v1/season-archives", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": requester },
      body: JSON.stringify({ team_id: archive.teamId, archive }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: archiveErrorMessage(body?.error, response.status), code: body?.error || "archive_write_failed" };
    return { ok: true, archive: body?.archive || archive };
  } catch {
    return { ok: false, error: archiveErrorMessage("network_error"), code: "network_error" };
  }
}

export async function createSeasonArchive(input = {}) {
  const built = buildSeasonArchive(input);
  if (!built.ok) return built;
  const naturalKey = archiveNaturalKey(built.archive);
  if (inFlightArchiveKeys.has(naturalKey)) return inFlightArchiveKeys.get(naturalKey);

  const task = (async () => {
    const persist = typeof input.persistArchive === "function" ? input.persistArchive : persistSeasonArchiveRemote;
    const saved = await persist({ archive: built.archive, coach: input.coach, fetchImpl: input.fetchImpl });
    if (!saved?.ok) return { ok: false, error: saved?.error || "Could not save the season archive to the server. No archive was created.", code: saved?.code || "archive_write_failed" };

    const archive = deepClone(saved.archive || built.archive);
    const existing = Array.isArray(input.existingArchives) ? input.existingArchives : [];
    if (!existing.some((row) => row?.id === archive.id || archiveNaturalKey(row) === archiveNaturalKey(archive))) existing.push(archive);
    const seasonArchives = Array.isArray(input.existingArchives) ? input.existingArchives : [...existing];
    cacheArchives(seasonArchives);
    return { ok: true, archive, seasonArchives };
  })().finally(() => inFlightArchiveKeys.delete(naturalKey));

  inFlightArchiveKeys.set(naturalKey, task);
  return task;
}

function installSeasonArchiveStorageBridge() {
  if (typeof window === "undefined" || window.__shotlabSeasonArchiveStorageBridge) return;
  window.__shotlabSeasonArchiveStorageBridge = true;
  const original = window.storage;
  const originalGet = typeof original?.get === "function" ? original.get.bind(original) : null;
  const originalSet = typeof original?.set === "function" ? original.set.bind(original) : null;

  try {
    window.storage = {
      ...(original && typeof original === "object" ? original : {}),
      async get(key, strict) {
        if (key !== ARCHIVE_STORAGE_KEY) return originalGet ? originalGet(key, strict) : undefined;
        const requester = currentSessionEmail();
        if (requester) {
          const remote = await loadSeasonArchivesRemote({ requesterEmail: requester });
          return { value: JSON.stringify(remote.archives) };
        }
        return { value: JSON.stringify(cachedArchives()) };
      },
      async set(key, value, strict) {
        if (key !== ARCHIVE_STORAGE_KEY) return originalSet ? originalSet(key, value, strict) : undefined;
        try { window.localStorage?.setItem(ARCHIVE_STORAGE_KEY, String(value || "[]")); } catch {}
        return { value: String(value || "[]") };
      },
    };
  } catch {}
}

installSeasonArchiveStorageBridge();

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
