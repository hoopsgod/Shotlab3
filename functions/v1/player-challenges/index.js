import { insertRows, selectRows, updateRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_PLAYER = "demo@shotlab.app";
const ALLOWED_STATUSES = new Set(["pending", "won", "tied", "lost"]);
const MAX_CHALLENGES_PER_PLAYER = 500;
const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const finiteNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function sanitizePlayerChallenge(value = {}, fallbackTeamId = "") {
  const status = cleanText(value?.status || "pending", 20).toLowerCase();
  return {
    id: cleanText(value?.id, 180),
    teamId: cleanText(value?.team_id || value?.teamId || fallbackTeamId, 180),
    challengerId: normalizeIdentity(value?.challenger_id || value?.challengerId || value?.from),
    challengerName: cleanText(value?.challenger_name || value?.fromName, 240),
    opponentId: normalizeIdentity(value?.opponent_id || value?.opponentId || value?.to),
    opponentName: cleanText(value?.opponent_name || value?.toName, 240),
    drillId: cleanText(value?.drill_id || value?.drillId, 180),
    drillName: cleanText(value?.drill_name || value?.drillName, 320),
    score: finiteNumber(value?.challenger_score ?? value?.score),
    maxScore: finiteNumber(value?.max_score ?? value?.max),
    responseScore: finiteNumber(value?.response_score ?? value?.respScore),
    status: ALLOWED_STATUSES.has(status) ? status : "pending",
    createdTs: finiteNumber(value?.created_ts ?? value?.ts),
    respondedTs: finiteNumber(value?.responded_ts ?? value?.respTs),
  };
}

function validationError(row) {
  if (!row.id) return "challenge_id_required";
  if (!row.teamId) return "team_id_required";
  if (!row.challengerId || !row.opponentId) return "player_identity_required";
  if (row.challengerId === row.opponentId) return "self_challenge_forbidden";
  if (!row.drillId || !row.drillName) return "drill_required";
  if (row.score === null || row.score < 0) return "invalid_score";
  if (row.maxScore !== null && (row.maxScore < 0 || row.score > row.maxScore)) return "invalid_max_score";
  return "";
}

function toResponse(value = {}) {
  const row = sanitizePlayerChallenge(value);
  return {
    id: row.id,
    teamId: row.teamId,
    playerId: row.challengerId,
    from: row.challengerId,
    fromName: row.challengerName,
    to: row.opponentId,
    toName: row.opponentName,
    drillId: row.drillId,
    drillName: row.drillName,
    score: row.score,
    max: row.maxScore,
    respScore: row.responseScore,
    status: row.status,
    ts: row.createdTs,
    respTs: row.respondedTs,
  };
}

function toDatabase(row, challenger, opponent) {
  return {
    team_id: row.teamId,
    id: row.id,
    challenger_id: challenger.email,
    challenger_name: cleanText(challenger.name || row.challengerName || challenger.email.split("@")[0], 240),
    opponent_id: opponent.email,
    opponent_name: cleanText(opponent.name || row.opponentName || opponent.email.split("@")[0], 240),
    drill_id: row.drillId,
    drill_name: row.drillName,
    challenger_score: row.score,
    max_score: row.maxScore,
    response_score: null,
    status: "pending",
    created_ts: row.createdTs && row.createdTs > 0 ? Math.trunc(row.createdTs) : Date.now(),
    responded_ts: null,
    updated_at: new Date().toISOString(),
  };
}

async function activeTeamPlayers(env, teamId) {
  const rows = await selectRows(
    env,
    "players",
    `select=id,email,name,role,team_id&team_id=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1000`,
  );
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({ email: normalizeIdentity(row?.email), name: cleanText(row?.name, 240) }))
    .filter((row) => row.email);
}

async function authorizePlayer(env, requester, teamId) {
  const { readableTeamIds, writableTeamIds } = await collectTeamPriorityAccess(env, requester);
  if (!readableTeamIds.has(teamId) || writableTeamIds.has(teamId)) return { ok: false, status: 403, error: "forbidden" };
  const roster = await activeTeamPlayers(env, teamId);
  const actor = roster.find((row) => row.email === requester);
  if (!actor) return { ok: false, status: 403, error: "active_player_required" };
  return { ok: true, actor, roster };
}

async function challengeById(env, teamId, id) {
  const rows = await selectRows(
    env,
    "player_challenges",
    `select=team_id,id,challenger_id,challenger_name,opponent_id,opponent_name,drill_id,drill_name,challenger_score,max_score,response_score,status,created_ts,responded_ts&team_id=eq.${encodeURIComponent(teamId)}&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function visibleChallenges(env, teamId, requester, roster) {
  const baseSelect = "select=team_id,id,challenger_id,challenger_name,opponent_id,opponent_name,drill_id,drill_name,challenger_score,max_score,response_score,status,created_ts,responded_ts";
  const [outgoing, incoming] = await Promise.all([
    selectRows(env, "player_challenges", `${baseSelect}&team_id=eq.${encodeURIComponent(teamId)}&challenger_id=eq.${encodeURIComponent(requester)}&order=created_ts.desc&limit=${MAX_CHALLENGES_PER_PLAYER}`),
    selectRows(env, "player_challenges", `${baseSelect}&team_id=eq.${encodeURIComponent(teamId)}&opponent_id=eq.${encodeURIComponent(requester)}&order=created_ts.desc&limit=${MAX_CHALLENGES_PER_PLAYER}`),
  ]);
  const active = new Set(roster.map((row) => row.email));
  const byId = new Map();
  for (const row of [...(Array.isArray(outgoing) ? outgoing : []), ...(Array.isArray(incoming) ? incoming : [])]) {
    const normalized = sanitizePlayerChallenge(row);
    if (!normalized.id || !active.has(normalized.challengerId) || !active.has(normalized.opponentId)) continue;
    byId.set(normalized.id, toResponse(row));
  }
  return [...byId.values()].sort((a, b) => Number(b?.respTs || b?.ts || 0) - Number(a?.respTs || a?.ts || 0));
}

function demoResponse(teamId, challenge = null) {
  return Response.json({
    ok: true,
    storage_mode: "demo_local",
    team_id: teamId,
    challenges: [],
    ...(challenge ? { challenge: toResponse(challenge) } : {}),
  });
}

export async function onRequestGet({ request, env }) {
  const auth = await readAuthenticatedIdentity({ env, request, allowDemo: true });
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `player_challenges_get:${getClientKey(request, requester)}`, max: 60, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const teamId = cleanText(new URL(request.url).searchParams.get("team_id"), 180);
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (auth.source === "demo_header" && requester === DEMO_PLAYER) return demoResponse(teamId);
  try {
    const access = await authorizePlayer(env, requester, teamId);
    if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      team_id: teamId,
      challenges: await visibleChallenges(env, teamId, requester, access.roster),
    });
  } catch (error) {
    console.error("player_challenges_get_failed", { teamId, message: cleanText(error?.message, 180) });
    return Response.json({ error: "player_challenge_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await readAuthenticatedIdentity({ env, request, allowDemo: true });
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `player_challenges_post:${getClientKey(request, requester)}`, max: 30, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null);
  const action = cleanText(body?.action, 20).toLowerCase();
  const teamId = cleanText(body?.team_id || body?.teamId, 180);
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (action !== "create" && action !== "respond") return Response.json({ error: "invalid_action" }, { status: 400 });

  const input = sanitizePlayerChallenge(body?.challenge || {}, teamId);
  if (action === "create") {
    input.challengerId = requester;
    const error = validationError(input);
    if (error) return Response.json({ error }, { status: 400 });
  } else if (!input.id) {
    return Response.json({ error: "challenge_id_required" }, { status: 400 });
  }

  if (auth.source === "demo_header" && requester === DEMO_PLAYER) {
    if (action === "respond") {
      const score = finiteNumber(body?.challenge?.score);
      return demoResponse(teamId, { ...input, opponentId: requester, responseScore: score, status: "tied", respondedTs: Date.now() });
    }
    return demoResponse(teamId, { ...input, challengerId: requester, status: "pending", createdTs: input.createdTs || Date.now() });
  }

  try {
    const access = await authorizePlayer(env, requester, teamId);
    if (!access.ok) return Response.json({ error: access.error }, { status: access.status });

    if (action === "create") {
      const opponent = access.roster.find((row) => row.email === input.opponentId);
      if (!opponent) return Response.json({ error: "active_opponent_required" }, { status: 400 });
      const existing = await challengeById(env, teamId, input.id);
      if (existing) {
        const prior = sanitizePlayerChallenge(existing);
        if (prior.challengerId !== requester) return Response.json({ error: "challenge_id_conflict" }, { status: 409 });
        return Response.json({ ok: true, storage_mode: "signed_api", team_id: teamId, challenge: toResponse(existing), idempotent: true });
      }
      const inserted = await insertRows(env, "player_challenges", toDatabase(input, access.actor, opponent));
      const saved = Array.isArray(inserted) ? inserted[0] : null;
      if (!saved) throw new Error("challenge_insert_empty");
      return Response.json({ ok: true, storage_mode: "signed_api", team_id: teamId, challenge: toResponse(saved) }, { status: 201 });
    }

    const responseScore = finiteNumber(body?.challenge?.score);
    if (responseScore === null || responseScore < 0) return Response.json({ error: "invalid_response_score" }, { status: 400 });
    const existing = await challengeById(env, teamId, input.id);
    if (!existing) return Response.json({ error: "challenge_not_found" }, { status: 404 });
    const prior = sanitizePlayerChallenge(existing);
    if (prior.opponentId !== requester) return Response.json({ error: "forbidden" }, { status: 403 });
    if (prior.maxScore !== null && responseScore > prior.maxScore) return Response.json({ error: "invalid_response_score" }, { status: 400 });
    if (prior.status !== "pending") {
      if (prior.responseScore === responseScore) return Response.json({ ok: true, storage_mode: "signed_api", team_id: teamId, challenge: toResponse(existing), idempotent: true });
      return Response.json({ error: "challenge_already_resolved" }, { status: 409 });
    }
    const respondedTs = Date.now();
    const status = responseScore > prior.score ? "won" : responseScore === prior.score ? "tied" : "lost";
    const updated = await updateRows(
      env,
      "player_challenges",
      `team_id=eq.${encodeURIComponent(teamId)}&id=eq.${encodeURIComponent(prior.id)}&opponent_id=eq.${encodeURIComponent(requester)}&status=eq.pending`,
      { response_score: responseScore, status, responded_ts: respondedTs, updated_at: new Date().toISOString() },
    );
    const saved = Array.isArray(updated) ? updated[0] : null;
    if (!saved) return Response.json({ error: "challenge_already_resolved" }, { status: 409 });
    return Response.json({ ok: true, storage_mode: "signed_api", team_id: teamId, challenge: toResponse(saved) });
  } catch (error) {
    console.error("player_challenges_post_failed", { teamId, action, message: cleanText(error?.message, 180) });
    return Response.json({ error: "player_challenge_write_failed" }, { status: 500 });
  }
}
