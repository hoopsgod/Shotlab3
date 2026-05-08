const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const cleanText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toLowerIdentity = (value) => cleanText(value).toLowerCase();

const buildProfileFallbackId = ({ id, teamId, email }) => {
  const cleanId = cleanText(id);
  if (cleanId) return cleanId;
  const cleanTeamId = cleanText(teamId);
  const cleanEmail = toLowerIdentity(email);
  if (!cleanTeamId || !cleanEmail) return "";
  return `pp-shell:${cleanTeamId}:${cleanEmail}`;
};

export const normalizePlayerProfileRowForDb = (row = {}) => {
  const teamId = cleanText(row.team_id || row.teamId);
  const email = toLowerIdentity(row.email);
  const userId = cleanText(row.user_id || row.userId);
  const id = buildProfileFallbackId({ id: row.id, teamId, email });
  if (!id || !teamId || (!email && !userId)) return null;

  const payload = {
    id,
    team_id: teamId,
    email,
    user_id: userId,
    first_name: cleanText(row.first_name || row.firstName),
    last_name: cleanText(row.last_name || row.lastName),
    jersey_number: cleanText(row.jersey_number || row.jerseyNumber),
    created_at: toFiniteNumber(row.created_at || row.createdAt),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

export const normalizePlayerProfileRowForApp = (row = {}) => {
  const teamId = cleanText(row.team_id || row.teamId);
  const email = toLowerIdentity(row.email);
  const userId = cleanText(row.user_id || row.userId);
  const id = buildProfileFallbackId({ id: row.id, teamId, email });
  if (!id || !teamId || (!email && !userId)) return null;

  const payload = {
    id,
    teamId,
    email,
    userId: userId || null,
    firstName: cleanText(row.first_name || row.firstName),
    lastName: cleanText(row.last_name || row.lastName),
    jerseyNumber: cleanText(row.jersey_number || row.jerseyNumber),
    createdAt: toFiniteNumber(row.created_at || row.createdAt),
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ""));
};

const profileMergeIdentity = (row = {}) => {
  const id = cleanText(row.id);
  if (id) return `id:${id}`;
  const teamId = cleanText(row.team_id || row.teamId);
  const email = toLowerIdentity(row.email);
  if (teamId && email) return `team-email:${teamId}:${email}`;
  const userId = cleanText(row.user_id || row.userId);
  if (teamId && userId) return `team-user:${teamId}:${userId}`;
  return "";
};

export const mergeHydratedRows = (key, localRows = [], remoteRows = []) => {
  if (key !== "sl:player-profiles") return Array.isArray(remoteRows) && remoteRows.length > 0 ? remoteRows : localRows;

  const merged = new Map();
  (Array.isArray(localRows) ? localRows : []).forEach((row) => {
    const identity = profileMergeIdentity(row);
    if (!identity) return;
    merged.set(identity, row);
  });
  (Array.isArray(remoteRows) ? remoteRows : []).forEach((row) => {
    const identity = profileMergeIdentity(row);
    if (!identity) return;
    merged.set(identity, row);
  });
  return [...merged.values()];
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

export const buildAppRows = (key, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  if (key === "sl:events") return rows.map(normalizeEventRowForApp).filter(Boolean);
  if (key === "sl:rsvps") return rows.map(normalizeRsvpRowForApp).filter(Boolean);
  if (key === "sl:player-profiles") return rows.map(normalizePlayerProfileRowForApp).filter(Boolean);
  return rows;
};

export const buildRemoteRows = (key, rows, options = {}) => {
  const sourceRows = Array.isArray(options?.remoteRows) ? options.remoteRows : rows;
  if (!Array.isArray(sourceRows) || sourceRows.length === 0) return [];

  if (key === "sl:scores") return sourceRows.map(normalizeScoreRowForDb).filter(Boolean);
  if (key === "sl:shotlogs") return sourceRows.map(normalizeShotLogRowForDb).filter(Boolean);
  if (key === "sl:events") return sourceRows.map(normalizeEventRowForDb).filter(Boolean);
  if (key === "sl:rsvps") return sourceRows.map(normalizeRsvpRowForDb).filter(Boolean);
  if (key === "sl:player-profiles") return sourceRows.map(normalizePlayerProfileRowForDb).filter(Boolean);
  return sourceRows;
};
