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

export const normalizePlayerRowForApp = (row = {}) => {
  const id = cleanText(row.id);
  const email = cleanText(row.email).toLowerCase();
  const teamId = cleanText(row.team_id || row.teamId);
  if (!id || !email || !teamId) return null;

  return {
    id,
    email,
    teamId,
    role: cleanText(row.role || "player") || "player",
    name: cleanText(row.name),
    hideFromLeaderboards: row.hide_from_leaderboards === true || row.hideFromLeaderboards === true,
  };
};

export const normalizePlayerProfileRowForApp = (row = {}) => {
  const teamId = cleanText(row.team_id || row.teamId);
  const email = cleanText(row.email).toLowerCase();
  const userId = cleanText(row.user_id || row.userId).toLowerCase();
  if (!teamId || (!email && !userId)) return null;
  const id = cleanText(row.id) || (email ? `pp-shell:${teamId}:${email}` : "");
  if (!id) return null;

  return {
    id,
    teamId,
    email,
    userId: userId || null,
    firstName: cleanText(row.first_name || row.firstName),
    lastName: cleanText(row.last_name || row.lastName),
    hideFromLeaderboards: row.hide_from_leaderboards === true || row.hideFromLeaderboards === true,
    createdAt: row.created_at || row.createdAt || null,
  };
};

const keyEmailTeam = (row = {}) => {
  const email = cleanText(row.email).toLowerCase();
  const teamId = cleanText(row.teamId || row.team_id);
  return email && teamId ? `${email}::${teamId}` : "";
};

const keyUserTeam = (row = {}) => {
  const userId = cleanText(row.userId || row.user_id).toLowerCase();
  const teamId = cleanText(row.teamId || row.team_id);
  return userId && teamId ? `${userId}::${teamId}` : "";
};

export const mergeHydratedRows = (key, remoteRows = [], localRows = []) => {
  const remote = buildAppRows(key, remoteRows);
  const local = buildAppRows(key, localRows);
  if (!Array.isArray(remote) || remote.length === 0) return local;
  if (!Array.isArray(local) || local.length === 0) return remote;
  if (!["sl:events", "sl:players", "sl:player-profiles"].includes(key)) return remote;

  const output = [];
  const byId = new Map();
  const fallback = new Map();
  const fallbackKeyFor = (row) => {
    if (key === "sl:players") return keyEmailTeam(row);
    if (key === "sl:player-profiles") return keyEmailTeam(row) || keyUserTeam(row);
    return "";
  };

  for (const row of local) {
    byId.set(row.id, row);
    const fk = fallbackKeyFor(row);
    if (fk) fallback.set(fk, row.id);
  }
  for (const row of remote) {
    byId.set(row.id, row);
    const fk = fallbackKeyFor(row);
    if (fk) fallback.set(fk, row.id);
  }
  for (const row of local) {
    const fk = fallbackKeyFor(row);
    if (fk && fallback.has(fk)) {
      const winnerId = fallback.get(fk);
      byId.set(winnerId, { ...row, ...byId.get(winnerId) });
      if (winnerId !== row.id) byId.delete(row.id);
    }
  }

  for (const row of byId.values()) output.push(row);
  return output;
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
  if (key === "sl:rsvps") return sourceRows.map(normalizeRsvpRowForDb).filter(Boolean);
  return sourceRows;
};
