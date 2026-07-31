import { deleteRows, selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const RESOURCE_LIMITS = { sessions: 500, rsvps: 5000, logs: 5000 };
const RESOURCES = new Set(Object.keys(RESOURCE_LIMITS));

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

function safeTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, numeric))) : null;
}

export function sanitizeScSession(value = {}, fallbackTeamId = "") {
  return {
    id: cleanText(value?.id, 160),
    teamId: cleanText(value?.team_id || value?.teamId || fallbackTeamId, 160),
    sport: cleanText(value?.sport, 320),
    date: cleanText(value?.date, 40),
    time: cleanText(value?.time, 40),
    sessionType: cleanText(value?.session_type || value?.sessionType, 160),
    ownerCoachId: normalizeIdentity(value?.owner_coach_id || value?.ownerCoachId).slice(0, 320),
  };
}

export function sanitizeScRsvp(value = {}, fallbackTeamId = "") {
  return {
    teamId: cleanText(value?.team_id || value?.teamId || fallbackTeamId, 160),
    sessionId: cleanText(value?.session_id || value?.sessionId, 160),
    playerId: normalizeIdentity(value?.player_id || value?.playerId || value?.email).slice(0, 320),
    email: normalizeIdentity(value?.email).slice(0, 320),
    name: cleanText(value?.name, 320),
    ts: safeTimestamp(value?.ts),
  };
}

export function sanitizeScLog(value = {}, fallbackTeamId = "") {
  return {
    id: cleanText(value?.id, 160),
    teamId: cleanText(value?.team_id || value?.teamId || fallbackTeamId, 160),
    sessionId: cleanText(value?.session_id || value?.sessionId, 160),
    playerId: normalizeIdentity(value?.player_id || value?.playerId || value?.email).slice(0, 320),
    email: normalizeIdentity(value?.email).slice(0, 320),
    name: cleanText(value?.name, 320),
    date: cleanText(value?.date, 40),
    time: cleanText(value?.time, 40),
    place: cleanText(value?.place, 320),
    sport: cleanText(value?.sport, 320),
    ts: safeTimestamp(value?.ts),
  };
}

function sessionToDatabase(row) {
  return {
    team_id: row.teamId,
    id: row.id,
    sport: row.sport,
    date: row.date || null,
    time: row.time || null,
    session_type: row.sessionType || null,
    owner_coach_id: row.ownerCoachId || null,
    updated_at: new Date().toISOString(),
  };
}

function rsvpToDatabase(row) {
  return {
    team_id: row.teamId,
    session_id: row.sessionId,
    player_id: row.playerId,
    email: row.email,
    name: row.name || null,
    ts: row.ts,
    updated_at: new Date().toISOString(),
  };
}

function logToDatabase(row) {
  return {
    team_id: row.teamId,
    id: row.id,
    session_id: row.sessionId || null,
    player_id: row.playerId,
    email: row.email,
    name: row.name || null,
    date: row.date || null,
    time: row.time || null,
    place: row.place || null,
    sport: row.sport || null,
    ts: row.ts,
    updated_at: new Date().toISOString(),
  };
}

function sessionToResponse(row = {}) {
  const normalized = sanitizeScSession(row);
  return {
    id: normalized.id,
    team_id: normalized.teamId,
    sport: normalized.sport,
    date: normalized.date,
    time: normalized.time,
    session_type: normalized.sessionType,
    owner_coach_id: normalized.ownerCoachId,
  };
}

function rsvpToResponse(row = {}) {
  const normalized = sanitizeScRsvp(row);
  return {
    id: `${normalized.teamId}:${normalized.sessionId}:${normalized.playerId}`,
    team_id: normalized.teamId,
    session_id: normalized.sessionId,
    player_id: normalized.playerId,
    email: normalized.email,
    name: normalized.name,
    ts: normalized.ts,
  };
}

function logToResponse(row = {}) {
  const normalized = sanitizeScLog(row);
  return {
    id: normalized.id,
    team_id: normalized.teamId,
    session_id: normalized.sessionId,
    player_id: normalized.playerId,
    email: normalized.email,
    name: normalized.name,
    date: normalized.date,
    time: normalized.time,
    place: normalized.place,
    sport: normalized.sport,
    ts: normalized.ts,
  };
}

function isOwnedBy(row, identities) {
  return identities.has(normalizeIdentity(row?.email))
    || identities.has(normalizeIdentity(row?.player_id || row?.playerId));
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

async function readTeamState(env, teamId) {
  const [sessionRows, rsvpRows, logRows] = await Promise.all([
    selectRows(
      env,
      "sc_sessions",
      `select=team_id,id,sport,date,time,session_type,owner_coach_id&team_id=eq.${encodeURIComponent(teamId)}&order=date.asc&limit=${RESOURCE_LIMITS.sessions}`,
    ),
    selectRows(
      env,
      "sc_rsvps",
      `select=team_id,session_id,player_id,email,name,ts&team_id=eq.${encodeURIComponent(teamId)}&order=ts.asc&limit=${RESOURCE_LIMITS.rsvps}`,
    ),
    selectRows(
      env,
      "sc_logs",
      `select=team_id,id,session_id,player_id,email,name,date,time,place,sport,ts&team_id=eq.${encodeURIComponent(teamId)}&order=ts.desc&limit=${RESOURCE_LIMITS.logs}`,
    ),
  ]);
  return {
    sessions: (Array.isArray(sessionRows) ? sessionRows : []).map(sessionToResponse),
    rsvps: (Array.isArray(rsvpRows) ? rsvpRows : []).map(rsvpToResponse),
    logs: (Array.isArray(logRows) ? logRows : []).map(logToResponse),
  };
}

function validateRows(resource, rows, teamId) {
  if (rows.length > RESOURCE_LIMITS[resource]) return `${resource}_limit_exceeded`;
  if (resource === "sessions") {
    for (const row of rows) {
      if (!row.id) return "session_id_required";
      if (!row.sport) return "session_sport_required";
      if (row.teamId !== teamId) return "team_mismatch";
    }
    if (new Set(rows.map((row) => row.id)).size !== rows.length) return "duplicate_session_id";
  }
  if (resource === "rsvps") {
    for (const row of rows) {
      if (!row.sessionId) return "session_id_required";
      if (!row.playerId || !row.email) return "player_identity_required";
      if (row.teamId !== teamId) return "team_mismatch";
      if (row.ts === null) return "timestamp_required";
    }
    const keys = rows.map((row) => `${row.sessionId}:${row.playerId}`);
    if (new Set(keys).size !== keys.length) return "duplicate_rsvp";
  }
  if (resource === "logs") {
    for (const row of rows) {
      if (!row.id) return "log_id_required";
      if (!row.playerId || !row.email) return "player_identity_required";
      if (row.teamId !== teamId) return "team_mismatch";
      if (row.ts === null) return "timestamp_required";
    }
    if (new Set(rows.map((row) => row.id)).size !== rows.length) return "duplicate_log_id";
  }
  return "";
}

async function validateSessionReferences(env, teamId, rows) {
  const sessionRows = await selectRows(
    env,
    "sc_sessions",
    `select=id&team_id=eq.${encodeURIComponent(teamId)}&limit=${RESOURCE_LIMITS.sessions}`,
  );
  const validIds = new Set((Array.isArray(sessionRows) ? sessionRows : []).map((row) => cleanText(row?.id, 160)).filter(Boolean));
  return rows.every((row) => !row.sessionId || validIds.has(row.sessionId));
}

async function replaceCoachCollection(env, resource, teamId, rows) {
  const config = {
    sessions: {
      table: "sc_sessions",
      select: "select=id",
      key: (row) => row.id,
      filter: (row) => `team_id=eq.${encodeURIComponent(teamId)}&id=eq.${encodeURIComponent(row.id)}`,
      db: sessionToDatabase,
      conflict: "team_id,id",
    },
    rsvps: {
      table: "sc_rsvps",
      select: "select=session_id,player_id",
      key: (row) => `${row.sessionId || row.session_id}:${row.playerId || row.player_id}`,
      filter: (row) => `team_id=eq.${encodeURIComponent(teamId)}&session_id=eq.${encodeURIComponent(row.session_id)}&player_id=eq.${encodeURIComponent(row.player_id)}`,
      db: rsvpToDatabase,
      conflict: "team_id,session_id,player_id",
    },
    logs: {
      table: "sc_logs",
      select: "select=id",
      key: (row) => row.id,
      filter: (row) => `team_id=eq.${encodeURIComponent(teamId)}&id=eq.${encodeURIComponent(row.id)}`,
      db: logToDatabase,
      conflict: "team_id,id",
    },
  }[resource];
  const existing = await selectRows(
    env,
    config.table,
    `${config.select}&team_id=eq.${encodeURIComponent(teamId)}&limit=${RESOURCE_LIMITS[resource]}`,
  );
  const incomingKeys = new Set(rows.map(config.key));
  const removed = (Array.isArray(existing) ? existing : []).filter((row) => !incomingKeys.has(config.key(row)));
  if (rows.length) await upsertRows(env, config.table, rows.map(config.db), config.conflict);
  for (const row of removed) await deleteRows(env, config.table, config.filter(row));
  return removed.length;
}

async function replacePlayerCollection(env, resource, teamId, rows, identities) {
  const table = resource === "rsvps" ? "sc_rsvps" : "sc_logs";
  const select = resource === "rsvps"
    ? `select=session_id,player_id,email&team_id=eq.${encodeURIComponent(teamId)}&limit=${RESOURCE_LIMITS.rsvps}`
    : `select=id,player_id,email&team_id=eq.${encodeURIComponent(teamId)}&limit=${RESOURCE_LIMITS.logs}`;
  const existingRows = await selectRows(env, table, select);
  const ownedRows = (Array.isArray(existingRows) ? existingRows : []).filter((row) => isOwnedBy(row, identities));
  const key = resource === "rsvps"
    ? (row) => `${row.sessionId || row.session_id}:${row.playerId || row.player_id}`
    : (row) => row.id;
  const incomingKeys = new Set(rows.map(key));
  const removed = ownedRows.filter((row) => !incomingKeys.has(key(row)));

  if (rows.length) {
    await upsertRows(
      env,
      table,
      rows.map(resource === "rsvps" ? rsvpToDatabase : logToDatabase),
      resource === "rsvps" ? "team_id,session_id,player_id" : "team_id,id",
    );
  }
  for (const row of removed) {
    const filter = resource === "rsvps"
      ? `team_id=eq.${encodeURIComponent(teamId)}&session_id=eq.${encodeURIComponent(row.session_id)}&player_id=eq.${encodeURIComponent(row.player_id)}`
      : `team_id=eq.${encodeURIComponent(teamId)}&id=eq.${encodeURIComponent(row.id)}`;
    await deleteRows(env, table, filter);
  }
  return removed.length;
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({
    key: `strength_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (DEMO_IDENTITIES.has(requester)) {
    return Response.json({ ok: true, storage_mode: "demo_local", team_id: "", can_write_sessions: requester.startsWith("coach."), sessions: [], rsvps: [], logs: [] });
  }

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });
    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 160);
    const teamId = requestedTeamId || [...readableTeamIds][0] || "";
    if (!teamId || !readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const state = await readTeamState(env, teamId);
    const isCoach = writableTeamIds.has(teamId);
    const identities = new Set([requester, normalizeIdentity(resolvedUuid)].filter(Boolean));
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      team_id: teamId,
      can_write_sessions: isCoach,
      sessions: state.sessions,
      rsvps: isCoach ? state.rsvps : state.rsvps.filter((row) => isOwnedBy(row, identities)),
      logs: isCoach ? state.logs : state.logs.filter((row) => isOwnedBy(row, identities)),
    });
  } catch (error) {
    console.error(JSON.stringify({ message: "strength_conditioning_get_failed", error: cleanText(error?.message, 180) }));
    return Response.json({ error: "strength_conditioning_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({
    key: `strength_post:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const teamId = cleanText(body?.team_id || body?.teamId, 160);
  const resource = cleanText(body?.resource, 40);
  const inputRows = Array.isArray(body?.rows) ? body.rows : [];
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (!RESOURCES.has(resource)) return Response.json({ error: "resource_invalid" }, { status: 400 });
  const sanitizer = resource === "sessions" ? sanitizeScSession : resource === "rsvps" ? sanitizeScRsvp : sanitizeScLog;
  const rows = inputRows.map((row) => sanitizer(row, teamId));
  const validationError = validateRows(resource, rows, teamId);
  if (validationError) return Response.json({ error: validationError }, { status: 400 });
  if (DEMO_IDENTITIES.has(requester)) {
    const responder = resource === "sessions" ? sessionToResponse : resource === "rsvps" ? rsvpToResponse : logToResponse;
    return Response.json({ ok: true, storage_mode: "demo_local", team_id: teamId, resource, rows: rows.map(responder), deleted_count: 0 });
  }

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const isCoach = writableTeamIds.has(teamId);
    if (resource === "sessions" && !isCoach) return Response.json({ error: "forbidden" }, { status: 403 });
    const identities = new Set([requester, normalizeIdentity(resolvedUuid)].filter(Boolean));
    if (!isCoach) {
      for (const row of rows) {
        if (row.email !== requester || !identities.has(row.playerId)) {
          return Response.json({ error: "identity_mismatch" }, { status: 403 });
        }
      }
    }
    if (resource !== "sessions" && !(await validateSessionReferences(env, teamId, rows))) {
      return Response.json({ error: "session_not_found" }, { status: 400 });
    }

    const deletedCount = isCoach
      ? await replaceCoachCollection(env, resource, teamId, rows)
      : await replacePlayerCollection(env, resource, teamId, rows, identities);
    const state = await readTeamState(env, teamId);
    const responseRows = resource === "sessions"
      ? state.sessions
      : resource === "rsvps"
        ? (isCoach ? state.rsvps : state.rsvps.filter((row) => isOwnedBy(row, identities)))
        : (isCoach ? state.logs : state.logs.filter((row) => isOwnedBy(row, identities)));
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      team_id: teamId,
      resource,
      rows: responseRows,
      deleted_count: deletedCount,
    });
  } catch (error) {
    console.error(JSON.stringify({
      message: "strength_conditioning_sync_failed",
      teamId,
      resource,
      error: cleanText(error?.message, 180),
    }));
    return Response.json({ error: "strength_conditioning_sync_failed" }, { status: 500 });
  }
}
