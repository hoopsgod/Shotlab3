import { deleteRows, selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const COACH_ROLES = new Set(["coach", "assistant_coach"]);
const ALLOWED_ROLES = new Set(["player", "coach", "assistant_coach"]);
const MAX_PLAYERS_PER_REQUEST = 1000;

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function sanitizePlayerRow(value = {}) {
  const role = normalizeIdentity(value?.role);
  return {
    id: cleanText(value?.id, 180),
    email: normalizeIdentity(value?.email),
    name: cleanText(value?.name, 240),
    role: ALLOWED_ROLES.has(role) ? role : "player",
    teamId: cleanText(value?.team_id ?? value?.teamId, 180),
    hideFromLeaderboards: value?.hide_from_leaderboards === true || value?.hideFromLeaderboards === true,
    createdAt: finiteNumber(value?.created_at ?? value?.createdAt),
  };
}

function toDatabase(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name || null,
    role: row.role,
    team_id: row.teamId || null,
    hide_from_leaderboards: row.hideFromLeaderboards === true,
    created_at: row.createdAt,
  };
}

function toResponse(row = {}) {
  const player = sanitizePlayerRow(row);
  return {
    id: player.id,
    email: player.email,
    name: player.name,
    role: player.role,
    team_id: player.teamId || null,
    hide_from_leaderboards: player.hideFromLeaderboards,
    created_at: player.createdAt,
  };
}

function demoResponse(players = []) {
  return Response.json({ ok: true, storage_mode: "demo_local", players });
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

async function readRowsByEmail(env, email) {
  const rows = await selectRows(env, "players", `select=id,email,name,role,team_id,hide_from_leaderboards,created_at&email=eq.${encodeURIComponent(email)}&limit=10`);
  return Array.isArray(rows) ? rows : [];
}

async function readTeamRows(env, teamId) {
  const rows = await selectRows(env, "players", `select=id,email,name,role,team_id,hide_from_leaderboards,created_at&team_id=eq.${encodeURIComponent(teamId)}&limit=1000`);
  return Array.isArray(rows) ? rows : [];
}

async function readVisiblePlayers(env, requester, writableTeamIds, requestedTeamId = "") {
  const byId = new Map();
  for (const row of await readRowsByEmail(env, requester)) byId.set(cleanText(row?.id, 180), row);
  const teams = requestedTeamId ? [requestedTeamId] : [...writableTeamIds];
  for (const teamId of teams) {
    for (const row of await readTeamRows(env, teamId)) byId.set(cleanText(row?.id, 180), row);
  }
  return [...byId.values()].filter((row) => cleanText(row?.id, 180)).map(toResponse);
}

async function findCollision(env, row) {
  const byId = await selectRows(env, "players", `select=id,email,name,role,team_id,hide_from_leaderboards,created_at&id=eq.${encodeURIComponent(row.id)}&limit=1`);
  const idRow = Array.isArray(byId) ? byId[0] : null;
  const byEmail = await readRowsByEmail(env, row.email);
  const emailRow = byEmail[0] || null;
  return { idRow, emailRow };
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({ key: `players_get:${getClientKey(request, requester)}`, max: 60, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse();

  try {
    const { readableTeamIds, writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 180);
    if (requestedTeamId && !readableTeamIds.has(requestedTeamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const players = await readVisiblePlayers(env, requester, writableTeamIds, requestedTeamId && writableTeamIds.has(requestedTeamId) ? requestedTeamId : "");
    return Response.json({ ok: true, storage_mode: "signed_api", players });
  } catch (error) {
    console.error("players_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "player_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({ key: `players_post:${getClientKey(request, requester)}`, max: 30, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const inputRows = Array.isArray(body?.players) ? body.players : [];
  const replace = body?.replace === true;
  if (inputRows.length > MAX_PLAYERS_PER_REQUEST) return Response.json({ error: "too_many_players" }, { status: 400 });
  const rows = inputRows.map(sanitizePlayerRow);
  for (const row of rows) {
    if (!row.id || !row.email) return Response.json({ error: "player_identity_required" }, { status: 400 });
  }
  if (new Set(rows.map((row) => row.id)).size !== rows.length) return Response.json({ error: "duplicate_player_id" }, { status: 400 });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse(rows.map(toResponse));

  try {
    const { readableTeamIds, writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    const selfInput = rows.filter((row) => row.email === requester);
    if (selfInput.length > 1) return Response.json({ error: "duplicate_self_identity" }, { status: 400 });
    const authorized = [];

    for (const row of rows) {
      const { idRow, emailRow } = await findCollision(env, row);
      if (idRow && normalizeIdentity(idRow.email) !== row.email) return Response.json({ error: "player_id_conflict" }, { status: 409 });
      if (emailRow && cleanText(emailRow.id, 180) !== row.id) return Response.json({ error: "player_email_conflict" }, { status: 409 });
      const prior = idRow || emailRow;
      const priorRole = normalizeIdentity(prior?.role);
      const priorTeamId = cleanText(prior?.team_id, 180);
      const isSelf = row.email === requester;

      if (isSelf) {
        if (priorRole && priorRole !== row.role) return Response.json({ error: "player_role_conflict" }, { status: 409 });
        if (row.teamId && !readableTeamIds.has(row.teamId)) return Response.json({ error: "team_assignment_forbidden" }, { status: 403 });
        const sessionRole = normalizeIdentity(auth?.session?.role);
        if (!priorRole && ["player", "coach", "assistant_coach"].includes(sessionRole)) row.role = sessionRole;
        if (row.createdAt == null) row.createdAt = finiteNumber(prior?.created_at) || Date.now();
        authorized.push(toDatabase(row));
        continue;
      }

      if (!prior) continue;
      if (COACH_ROLES.has(priorRole)) return Response.json({ error: "coach_identity_forbidden" }, { status: 403 });
      if (!priorTeamId || !writableTeamIds.has(priorTeamId)) continue;
      if (row.role !== "player") return Response.json({ error: "player_role_conflict" }, { status: 409 });
      if (row.teamId && row.teamId !== priorTeamId) return Response.json({ error: "team_move_forbidden" }, { status: 403 });
      row.createdAt = finiteNumber(prior.created_at) || row.createdAt || Date.now();
      authorized.push(toDatabase(row));
    }

    if (authorized.length) await upsertRows(env, "players", authorized, "id");
    let deletedSelf = false;
    if (replace && selfInput.length === 0) {
      const existingSelf = await readRowsByEmail(env, requester);
      for (const row of existingSelf) {
        await deleteRows(env, "players", `id=eq.${encodeURIComponent(cleanText(row?.id, 180))}&email=eq.${encodeURIComponent(requester)}`);
        deletedSelf = true;
      }
    }

    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      players: deletedSelf ? [] : await readVisiblePlayers(env, requester, writableTeamIds),
      ignored_count: rows.length - authorized.length,
      deleted_self: deletedSelf,
    });
  } catch (error) {
    console.error("players_post_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "player_sync_failed" }, { status: 500 });
  }
}
