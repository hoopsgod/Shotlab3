const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const cleanText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

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


export const normalizeEventRowForDb = (row = {}) => {
  const id = cleanText(row.id);
  const teamId = cleanText(row.team_id || row.teamId);
  const ownerCoachId = cleanText(row.owner_coach_id || row.ownerCoachId);
  if (!id || !teamId || !ownerCoachId) return null;

  const payload = {
    id,
    title: cleanText(row.title),
    date: cleanText(row.date),
    time: cleanText(row.time),
    location: cleanText(row.location),
    desc: cleanText(row.desc),
    type: cleanText(row.type),
    team_id: teamId,
    owner_coach_id: ownerCoachId,
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const normalizeEventRowForApp = (row = {}) => {
  const id = cleanText(row.id);
  const teamId = cleanText(row.team_id || row.teamId);
  const ownerCoachId = cleanText(row.owner_coach_id || row.ownerCoachId);
  if (!id || !teamId || !ownerCoachId) return null;

  const payload = {
    id,
    title: cleanText(row.title),
    date: cleanText(row.date),
    time: cleanText(row.time),
    location: cleanText(row.location),
    desc: cleanText(row.desc),
    type: cleanText(row.type),
    teamId,
    ownerCoachId,
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
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

export const normalizePlayerRowForDb = (row = {}) => {
  const email = cleanText(row.email).toLowerCase();
  const teamId = cleanText(row.team_id || row.teamId);
  const id = cleanText(row.id || (teamId && email ? `player:${teamId}:${email}` : ""));
  if (!id || !email || !teamId) return null;

  const payload = {
    id,
    email,
    team_id: teamId,
    name: cleanText(row.name),
    role: cleanText(row.role),
    pw: cleanText(row.pw),
    must_change_password:
      typeof row.must_change_password === "boolean"
        ? row.must_change_password
        : typeof row.mustChangePassword === "boolean"
          ? row.mustChangePassword
          : undefined,
    hide_from_leaderboards:
      typeof row.hide_from_leaderboards === "boolean"
        ? row.hide_from_leaderboards
        : typeof row.hideFromLeaderboards === "boolean"
          ? row.hideFromLeaderboards
          : undefined,
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== undefined));
};

export const normalizePlayerProfileRowForDb = (row = {}) => {
  const teamId = cleanText(row.team_id || row.teamId);
  const email = cleanText(row.user_id || row.userId || row.email).toLowerCase();
  const id = cleanText(row.id || (teamId && email ? `pp-shell:${teamId}:${email}` : ""));
  if (!id || !teamId) return null;

  const payload = {
    id,
    user_id: email || null,
    team_id: teamId,
    first_name: cleanText(row.first_name || row.firstName),
    last_name: cleanText(row.last_name || row.lastName),
    created_at: toFiniteNumber(row.created_at || row.createdAt),
    role: cleanText(row.role),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const buildAppRows = (key, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (key === "sl:events") return rows.map(normalizeEventRowForApp).filter(Boolean);
  if (key === "sl:players") return rows.map(normalizePlayerRowForDb).filter(Boolean).map((row) => ({
    id: row.id,
    email: row.email,
    teamId: row.team_id,
    name: row.name,
    role: row.role,
    pw: row.pw,
    mustChangePassword: row.must_change_password,
    hideFromLeaderboards: row.hide_from_leaderboards,
  })).map((row) => Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined && value !== "")));
  if (key === "sl:player-profiles") return rows.map(normalizePlayerProfileRowForDb).filter(Boolean).map((row) => ({
    id: row.id,
    userId: row.user_id || null,
    teamId: row.team_id,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
    role: row.role,
    email: cleanText(row.email).toLowerCase() || undefined,
  })).map((row) => Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined && value !== "")));
  if (key === "sl:rsvps") return rows.map(normalizeRsvpRowForApp).filter(Boolean);
  return rows;
};

const getMergeIdentity = (key, row = {}) => {
  if (!row || typeof row !== "object") return "";
  if (key === "sl:events") return cleanText(row.id);
  if (key === "sl:players") return cleanText(row.id || (cleanText(row.teamId || row.team_id) && cleanText(row.email).toLowerCase() ? `player:${cleanText(row.teamId || row.team_id)}:${cleanText(row.email).toLowerCase()}` : ""));
  if (key === "sl:player-profiles") return cleanText(row.id || (cleanText(row.teamId || row.team_id) && cleanText(row.userId || row.user_id || row.email).toLowerCase() ? `pp-shell:${cleanText(row.teamId || row.team_id)}:${cleanText(row.userId || row.user_id || row.email).toLowerCase()}` : ""));
  return cleanText(row.id);
};

export const mergeHydratedRows = (key, localRows, remoteRows) => {
  const local = buildAppRows(key, Array.isArray(localRows) ? localRows : []);
  const remote = buildAppRows(key, Array.isArray(remoteRows) ? remoteRows : []);
  if (local.length === 0) return remote;
  if (remote.length === 0) return local;

  const merged = new Map();
  for (const row of local) {
    const identity = getMergeIdentity(key, row);
    if (identity) merged.set(identity, row);
  }
  for (const row of remote) {
    const identity = getMergeIdentity(key, row);
    if (identity) merged.set(identity, row);
  }
  return [...merged.values()];
};

export const buildRemoteRows = (key, rows, options = {}) => {
  const sourceRows = Array.isArray(options?.remoteRows) ? options.remoteRows : rows;
  if (!Array.isArray(sourceRows) || sourceRows.length === 0) return [];

  if (key === "sl:scores") return sourceRows.map(normalizeScoreRowForDb).filter(Boolean);
  if (key === "sl:shotlogs") return sourceRows.map(normalizeShotLogRowForDb).filter(Boolean);
  if (key === "sl:events") return sourceRows.map(normalizeEventRowForDb).filter(Boolean);
  if (key === "sl:players") return sourceRows.map(normalizePlayerRowForDb).filter(Boolean);
  if (key === "sl:player-profiles") return sourceRows.map(normalizePlayerProfileRowForDb).filter(Boolean);
  if (key === "sl:rsvps") return sourceRows.map(normalizeRsvpRowForDb).filter(Boolean);
  return sourceRows;
};
