import { deleteRows, selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const MAX_RSVPS_PER_TEAM = 5000;

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

function safeTimestamp(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, numeric))) : null;
}

export function sanitizeRsvpRow(value = {}, fallbackTeamId = "") {
  return {
    id: cleanText(value?.id, 160),
    email: normalizeIdentity(value?.email).slice(0, 320),
    playerId: normalizeIdentity(value?.player_id || value?.playerId || value?.email).slice(0, 320),
    name: cleanText(value?.name, 320),
    eventId: cleanText(value?.event_id || value?.eventId, 160),
    teamId: cleanText(value?.team_id || value?.teamId || fallbackTeamId, 160),
    attended: value?.attended === true,
    ts: safeTimestamp(value?.ts),
  };
}

function toDatabase(row) {
  return {
    id: row.id,
    email: row.email || null,
    player_id: row.playerId,
    name: row.name || null,
    event_id: row.eventId,
    team_id: row.teamId,
    attended: row.attended,
    ts: row.ts,
  };
}

function toResponse(row = {}) {
  const normalized = sanitizeRsvpRow(row);
  return {
    id: normalized.id,
    email: normalized.email,
    player_id: normalized.playerId,
    name: normalized.name,
    event_id: normalized.eventId,
    team_id: normalized.teamId,
    attended: normalized.attended,
    ts: normalized.ts,
  };
}

function demoResponse(rsvps = []) {
  return Response.json({ ok: true, storage_mode: "demo_local", rsvps });
}

async function readTeamRsvps(env, teamId) {
  const rows = await selectRows(
    env,
    "rsvps",
    `select=id,email,player_id,name,event_id,team_id,attended,ts&team_id=eq.${encodeURIComponent(teamId)}&order=ts.asc&limit=${MAX_RSVPS_PER_TEAM}`,
  );
  return (Array.isArray(rows) ? rows : []).map(toResponse);
}

function isOwnedBy(row, identities) {
  return identities.has(normalizeIdentity(row?.email)) || identities.has(normalizeIdentity(row?.player_id || row?.playerId));
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `rsvps_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse();

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });
    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 160);
    const teamIds = requestedTeamId
      ? (readableTeamIds.has(requestedTeamId) ? [requestedTeamId] : [])
      : [...readableTeamIds];
    if (requestedTeamId && !teamIds.length) return Response.json({ error: "forbidden" }, { status: 403 });

    const identities = new Set([requester, normalizeIdentity(resolvedUuid)].filter(Boolean));
    const rsvps = [];
    for (const teamId of teamIds) {
      const teamRows = await readTeamRsvps(env, teamId);
      rsvps.push(...(writableTeamIds.has(teamId) ? teamRows : teamRows.filter((row) => isOwnedBy(row, identities))));
    }
    return Response.json({ ok: true, storage_mode: "signed_api", rsvps });
  } catch (error) {
    console.error("rsvps_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "rsvp_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `rsvps_post:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const teamId = cleanText(body?.team_id || body?.teamId, 160);
  const inputRows = Array.isArray(body?.rsvps) ? body.rsvps : [];
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (inputRows.length > MAX_RSVPS_PER_TEAM) return Response.json({ error: "too_many_rsvps" }, { status: 400 });

  const rsvps = inputRows.map((row) => sanitizeRsvpRow(row, teamId));
  for (const row of rsvps) {
    if (!row.id) return Response.json({ error: "rsvp_id_required" }, { status: 400 });
    if (!row.eventId) return Response.json({ error: "event_id_required" }, { status: 400 });
    if (!row.playerId) return Response.json({ error: "player_identity_required" }, { status: 400 });
    if (row.teamId !== teamId) return Response.json({ error: "team_mismatch" }, { status: 400 });
    if (row.ts === null) return Response.json({ error: "timestamp_required" }, { status: 400 });
  }
  if (new Set(rsvps.map((row) => row.id)).size !== rsvps.length) return Response.json({ error: "duplicate_rsvp_id" }, { status: 400 });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse(rsvps.map(toResponse));

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const isCoach = writableTeamIds.has(teamId);
    const identities = new Set([requester, normalizeIdentity(resolvedUuid)].filter(Boolean));

    if (!isCoach) {
      for (const row of rsvps) {
        if (row.email !== requester || !identities.has(row.playerId)) return Response.json({ error: "identity_mismatch" }, { status: 403 });
      }
    }

    const eventRows = await selectRows(env, "events", `select=id&team_id=eq.${encodeURIComponent(teamId)}&limit=500`);
    const validEventIds = new Set((Array.isArray(eventRows) ? eventRows : []).map((row) => cleanText(row?.id, 160)).filter(Boolean));
    for (const row of rsvps) if (!validEventIds.has(row.eventId)) return Response.json({ error: "event_not_found" }, { status: 400 });

    for (const row of rsvps) {
      const collisions = await selectRows(env, "rsvps", `select=id,email,player_id,team_id&id=eq.${encodeURIComponent(row.id)}&limit=1`);
      const prior = Array.isArray(collisions) ? collisions[0] : null;
      if (!prior) continue;
      if (cleanText(prior.team_id, 160) !== teamId) return Response.json({ error: "rsvp_id_conflict" }, { status: 409 });
      if (!isCoach && !isOwnedBy(prior, identities)) return Response.json({ error: "rsvp_id_conflict" }, { status: 409 });
    }

    const existingRows = await readTeamRsvps(env, teamId);
    const scopedExisting = isCoach ? existingRows : existingRows.filter((row) => isOwnedBy(row, identities));
    const incomingIds = new Set(rsvps.map((row) => row.id));
    const removedIds = scopedExisting.map((row) => row.id).filter((id) => id && !incomingIds.has(id));

    if (rsvps.length) await upsertRows(env, "rsvps", rsvps.map(toDatabase), "id");
    for (const id of removedIds) await deleteRows(env, "rsvps", `team_id=eq.${encodeURIComponent(teamId)}&id=eq.${encodeURIComponent(id)}`);

    const visibleRows = await readTeamRsvps(env, teamId);
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      rsvps: isCoach ? visibleRows : visibleRows.filter((row) => isOwnedBy(row, identities)),
      deleted_count: removedIds.length,
    });
  } catch (error) {
    console.error("rsvps_post_failed", { teamId, message: cleanText(error?.message, 180) });
    return Response.json({ error: "rsvp_sync_failed" }, { status: 500 });
  }
}
