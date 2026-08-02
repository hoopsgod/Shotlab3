import { selectRows, updateRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const STATES = ["assigned", "acknowledged", "started", "completed"];
const STATE_INDEX = new Map(STATES.map((state, index) => [state, index]));
const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

export function sanitizePlayerAssignment(value = {}) {
  const state = cleanText(value?.state || "assigned", 32).toLowerCase();
  return {
    teamId: cleanText(value?.team_id || value?.teamId, 180),
    playerIdentity: normalizeIdentity(value?.player_identity || value?.playerIdentity).slice(0, 320),
    playerName: cleanText(value?.player_name || value?.playerName, 320),
    assignmentText: cleanText(value?.assignment_text || value?.assignmentText, 4000),
    resultDetail: cleanText(value?.result_detail || value?.resultDetail, 1000),
    state: STATE_INDEX.has(state) ? state : "assigned",
    assignedBy: normalizeIdentity(value?.assigned_by || value?.assignedBy),
    createdAt: cleanText(value?.created_at || value?.createdAt, 120),
    updatedAt: cleanText(value?.updated_at || value?.updatedAt, 120),
    acknowledgedAt: cleanText(value?.acknowledged_at || value?.acknowledgedAt, 120),
    startedAt: cleanText(value?.started_at || value?.startedAt, 120),
    completedAt: cleanText(value?.completed_at || value?.completedAt, 120),
  };
}

function toDatabase(row = {}) {
  return {
    team_id: row.teamId,
    player_identity: row.playerIdentity,
    player_name: row.playerName,
    assignment_text: row.assignmentText,
    result_detail: row.resultDetail,
    state: row.state,
    assigned_by: row.assignedBy,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    acknowledged_at: row.acknowledgedAt || null,
    started_at: row.startedAt || null,
    completed_at: row.completedAt || null,
  };
}

function assignmentSelect() {
  return "select=team_id,player_identity,player_name,assignment_text,result_detail,state,assigned_by,created_at,updated_at,acknowledged_at,started_at,completed_at";
}

async function resolveRequester(request, env) {
  const auth = await readAuthenticatedIdentity({ env, request, allowDemo: true });
  return { ...auth, identity: normalizeIdentity(auth?.identity) };
}

async function activeTeamPlayers(env, teamId) {
  const rows = await selectRows(
    env,
    "players",
    `select=id,email,name,role,team_id&team_id=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1000`,
  );
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({ email: normalizeIdentity(row?.email), name: cleanText(row?.name, 320) }))
    .filter((row) => row.email);
}

async function assignmentByPlayer(env, teamId, playerIdentity) {
  const rows = await selectRows(
    env,
    "player_assignments",
    `${assignmentSelect()}&team_id=eq.${encodeURIComponent(teamId)}&player_identity=eq.${encodeURIComponent(playerIdentity)}&limit=1`,
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

function demoResponse(teamId, assignment = null) {
  return Response.json({
    ok: true,
    storage_mode: "demo_local",
    team_id: teamId,
    assignments: assignment ? [sanitizePlayerAssignment(assignment)] : [],
    ...(assignment ? { assignment: sanitizePlayerAssignment(assignment) } : {}),
  });
}

export async function onRequestGet({ request, env }) {
  const auth = await resolveRequester(request, env);
  const requester = auth.identity;
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `player_assignments_get:${getClientKey(request, requester)}`, max: 60, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const url = new URL(request.url);
  const teamId = cleanText(url.searchParams.get("team_id"), 180);
  const requestedPlayer = normalizeIdentity(url.searchParams.get("player_identity"));
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) return demoResponse(teamId);

  try {
    const { readableTeamIds, writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const roster = await activeTeamPlayers(env, teamId);
    const coachAccess = writableTeamIds.has(teamId);

    if (!coachAccess) {
      if (!roster.some((row) => row.email === requester)) return Response.json({ error: "active_player_required" }, { status: 403 });
      const row = await assignmentByPlayer(env, teamId, requester);
      return Response.json({
        ok: true,
        storage_mode: "team_remote",
        team_id: teamId,
        assignments: row ? [sanitizePlayerAssignment(row)] : [],
      });
    }

    const filter = requestedPlayer
      ? `&player_identity=eq.${encodeURIComponent(requestedPlayer)}`
      : "";
    const rows = await selectRows(
      env,
      "player_assignments",
      `${assignmentSelect()}&team_id=eq.${encodeURIComponent(teamId)}${filter}&order=updated_at.desc&limit=250`,
    );
    const active = new Set(roster.map((row) => row.email));
    const assignments = (Array.isArray(rows) ? rows : [])
      .map(sanitizePlayerAssignment)
      .filter((row) => row.playerIdentity && active.has(row.playerIdentity));
    return Response.json({ ok: true, storage_mode: "team_remote", team_id: teamId, assignments });
  } catch (error) {
    console.error("player_assignments_get_failed", { teamId, message: cleanText(error?.message, 180) });
    return Response.json({ error: "assignment_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await resolveRequester(request, env);
  const requester = auth.identity;
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `player_assignments_post:${getClientKey(request, requester)}`, max: 30, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const action = cleanText(body?.action, 32).toLowerCase();
  const teamId = cleanText(body?.team_id || body?.teamId, 180);
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (!["assign", "acknowledge", "start", "complete"].includes(action)) return Response.json({ error: "invalid_action" }, { status: 400 });

  const input = sanitizePlayerAssignment({ ...(body?.assignment || {}), teamId });
  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) {
    const now = new Date().toISOString();
    if (action === "assign") {
      return demoResponse(teamId, { ...input, state: "assigned", assignedBy: requester, createdAt: now, updatedAt: now });
    }
    const nextState = action === "acknowledge" ? "acknowledged" : action === "start" ? "started" : "completed";
    return demoResponse(teamId, { ...input, playerIdentity: requester, state: nextState, updatedAt: now });
  }

  try {
    const { readableTeamIds, writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const roster = await activeTeamPlayers(env, teamId);

    if (action === "assign") {
      if (!writableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
      const player = roster.find((row) => row.email === input.playerIdentity);
      if (!player) return Response.json({ error: "active_player_required" }, { status: 400 });
      if (!input.assignmentText) return Response.json({ error: "assignment_text_required" }, { status: 400 });
      const now = new Date().toISOString();
      const saved = {
        ...input,
        playerName: input.playerName || player.name,
        state: "assigned",
        assignedBy: requester,
        createdAt: now,
        updatedAt: now,
        acknowledgedAt: "",
        startedAt: "",
        completedAt: "",
      };
      const rows = await upsertRows(env, "player_assignments", toDatabase(saved), "team_id,player_identity");
      const normalized = Array.isArray(rows) && rows[0] ? sanitizePlayerAssignment(rows[0]) : saved;
      return Response.json({ ok: true, storage_mode: "team_remote", team_id: teamId, assignment: normalized });
    }

    if (writableTeamIds.has(teamId)) return Response.json({ error: "player_action_required" }, { status: 403 });
    if (!roster.some((row) => row.email === requester)) return Response.json({ error: "active_player_required" }, { status: 403 });
    const existingRaw = await assignmentByPlayer(env, teamId, requester);
    if (!existingRaw) return Response.json({ error: "assignment_not_found" }, { status: 404 });
    const existing = sanitizePlayerAssignment(existingRaw);
    const nextState = action === "acknowledge" ? "acknowledged" : action === "start" ? "started" : "completed";
    const currentIndex = STATE_INDEX.get(existing.state) ?? 0;
    const nextIndex = STATE_INDEX.get(nextState) ?? 0;
    if (nextIndex < currentIndex) return Response.json({ error: "invalid_state_transition" }, { status: 409 });
    if (nextIndex === currentIndex) return Response.json({ ok: true, storage_mode: "team_remote", team_id: teamId, assignment: existing, idempotent: true });
    if (nextIndex > currentIndex + 1) return Response.json({ error: "invalid_state_transition" }, { status: 409 });

    const now = new Date().toISOString();
    const patch = {
      state: nextState,
      updated_at: now,
      ...(nextState === "acknowledged" ? { acknowledged_at: now } : {}),
      ...(nextState === "started" ? { started_at: now } : {}),
      ...(nextState === "completed" ? { completed_at: now } : {}),
    };
    const rows = await updateRows(
      env,
      "player_assignments",
      `team_id=eq.${encodeURIComponent(teamId)}&player_identity=eq.${encodeURIComponent(requester)}&state=eq.${encodeURIComponent(existing.state)}`,
      patch,
    );
    const saved = Array.isArray(rows) && rows[0] ? sanitizePlayerAssignment(rows[0]) : null;
    if (!saved) return Response.json({ error: "assignment_state_conflict" }, { status: 409 });
    return Response.json({ ok: true, storage_mode: "team_remote", team_id: teamId, assignment: saved });
  } catch (error) {
    console.error("player_assignments_post_failed", { teamId, action, message: cleanText(error?.message, 180) });
    return Response.json({ error: "assignment_write_failed" }, { status: 500 });
  }
}
