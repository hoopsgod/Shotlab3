import { deleteRows, selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const SCORE_SOURCES = new Set(["home", "program"]);
const MAX_WRITE_ROWS = 25;
const MAX_READ_ROWS_PER_TEAM = 5000;

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(1_000_000_000, Math.max(-1_000_000_000, numeric));
}

function safeTimestamp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.trunc(Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, numeric)));
}

export function sanitizeScoreRow(value = {}) {
  const source = normalizeIdentity(value?.src || "home");
  return {
    id: cleanText(value?.id, 160),
    email: normalizeIdentity(value?.email).slice(0, 320),
    name: cleanText(value?.name, 320),
    teamId: cleanText(value?.team_id || value?.teamId, 160),
    drillId: cleanText(value?.drill_id || value?.drillId, 160),
    score: finiteNumber(value?.score),
    date: cleanText(value?.date, 40),
    ts: safeTimestamp(value?.ts),
    src: SCORE_SOURCES.has(source) ? source : "home",
    playerId: normalizeIdentity(value?.player_id || value?.playerId || value?.email).slice(0, 320),
  };
}

function rowToResponse(row = {}) {
  const normalized = sanitizeScoreRow(row);
  return {
    id: normalized.id,
    email: normalized.email,
    name: normalized.name,
    team_id: normalized.teamId,
    drill_id: normalized.drillId,
    score: normalized.score,
    date: normalized.date,
    ts: normalized.ts,
    src: normalized.src,
    player_id: normalized.playerId,
  };
}

function rowToDatabase(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name || null,
    team_id: row.teamId,
    drill_id: row.drillId || null,
    score: row.score,
    date: row.date || null,
    ts: row.ts,
    src: row.src,
    player_id: row.playerId,
  };
}

function validateScoreRow(row) {
  if (!row.id) return "id_required";
  if (!row.email) return "email_required";
  if (!row.playerId) return "player_id_required";
  if (!row.teamId) return "team_id_required";
  if (row.score === null) return "score_required";
  if (row.ts === null) return "timestamp_required";
  return "";
}

function localDemoResponse(scores = []) {
  return Response.json({ ok: true, storage_mode: "demo_local", scores });
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `scores_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  if (DEMO_IDENTITIES.has(requester)) return localDemoResponse();

  try {
    const { readableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });

    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 160);
    const teamIds = requestedTeamId
      ? (readableTeamIds.has(requestedTeamId) ? [requestedTeamId] : [])
      : [...readableTeamIds];
    if (requestedTeamId && !teamIds.length) return Response.json({ error: "forbidden" }, { status: 403 });

    const scores = [];
    for (const teamId of teamIds) {
      const rows = await selectRows(
        env,
        "scores",
        `select=id,email,name,team_id,drill_id,score,date,ts,src,player_id&team_id=eq.${encodeURIComponent(teamId)}&order=ts.asc&limit=${MAX_READ_ROWS_PER_TEAM}`,
      );
      for (const row of Array.isArray(rows) ? rows : []) scores.push(rowToResponse(row));
    }

    return Response.json({ ok: true, storage_mode: "signed_api", scores });
  } catch (error) {
    console.error("scores_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "score_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `scores_post:${getClientKey(request, requester)}`,
    max: 40,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  const body = await request.json().catch(() => null);
  const inputRows = Array.isArray(body?.scores) ? body.scores : body?.score ? [body.score] : Array.isArray(body) ? body : body ? [body] : [];
  if (!inputRows.length) return Response.json({ error: "scores_required" }, { status: 400 });
  if (inputRows.length > MAX_WRITE_ROWS) return Response.json({ error: "too_many_scores" }, { status: 400 });

  const rows = inputRows.map(sanitizeScoreRow);
  for (const row of rows) {
    const validationError = validateScoreRow(row);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });
  }

  if (DEMO_IDENTITIES.has(requester)) return localDemoResponse(rows.map(rowToResponse));

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    const acceptedPlayerIds = new Set([requester, normalizeIdentity(resolvedUuid)].filter(Boolean));

    for (const row of rows) {
      if (!readableTeamIds.has(row.teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
      if (writableTeamIds.has(row.teamId)) return Response.json({ error: "player_score_write_required" }, { status: 403 });
      if (row.email !== requester || !acceptedPlayerIds.has(row.playerId)) {
        return Response.json({ error: "identity_mismatch" }, { status: 403 });
      }

      const existing = await selectRows(
        env,
        "scores",
        `select=id,email,team_id,player_id&id=eq.${encodeURIComponent(row.id)}&limit=1`,
      );
      const prior = Array.isArray(existing) ? existing[0] : null;
      if (prior) {
        const priorEmail = normalizeIdentity(prior.email);
        const priorPlayerId = normalizeIdentity(prior.player_id);
        const priorTeamId = cleanText(prior.team_id, 160);
        if (priorEmail !== requester || !acceptedPlayerIds.has(priorPlayerId) || priorTeamId !== row.teamId) {
          return Response.json({ error: "score_id_conflict" }, { status: 409 });
        }
      }
    }

    const saved = await upsertRows(env, "scores", rows.map(rowToDatabase), "id");
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      scores: (Array.isArray(saved) ? saved : []).map(rowToResponse),
    });
  } catch (error) {
    console.error("scores_post_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "score_write_failed" }, { status: 500 });
  }
}

export async function onRequestDelete({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `scores_delete:${getClientKey(request, requester)}`,
    max: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  const body = await request.json().catch(() => null);
  const teamId = cleanText(body?.team_id || body?.teamId, 160);
  const playerIdentity = normalizeIdentity(body?.player_identity || body?.playerIdentity || body?.email).slice(0, 320);
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (!playerIdentity) return Response.json({ error: "player_identity_required" }, { status: 400 });

  if (DEMO_IDENTITIES.has(requester)) return Response.json({ ok: true, storage_mode: "demo_local", deleted_count: 0 });

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });

    const requesterIds = new Set([requester, normalizeIdentity(resolvedUuid)].filter(Boolean));
    const isCoachDelete = writableTeamIds.has(teamId);
    if (!isCoachDelete && !requesterIds.has(playerIdentity)) {
      return Response.json({ error: "identity_mismatch" }, { status: 403 });
    }

    const deletedByEmail = await deleteRows(
      env,
      "scores",
      `team_id=eq.${encodeURIComponent(teamId)}&email=eq.${encodeURIComponent(playerIdentity)}`,
    );
    const deletedByPlayerId = await deleteRows(
      env,
      "scores",
      `team_id=eq.${encodeURIComponent(teamId)}&player_id=eq.${encodeURIComponent(playerIdentity)}`,
    );
    const deletedIds = new Set([
      ...(Array.isArray(deletedByEmail) ? deletedByEmail : []),
      ...(Array.isArray(deletedByPlayerId) ? deletedByPlayerId : []),
    ].map((row) => cleanText(row?.id, 160)).filter(Boolean));

    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      deleted_count: deletedIds.size,
      team_id: teamId,
      player_identity: playerIdentity,
    });
  } catch (error) {
    console.error("scores_delete_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "score_delete_failed" }, { status: 500 });
  }
}