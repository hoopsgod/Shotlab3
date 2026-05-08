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
  const teamId = cleanText(row.team_id || row.teamId);
  const email = cleanText(row.email).toLowerCase();
  const id = cleanText(row.id || (teamId && email ? `player:${teamId}:${email}` : ""));
  if (!id || !teamId || !email) return null;
  const payload = {
    id,
    teamId,
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
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== undefined));
};

export const normalizePlayerRowForDb = (row = {}) => {
  const app = normalizePlayerRowForApp(row);
  if (!app) return null;
  const payload = {
    id: app.id,
    team_id: app.teamId,
    email: app.email,
    name: app.name,
    role: app.role,
    created_at: app.createdAt,
    updated_at: app.updatedAt,
    hide_from_leaderboards: app.hideFromLeaderboards,
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== "" && value !== undefined));
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
