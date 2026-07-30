import { deleteRows, selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const MAX_EVENTS_PER_TEAM = 500;

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

export function sanitizeEventRow(value = {}, fallbackTeamId = "") {
  return {
    id: cleanText(value?.id, 160),
    teamId: cleanText(value?.team_id || value?.teamId || fallbackTeamId, 160),
    title: cleanText(value?.title, 320),
    date: cleanText(value?.date, 40),
    time: cleanText(value?.time, 40),
    location: cleanText(value?.location, 500),
    description: cleanText(value?.description, 4000),
    type: cleanText(value?.type || "event", 80),
  };
}

function toDatabase(row) {
  return {
    id: row.id,
    team_id: row.teamId,
    title: row.title || null,
    date: row.date || null,
    time: row.time || null,
    location: row.location || null,
    description: row.description || null,
    type: row.type || null,
  };
}

function toResponse(row = {}) {
  const normalized = sanitizeEventRow(row);
  return {
    id: normalized.id,
    team_id: normalized.teamId,
    title: normalized.title,
    date: normalized.date,
    time: normalized.time,
    location: normalized.location,
    description: normalized.description,
    type: normalized.type,
  };
}

function demoResponse(events = []) {
  return Response.json({ ok: true, storage_mode: "demo_local", events });
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

async function readTeamEvents(env, teamId) {
  const rows = await selectRows(
    env,
    "events",
    `select=id,team_id,title,date,time,location,description,type&team_id=eq.${encodeURIComponent(teamId)}&order=date.asc&limit=${MAX_EVENTS_PER_TEAM}`,
  );
  return (Array.isArray(rows) ? rows : []).map(toResponse);
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `events_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse();

  try {
    const { readableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });
    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 160);
    const teamIds = requestedTeamId
      ? (readableTeamIds.has(requestedTeamId) ? [requestedTeamId] : [])
      : [...readableTeamIds];
    if (requestedTeamId && !teamIds.length) return Response.json({ error: "forbidden" }, { status: 403 });

    const events = [];
    for (const teamId of teamIds) events.push(...await readTeamEvents(env, teamId));
    return Response.json({ ok: true, storage_mode: "signed_api", events });
  } catch (error) {
    console.error("events_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "event_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `events_post:${getClientKey(request, requester)}`,
    max: 30,
    windowMs: 60_000,
  });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const teamId = cleanText(body?.team_id || body?.teamId, 160);
  const inputRows = Array.isArray(body?.events) ? body.events : [];
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (inputRows.length > MAX_EVENTS_PER_TEAM) return Response.json({ error: "too_many_events" }, { status: 400 });

  const events = inputRows.map((row) => sanitizeEventRow(row, teamId));
  for (const row of events) {
    if (!row.id) return Response.json({ error: "event_id_required" }, { status: 400 });
    if (row.teamId !== teamId) return Response.json({ error: "team_mismatch" }, { status: 400 });
    if (!row.title) return Response.json({ error: "event_title_required" }, { status: 400 });
  }
  if (new Set(events.map((row) => row.id)).size !== events.length) return Response.json({ error: "duplicate_event_id" }, { status: 400 });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse(events.map(toResponse));

  try {
    const { writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!writableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });

    for (const row of events) {
      const collisions = await selectRows(env, "events", `select=id,team_id&id=eq.${encodeURIComponent(row.id)}&limit=1`);
      const prior = Array.isArray(collisions) ? collisions[0] : null;
      if (prior && cleanText(prior.team_id, 160) !== teamId) return Response.json({ error: "event_id_conflict" }, { status: 409 });
    }

    const existing = await selectRows(env, "events", `select=id&team_id=eq.${encodeURIComponent(teamId)}&limit=${MAX_EVENTS_PER_TEAM}`);
    const incomingIds = new Set(events.map((row) => row.id));
    const removedIds = (Array.isArray(existing) ? existing : [])
      .map((row) => cleanText(row?.id, 160))
      .filter((id) => id && !incomingIds.has(id));

    if (events.length) await upsertRows(env, "events", events.map(toDatabase), "id");
    for (const eventId of removedIds) {
      await deleteRows(env, "rsvps", `team_id=eq.${encodeURIComponent(teamId)}&event_id=eq.${encodeURIComponent(eventId)}`);
      await deleteRows(env, "events", `team_id=eq.${encodeURIComponent(teamId)}&id=eq.${encodeURIComponent(eventId)}`);
    }

    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      events: await readTeamEvents(env, teamId),
      deleted_count: removedIds.length,
    });
  } catch (error) {
    console.error("events_post_failed", { teamId, message: cleanText(error?.message, 180) });
    return Response.json({ error: "event_sync_failed" }, { status: 500 });
  }
}
