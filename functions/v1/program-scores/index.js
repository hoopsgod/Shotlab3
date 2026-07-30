import { deleteRows, selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const MAX_WRITE_ROWS = 25;
const MAX_READ_ROWS_PER_TEAM = 5000;

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

function finiteScore(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(1_000_000_000, Math.max(0, numeric));
}

export function sanitizeProgramScoreRow(value = {}) {
  return {
    id: cleanText(value?.id, 160),
    teamId: cleanText(value?.team_id || value?.teamId, 160),
    playerId: normalizeIdentity(value?.player_id || value?.playerId || value?.player_email || value?.email).slice(0, 320),
    playerEmail: normalizeIdentity(value?.player_email || value?.playerEmail || value?.email).slice(0, 320),
    playerName: cleanText(value?.player_name || value?.playerName || value?.name, 320),
    drillId: cleanText(value?.drill_id || value?.drillId, 160),
    drillName: cleanText(value?.drill_name || value?.drillName, 320),
    score: finiteScore(value?.score),
    sessionDate: cleanText(value?.session_date || value?.sessionDate || value?.date, 40),
    loggedAt: cleanText(value?.logged_at || value?.loggedAt, 80),
  };
}

function validateProgramScoreRow(row) {
  if (!row.id) return "id_required";
  if (!row.teamId) return "team_id_required";
  if (!row.playerId || !row.playerEmail) return "player_identity_required";
  if (!row.drillId || !row.drillName) return "drill_identity_required";
  if (row.score === null) return "score_required";
  if (row.sessionDate && !/^\d{4}-\d{2}-\d{2}$/.test(row.sessionDate)) return "invalid_session_date";
  return "";
}

function toDatabase(row, audit) {
  return {
    id: row.id,
    team_id: row.teamId,
    player_id: row.playerId,
    player_email: row.playerEmail,
    player_name: row.playerName || null,
    drill_id: row.drillId,
    drill_name: row.drillName,
    score: row.score,
    session_date: row.sessionDate || null,
    ...(row.loggedAt ? { logged_at: row.loggedAt } : {}),
    src: "program",
    recorded_by: audit.recordedBy,
    recorded_by_role: audit.recordedByRole,
  };
}

function toResponse(value = {}) {
  const row = sanitizeProgramScoreRow(value);
  return {
    id: row.id,
    team_id: row.teamId,
    player_id: row.playerId,
    player_email: row.playerEmail,
    player_name: row.playerName,
    drill_id: row.drillId,
    drill_name: row.drillName,
    score: row.score,
    session_date: row.sessionDate,
    logged_at: row.loggedAt,
    src: "program",
    recorded_by: normalizeIdentity(value?.recorded_by || value?.recordedBy),
    recorded_by_role: cleanText(value?.recorded_by_role || value?.recordedByRole, 40),
  };
}

function localDemoResponse(rows = [], requester = "") {
  return Response.json({
    ok: true,
    storage_mode: "demo_local",
    program_scores: rows.map((row) => toResponse({
      ...row,
      recorded_by: requester,
      recorded_by_role: requester.startsWith("coach.") ? "coach" : "player",
    })),
  });
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

async function activeRosterMembers(env, teamId) {
  const [players, profiles] = await Promise.all([
    selectRows(
      env,
      "players",
      `select=id,email,role,team_id,hide_from_leaderboards&team_id=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1000`,
    ),
    selectRows(
      env,
      "player_profiles",
      `select=id,user_id,team_id,invited_email,invite_status&team_id=eq.${encodeURIComponent(teamId)}&limit=1000`,
    ),
  ]);

  const hidden = new Set();
  for (const player of Array.isArray(players) ? players : []) {
    if (player?.hide_from_leaderboards !== true) continue;
    [player?.id, player?.email].map(normalizeIdentity).filter(Boolean).forEach((key) => hidden.add(key));
  }

  const members = [];
  for (const player of Array.isArray(players) ? players : []) {
    if (player?.hide_from_leaderboards === true) continue;
    const keys = new Set([player?.id, player?.email].map(normalizeIdentity).filter(Boolean));
    if (keys.size) members.push(keys);
  }
  for (const profile of Array.isArray(profiles) ? profiles : []) {
    const keys = new Set([profile?.id, profile?.user_id, profile?.invited_email].map(normalizeIdentity).filter(Boolean));
    if (!keys.size || [...keys].some((key) => hidden.has(key))) continue;
    members.push(keys);
  }
  return members;
}

function rosterContains(members, row) {
  return members.some((keys) => keys.has(row.playerEmail) && (keys.has(row.playerId) || row.playerId === row.playerEmail));
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({ key: `program_scores_get:${getClientKey(request, requester)}`, max: 60, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (DEMO_IDENTITIES.has(requester)) return localDemoResponse([], requester);

  try {
    const { readableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });
    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 160);
    const teamIds = requestedTeamId
      ? (readableTeamIds.has(requestedTeamId) ? [requestedTeamId] : [])
      : [...readableTeamIds];
    if (requestedTeamId && !teamIds.length) return Response.json({ error: "forbidden" }, { status: 403 });

    const programScores = [];
    for (const teamId of teamIds) {
      const rows = await selectRows(
        env,
        "program_scores",
        `select=id,team_id,player_id,player_email,player_name,drill_id,drill_name,score,session_date,logged_at,src,recorded_by,recorded_by_role&team_id=eq.${encodeURIComponent(teamId)}&order=logged_at.asc&limit=${MAX_READ_ROWS_PER_TEAM}`,
      );
      for (const row of Array.isArray(rows) ? rows : []) programScores.push(toResponse(row));
    }
    return Response.json({ ok: true, storage_mode: "signed_api", program_scores: programScores });
  } catch (error) {
    console.error("program_scores_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "program_score_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({ key: `program_scores_post:${getClientKey(request, requester)}`, max: 40, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const inputRows = Array.isArray(body?.program_scores) ? body.program_scores : body?.program_score ? [body.program_score] : [];
  if (!inputRows.length) return Response.json({ error: "program_scores_required" }, { status: 400 });
  if (inputRows.length > MAX_WRITE_ROWS) return Response.json({ error: "too_many_program_scores" }, { status: 400 });
  const rows = inputRows.map(sanitizeProgramScoreRow);
  for (const row of rows) {
    const validationError = validateProgramScoreRow(row);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });
  }
  if (DEMO_IDENTITIES.has(requester)) return localDemoResponse(rows, requester);

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    const requesterIds = new Set([requester, normalizeIdentity(resolvedUuid)].filter(Boolean));
    const rosterByTeam = new Map();
    const databaseRows = [];

    for (const row of rows) {
      if (!readableTeamIds.has(row.teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
      const isCoachWrite = writableTeamIds.has(row.teamId);
      if (isCoachWrite) {
        if (!rosterByTeam.has(row.teamId)) rosterByTeam.set(row.teamId, await activeRosterMembers(env, row.teamId));
        if (!rosterContains(rosterByTeam.get(row.teamId), row)) {
          return Response.json({ error: "active_roster_player_required" }, { status: 403 });
        }
      } else if (row.playerEmail !== requester || !requesterIds.has(row.playerId)) {
        return Response.json({ error: "identity_mismatch" }, { status: 403 });
      }

      const existing = await selectRows(
        env,
        "program_scores",
        `select=id,team_id,player_id,player_email,logged_at&id=eq.${encodeURIComponent(row.id)}&limit=1`,
      );
      const prior = Array.isArray(existing) ? existing[0] : null;
      if (prior && (
        cleanText(prior?.team_id, 160) !== row.teamId
        || normalizeIdentity(prior?.player_id) !== row.playerId
        || normalizeIdentity(prior?.player_email) !== row.playerEmail
      )) return Response.json({ error: "program_score_id_conflict" }, { status: 409 });

      row.loggedAt = cleanText(prior?.logged_at, 80) || new Date().toISOString();
      databaseRows.push(toDatabase(row, {
        recordedBy: requester,
        recordedByRole: isCoachWrite ? "coach" : "player",
      }));
    }

    const saved = await upsertRows(env, "program_scores", databaseRows, "id");
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      program_scores: (Array.isArray(saved) ? saved : []).map(toResponse),
    });
  } catch (error) {
    console.error("program_scores_post_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "program_score_write_failed" }, { status: 500 });
  }
}

export async function onRequestDelete({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({ key: `program_scores_delete:${getClientKey(request, requester)}`, max: 20, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const teamId = cleanText(body?.team_id || body?.teamId, 160);
  const playerIdentity = normalizeIdentity(body?.player_identity || body?.playerIdentity || body?.email);
  if (!teamId || !playerIdentity) return Response.json({ error: "program_score_delete_identity_required" }, { status: 400 });
  if (DEMO_IDENTITIES.has(requester)) return Response.json({ ok: true, storage_mode: "demo_local", deleted_count: 0 });

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const requesterIds = new Set([requester, normalizeIdentity(resolvedUuid)].filter(Boolean));
    if (!writableTeamIds.has(teamId) && !requesterIds.has(playerIdentity)) {
      return Response.json({ error: "identity_mismatch" }, { status: 403 });
    }

    const deletedByEmail = await deleteRows(
      env,
      "program_scores",
      `team_id=eq.${encodeURIComponent(teamId)}&player_email=eq.${encodeURIComponent(playerIdentity)}`,
    );
    const deletedByPlayerId = await deleteRows(
      env,
      "program_scores",
      `team_id=eq.${encodeURIComponent(teamId)}&player_id=eq.${encodeURIComponent(playerIdentity)}`,
    );
    const ids = new Set([
      ...(Array.isArray(deletedByEmail) ? deletedByEmail : []),
      ...(Array.isArray(deletedByPlayerId) ? deletedByPlayerId : []),
    ].map((row) => cleanText(row?.id, 160)).filter(Boolean));

    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      deleted_count: ids.size,
      team_id: teamId,
      player_identity: playerIdentity,
    });
  } catch (error) {
    console.error("program_scores_delete_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "program_score_delete_failed" }, { status: 500 });
  }
}
