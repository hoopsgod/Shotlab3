const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const cleanText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const SHOT_LOG_SYNC_STATES = new Set(["remote_saved", "background_saved", "syncing", "local_pending", "failed_sync"]);
const SHOT_LOG_SYNC_SOURCES = new Set(["remote", "local"]);

export const normalizeScoreRowForDb = (row = {}) => {
  const id = cleanText(row.id);
  const email = cleanText(row.email).toLowerCase();
  const playerId = cleanText(row.player_id || row.playerId || email);
  const teamId = cleanText(row.team_id || row.teamId);
  if (!id || !email || !playerId || !teamId) return null;

  const payload = {
    id,
    email,
    name: cleanText(row.name),
    player_id: playerId,
    team_id: teamId,
    drill_id: cleanText(row.drill_id || row.drillId),
    score: toFiniteNumber(row.score),
    date: cleanText(row.date),
    ts: toFiniteNumber(row.ts),
    src: cleanText(row.src || "home") || "home",
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};


export const normalizeProgramScoreRowForDb = (row = {}) => {
  const id = cleanText(row.id);
  const teamId = cleanText(row.team_id || row.teamId);
  const playerId = cleanText(row.player_id || row.playerId);
  const playerEmail = cleanText(row.player_email || row.playerEmail || row.email).toLowerCase();
  const drillId = cleanText(row.drill_id || row.drillId);
  const drillName = cleanText(row.drill_name || row.drillName || row.name || row.drillTitle);
  const score = toFiniteNumber(row.score);
  if (!id || !teamId || !playerId || !playerEmail || !drillId || !drillName || score === null) return null;

  const payload = {
    id,
    team_id: teamId,
    player_id: playerId,
    player_email: playerEmail,
    player_name: cleanText(row.player_name || row.playerName || row.name),
    drill_id: drillId,
    drill_name: drillName,
    score,
    session_date: cleanText(row.session_date || row.sessionDate || row.date),
    logged_at: cleanText(row.logged_at || row.loggedAt),
    src: "program",
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const normalizeProgramScoreRowForApp = (row = {}) => {
  const id = cleanText(row.id);
  const teamId = cleanText(row.team_id || row.teamId);
  const playerId = cleanText(row.player_id || row.playerId);
  const email = cleanText(row.player_email || row.playerEmail || row.email).toLowerCase();
  const drillId = cleanText(row.drill_id || row.drillId);
  const drillName = cleanText(row.drill_name || row.drillName);
  const score = toFiniteNumber(row.score);
  if (!id || !teamId || !playerId || !email || !drillId || score === null) return null;
  const loggedAt = cleanText(row.logged_at || row.loggedAt);
  return {
    id,
    email,
    playerId,
    player_id: playerId,
    teamId,
    team_id: teamId,
    name: cleanText(row.player_name || row.playerName || row.name),
    drillId,
    drill_id: drillId,
    drillName,
    drill_name: drillName,
    score,
    date: cleanText(row.session_date || row.sessionDate || row.date),
    ts: toFiniteNumber(row.ts) || (loggedAt ? Date.parse(loggedAt) : null),
    src: "program",
  };
};

export const formatRemotePersistErrorForDebug = (error) => {
  const payload = Array.isArray(error?.remoteRows)
    ? JSON.stringify(error.remoteRows)
    : error?.remoteRows && typeof error.remoteRows === "object"
      ? JSON.stringify(error.remoteRows)
      : "";
  const parts = [
    ["message", error?.message || "remote_persist_failed"],
    ["code", error?.code],
    ["details", error?.details],
    ["hint", error?.hint],
    ["payload", payload],
  ]
    .map(([label, value]) => [label, cleanText(value)])
    .filter(([, value]) => value);
  return parts.map(([label, value]) => `${label}: ${value}`).join(" | ");
};

export const normalizeShotLogRowForDb = (row = {}) => {
  const id = cleanText(row.id);
  const email = cleanText(row.email).toLowerCase();
  const playerId = cleanText(row.player_id || row.playerId || email);
  const teamId = cleanText(row.team_id || row.teamId);
  if (!id || !email || !playerId || !teamId) return null;

  const payload = {
    id,
    email,
    name: cleanText(row.name),
    player_id: playerId,
    team_id: teamId,
    made: toFiniteNumber(row.made),
    date: cleanText(row.date),
    ts: toFiniteNumber(row.ts),
    hide_from_leaderboards:
      typeof row.hide_from_leaderboards === "boolean"
        ? row.hide_from_leaderboards
        : typeof row.hideFromLeaderboards === "boolean"
          ? row.hideFromLeaderboards
          : undefined,
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== undefined));
};

export const normalizeShotLogRowForApp = (row = {}, options = {}) => {
  const id = cleanText(row.id);
  const email = cleanText(row.email || row.player_email || row.playerId || row.player_id).toLowerCase();
  const playerId = cleanText(row.player_id || row.playerId || email).toLowerCase();
  const teamId = cleanText(row.team_id || row.teamId);
  if (!id || !email || !playerId || !teamId) return null;

  const explicitSyncState = cleanText(row.syncState || row.sync_state);
  const source = SHOT_LOG_SYNC_SOURCES.has(options?.source) ? options.source : "local";
  // Treat backend table reads as the reliable confirmation signal for coach-visible
  // rows. Local-only stale/pending rows are background-saved so hydration does not
  // flash the Team Sync panel unless they carry an explicit failed_sync state.
  const localBackgroundSaved = source === "local" && (!explicitSyncState || explicitSyncState === "remote_saved" || explicitSyncState === "local_pending");
  const syncState = source === "remote"
    ? "remote_saved"
    : explicitSyncState === "failed_sync"
      ? "failed_sync"
      : localBackgroundSaved
        ? "background_saved"
        : SHOT_LOG_SYNC_STATES.has(explicitSyncState)
          ? explicitSyncState
          : "background_saved";

  const payload = {
    id,
    email,
    playerId,
    teamId,
    name: cleanText(row.name) || email,
    made: toFiniteNumber(row.made) || 0,
    date: cleanText(row.date),
    ts: toFiniteNumber(row.ts),
    hideFromLeaderboards:
      typeof row.hideFromLeaderboards === "boolean"
        ? row.hideFromLeaderboards
        : typeof row.hide_from_leaderboards === "boolean"
          ? row.hide_from_leaderboards
          : undefined,
    syncState,
    syncSource: source,
    syncError: syncState === "failed_sync" ? cleanText(row.syncError || row.sync_error) : "",
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== undefined));
};


export const normalizeEventRowForDb = (row = {}) => {
  const id = cleanText(row.id);
  const teamId = cleanText(row.team_id || row.teamId);
  if (!id || !teamId) return null;

  const payload = {
    id,
    title: cleanText(row.title),
    date: cleanText(row.date),
    time: cleanText(row.time),
    location: cleanText(row.location),
    description: cleanText(row.description || row.desc),
    type: cleanText(row.type),
    team_id: teamId,
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const normalizeEventRowForApp = (row = {}) => {
  const id = cleanText(row.id);
  const teamId = cleanText(row.team_id || row.teamId);
  if (!id || !teamId) return null;

  const ownerCoachId = cleanText(row.owner_coach_id || row.ownerCoachId);

  const payload = {
    id,
    title: cleanText(row.title),
    date: cleanText(row.date),
    time: cleanText(row.time),
    location: cleanText(row.location),
    desc: cleanText(row.description || row.desc),
    type: cleanText(row.type),
    teamId,
    ...(ownerCoachId ? { ownerCoachId } : {}),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const normalizePlayerRowForApp = (row = {}) => {
  const teamId = cleanText(row.team_id ?? row.teamId);
  const email = cleanText(row.email).toLowerCase();
  const id = cleanText(row.id || (teamId && email ? `player:${teamId}:${email}` : email ? `player:unassigned:${email}` : ""));
  if (!id || !email) return null;
  const payload = {
    id,
    teamId: teamId || null,
    email,
    name: cleanText(row.name),
    role: cleanText(row.role),
    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),
    updatedAt: toFiniteNumber(row.updatedAt ?? row.updated_at),
    hideFromLeaderboards:
      typeof row.hideFromLeaderboards === "boolean"
        ? row.hideFromLeaderboards
        : typeof row.hide_from_leaderboards === "boolean"
          ? row.hide_from_leaderboards
          : undefined,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined));
};

export const normalizePlayerRowForDb = (row = {}) => {
  const app = normalizePlayerRowForApp(row);
  if (!app) return null;
  const payload = {
    id: app.id,
    team_id: app.teamId || null,
    email: app.email,
    name: app.name,
    role: app.role,
    created_at: app.createdAt,
    updated_at: app.updatedAt,
    hide_from_leaderboards: app.hideFromLeaderboards,
  };
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => key === "team_id" || (value !== null && value !== "" && value !== undefined)));
};

export const normalizePlayerProfileRowForApp = (row = {}) => {
  const teamId = cleanText(row.team_id || row.teamId);
  const userIdRaw = row.user_id ?? row.userId;
  const userId = userIdRaw === null ? null : cleanText(userIdRaw).toLowerCase();
  const email = cleanText(row.email).toLowerCase();
  const id = cleanText(row.id || (teamId && email ? `pp-shell:${teamId}:${email}` : ""));
  if (!id || !teamId) return null;
  const payload = {
    id,
    teamId,
    userId,
    email: email || undefined,
    firstName: cleanText(row.firstName || row.first_name),
    lastName: cleanText(row.lastName || row.last_name),
    createdAt: toFiniteNumber(row.createdAt ?? row.created_at),
    updatedAt: toFiniteNumber(row.updatedAt ?? row.updated_at),
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined));
};

export const normalizePlayerProfileRowForDb = (row = {}) => {
  const app = normalizePlayerProfileRowForApp(row);
  if (!app) return null;
  const payload = {
    id: app.id,
    team_id: app.teamId,
    user_id: app.userId,
    email: app.email,
    first_name: app.firstName,
    last_name: app.lastName,
    created_at: app.createdAt,
    updated_at: app.updatedAt,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined));
};

export const mergeHydratedRows = (key, localRows, remoteRows) => {
  const local = Array.isArray(localRows) ? localRows : [];
  const remote = Array.isArray(remoteRows) ? remoteRows : [];
  if (key === "sl:events") {
    const byId = new Map();
    local.map(normalizeEventRowForApp).filter(Boolean).forEach((row) => byId.set(row.id, row));
    remote.map(normalizeEventRowForApp).filter(Boolean).forEach((row) => byId.set(row.id, row));
    return Array.from(byId.values());
  }
  if (key === "sl:players") {
    const merged = [];
    const idx = new Map();
    const keyFor = (row) => row.id || `${row.email}::${row.teamId}`;
    for (const row of local.map(normalizePlayerRowForApp).filter(Boolean)) {
      idx.set(keyFor(row), merged.push(row) - 1);
    }
    for (const row of remote.map(normalizePlayerRowForApp).filter(Boolean)) {
      const k = keyFor(row);
      if (idx.has(k)) merged[idx.get(k)] = row; else idx.set(k, merged.push(row) - 1);
    }
    return merged;
  }
  if (key === "sl:player-profiles") {
    const merged = [];
    const idx = new Map();
    const keyFor = (row) => row.id || (row.email ? `${row.email}::${row.teamId}` : `${row.userId}::${row.teamId}`);
    for (const row of local.map(normalizePlayerProfileRowForApp).filter(Boolean)) idx.set(keyFor(row), merged.push(row) - 1);
    for (const row of remote.map(normalizePlayerProfileRowForApp).filter(Boolean)) {
      const k = keyFor(row);
      if (idx.has(k)) merged[idx.get(k)] = row; else idx.set(k, merged.push(row) - 1);
    }
    return merged;
  }

  if (key === "sl:rsvps") {
    const merged = [];
    const idx = new Map();
    const keyFor = (row) => row.id || `${row.eventId}::${row.teamId}::${row.playerId || row.email}`;
    for (const row of local.map(normalizeRsvpRowForApp).filter(Boolean)) idx.set(keyFor(row), merged.push(row) - 1);
    for (const row of remote.map(normalizeRsvpRowForApp).filter(Boolean)) {
      const k = keyFor(row);
      if (idx.has(k)) merged[idx.get(k)] = row; else idx.set(k, merged.push(row) - 1);
    }
    return merged;
  }

  if (key === "sl:shotlogs") {
    const merged = [];
    const idx = new Map();
    for (const row of local.map((item) => normalizeShotLogRowForApp(item, { source: "local" })).filter(Boolean)) {
      idx.set(row.id, merged.push(row) - 1);
    }
    for (const row of remote.map((item) => normalizeShotLogRowForApp(item, { source: "remote" })).filter(Boolean)) {
      if (idx.has(row.id)) merged[idx.get(row.id)] = row;
      else idx.set(row.id, merged.push(row) - 1);
    }
    return merged;
  }
  return [];
};

export const normalizeRsvpRowForDb = (row = {}) => {
  const id = cleanText(row.id);
  const eventId = cleanText(row.event_id || row.eventId);
  const teamId = cleanText(row.team_id || row.teamId);
  const email = cleanText(row.email).toLowerCase();
  const playerId = cleanText(row.player_id || row.playerId || email);
  if (!id || !eventId || !teamId || !email || !playerId) return null;

  const payload = {
    id,
    event_id: eventId,
    team_id: teamId,
    player_id: playerId,
    email,
    name: cleanText(row.name),
    ts: toFiniteNumber(row.ts),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const normalizeRsvpRowForApp = (row = {}) => {
  const id = cleanText(row.id);
  const eventId = cleanText(row.event_id || row.eventId);
  const teamId = cleanText(row.team_id || row.teamId);
  const email = cleanText(row.email).toLowerCase();
  const playerId = cleanText(row.player_id || row.playerId || email);
  if (!id || !eventId || !teamId || !email || !playerId) return null;

  const payload = {
    id,
    eventId,
    teamId,
    playerId,
    email,
    name: cleanText(row.name),
    ts: toFiniteNumber(row.ts),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const buildAppRows = (key, rows, options = {}) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (key === "sl:events") return rows.map(normalizeEventRowForApp).filter(Boolean);
  if (key === "sl:players") return rows.map(normalizePlayerRowForApp).filter(Boolean);
  if (key === "sl:player-profiles") return rows.map(normalizePlayerProfileRowForApp).filter(Boolean);
  if (key === "sl:rsvps") return rows.map(normalizeRsvpRowForApp).filter(Boolean);
  if (key === "sl:shotlogs") return rows.map((row) => normalizeShotLogRowForApp(row, options)).filter(Boolean);
  if (key === "sl:program-scores") return rows.map(normalizeProgramScoreRowForApp).filter(Boolean);
  return rows;
};

export const buildRemoteRows = (key, rows, options = {}) => {
  const sourceRows = Array.isArray(options?.remoteRows) ? options.remoteRows : rows;
  if (!Array.isArray(sourceRows) || sourceRows.length === 0) return [];

  if (key === "sl:scores") return sourceRows.map(normalizeScoreRowForDb).filter(Boolean);
  if (key === "sl:program-scores") return sourceRows.map(normalizeProgramScoreRowForDb).filter(Boolean);
  if (key === "sl:shotlogs") return sourceRows.filter((row) => row?.syncState === "remote_saved" && row?.syncSource === "remote").map(normalizeShotLogRowForDb).filter(Boolean);
  if (key === "sl:events") return sourceRows.map(normalizeEventRowForDb).filter(Boolean);
  if (key === "sl:players") return sourceRows.map(normalizePlayerRowForDb).filter(Boolean);
  if (key === "sl:player-profiles") return sourceRows.map(normalizePlayerProfileRowForDb).filter(Boolean);
  if (key === "sl:rsvps") return sourceRows.map(normalizeRsvpRowForDb).filter(Boolean);
  return sourceRows;
};
