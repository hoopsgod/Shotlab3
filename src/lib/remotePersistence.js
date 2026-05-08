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


export const normalizePlayerRowForDb = (row = {}) => {
  const email = cleanText(row.email).toLowerCase();
  const teamId = cleanText(row.team_id || row.teamId);
  if (!email || !teamId) return null;

  const payload = {
    id: cleanText(row.id) || `${teamId}:${email}`,
    email,
    name: cleanText(row.name),
    role: cleanText(row.role),
    team_id: teamId,
    hide_from_leaderboards:
      typeof row.hide_from_leaderboards === "boolean"
        ? row.hide_from_leaderboards
        : typeof row.hideFromLeaderboards === "boolean"
          ? row.hideFromLeaderboards
          : undefined,
    created_at: toFiniteNumber(row.created_at ?? row.createdAt),
    updated_at: toFiniteNumber(row.updated_at ?? row.updatedAt),
    last_login: toFiniteNumber(row.last_login ?? row.lastLogin),
    last_active_at: toFiniteNumber(row.last_active_at ?? row.lastActiveAt),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== undefined));
};

export const normalizePlayerRowForApp = (row = {}) => {
  const email = cleanText(row.email).toLowerCase();
  const teamId = cleanText(row.team_id || row.teamId);
  if (!email || !teamId) return null;

  const payload = {
    id: cleanText(row.id) || `${teamId}:${email}`,
    email,
    name: cleanText(row.name),
    role: cleanText(row.role),
    teamId,
    hideFromLeaderboards:
      typeof row.hide_from_leaderboards === "boolean"
        ? row.hide_from_leaderboards
        : typeof row.hideFromLeaderboards === "boolean"
          ? row.hideFromLeaderboards
          : undefined,
    createdAt: toFiniteNumber(row.created_at ?? row.createdAt),
    updatedAt: toFiniteNumber(row.updated_at ?? row.updatedAt),
    lastLogin: toFiniteNumber(row.last_login ?? row.lastLogin),
    lastActiveAt: toFiniteNumber(row.last_active_at ?? row.lastActiveAt),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== undefined));
};

export const normalizePlayerProfileRowForDb = (row = {}) => {
  const id = cleanText(row.id);
  const userId = cleanText(row.user_id || row.userId).toLowerCase();
  const teamId = cleanText(row.team_id || row.teamId);
  if (!id || !userId || !teamId) return null;

  const payload = {
    id,
    user_id: userId,
    team_id: teamId,
    email: cleanText(row.email || userId).toLowerCase(),
    first_name: cleanText(row.first_name || row.firstName),
    last_name: cleanText(row.last_name || row.lastName),
    created_at: toFiniteNumber(row.created_at ?? row.createdAt),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const normalizePlayerProfileRowForApp = (row = {}) => {
  const id = cleanText(row.id);
  const userId = cleanText(row.user_id || row.userId).toLowerCase();
  const teamId = cleanText(row.team_id || row.teamId);
  if (!id || !userId || !teamId) return null;

  const payload = {
    id,
    userId,
    teamId,
    email: cleanText(row.email || userId).toLowerCase(),
    firstName: cleanText(row.first_name || row.firstName),
    lastName: cleanText(row.last_name || row.lastName),
    createdAt: toFiniteNumber(row.created_at ?? row.createdAt),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const mergeHydratedRows = (key, remoteRows = [], localRows = []) => {
  const shouldMerge = key === "sl:events" || key === "sl:players" || key === "sl:player-profiles";
  if (!shouldMerge) return remoteRows;

  const keyFor = (row) => {
    if (!row || typeof row !== "object") return "";
    const id = cleanText(row.id);
    if (id) return `id:${id}`;
    if (key === "sl:players") return `email:${cleanText(row.email).toLowerCase()}:team:${cleanText(row.teamId || row.team_id)}`;
    if (key === "sl:player-profiles") return `user:${cleanText(row.userId || row.user_id).toLowerCase()}:team:${cleanText(row.teamId || row.team_id)}`;
    return "";
  };

  const merged = new Map();
  for (const row of Array.isArray(localRows) ? localRows : []) {
    const rowKey = keyFor(row);
    if (rowKey) merged.set(rowKey, row);
  }
  for (const row of Array.isArray(remoteRows) ? remoteRows : []) {
    const rowKey = keyFor(row);
    if (rowKey) merged.set(rowKey, row);
  }
  return [...merged.values()];
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

export const buildAppRows = (key, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (key === "sl:events") return rows.map(normalizeEventRowForApp).filter(Boolean);
  if (key === "sl:players") return rows.map(normalizePlayerRowForApp).filter(Boolean);
  if (key === "sl:player-profiles") return rows.map(normalizePlayerProfileRowForApp).filter(Boolean);
  if (key === "sl:rsvps") return rows.map(normalizeRsvpRowForApp).filter(Boolean);
  return rows;
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
