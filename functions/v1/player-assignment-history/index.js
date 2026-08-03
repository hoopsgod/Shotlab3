import { selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";
import { sanitizeAssignmentDueDate, sanitizePlayerAssignment } from "../player-assignments/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const clean = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const identity = (value) => clean(value, 320).toLowerCase();

const assignmentSelect = () => "select=team_id,player_identity,player_name,assignment_text,result_detail,due_date,state,assigned_by,created_at,updated_at,acknowledged_at,started_at,completed_at";
const historySelect = () => `${assignmentSelect()},archived_at`;

const toDatabase = (row = {}) => ({
  team_id: row.teamId,
  player_identity: row.playerIdentity,
  player_name: row.playerName,
  assignment_text: row.assignmentText,
  result_detail: row.resultDetail,
  due_date: row.dueDate || null,
  state: row.state,
  assigned_by: row.assignedBy,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
  acknowledged_at: row.acknowledgedAt || null,
  started_at: row.startedAt || null,
  completed_at: row.completedAt || null,
});

const sanitizeHistory = (value = {}) => ({
  ...sanitizePlayerAssignment(value),
  archivedAt: clean(value?.archived_at || value?.archivedAt, 120),
});

async function resolveRequester(request, env) {
  const auth = await readAuthenticatedIdentity({ env, request, allowDemo: true });
  return { ...auth, identity: identity(auth?.identity) };
}

async function activeTeamPlayers(env, teamId) {
  const rows = await selectRows(env, "players", `select=email,name,role,team_id&team_id=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1000`);
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({ email: identity(row?.email), name: clean(row?.name, 320) }))
    .filter((row) => row.email);
}

async function currentAssignment(env, teamId, playerIdentity) {
  const rows = await selectRows(
    env,
    "player_assignments",
    `${assignmentSelect()}&team_id=eq.${encodeURIComponent(teamId)}&player_identity=eq.${encodeURIComponent(playerIdentity)}&limit=1`,
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function onRequestGet({ request, env }) {
  const auth = await resolveRequester(request, env);
  const requester = auth.identity;
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `player_assignment_history_get:${getClientKey(request, requester)}`, max: 60, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const url = new URL(request.url);
  const teamId = clean(url.searchParams.get("team_id"), 180);
  const requestedPlayer = identity(url.searchParams.get("player_identity"));
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) {
    return Response.json({ ok: true, storage_mode: "demo_local", team_id: teamId, history: [] });
  }

  try {
    const { writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!writableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const roster = await activeTeamPlayers(env, teamId);
    const active = new Set(roster.map((row) => row.email));
    const playerFilter = requestedPlayer ? `&player_identity=eq.${encodeURIComponent(requestedPlayer)}` : "";
    const rows = await selectRows(
      env,
      "player_assignment_history",
      `${historySelect()}&team_id=eq.${encodeURIComponent(teamId)}${playerFilter}&order=completed_at.desc&limit=250`,
    );
    const history = (Array.isArray(rows) ? rows : [])
      .map(sanitizeHistory)
      .filter((row) => row.playerIdentity && active.has(row.playerIdentity));
    return Response.json({ ok: true, storage_mode: "team_remote", team_id: teamId, history });
  } catch (error) {
    console.error("player_assignment_history_get_failed", { teamId, message: clean(error?.message, 180) });
    return Response.json({ error: "assignment_history_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await resolveRequester(request, env);
  const requester = auth.identity;
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `player_assignment_history_post:${getClientKey(request, requester)}`, max: 20, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const teamId = clean(body?.team_id || body?.teamId, 180);
  const rawDueDate = clean(body?.assignment?.due_date || body?.assignment?.dueDate, 32);
  const input = sanitizePlayerAssignment({ ...(body?.assignment || {}), teamId });
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (!input.playerIdentity) return Response.json({ error: "player_identity_required" }, { status: 400 });
  if (!input.assignmentText) return Response.json({ error: "assignment_text_required" }, { status: 400 });
  if (rawDueDate && !sanitizeAssignmentDueDate(rawDueDate)) return Response.json({ error: "invalid_due_date" }, { status: 400 });

  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) {
    const now = new Date().toISOString();
    return Response.json({
      ok: true,
      storage_mode: "demo_local",
      archived_previous: true,
      assignment: sanitizePlayerAssignment({
        ...input,
        state: "assigned",
        assignedBy: requester,
        createdAt: now,
        updatedAt: now,
        acknowledgedAt: "",
        startedAt: "",
        completedAt: "",
      }),
    });
  }

  try {
    const { writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!writableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const roster = await activeTeamPlayers(env, teamId);
    const player = roster.find((row) => row.email === input.playerIdentity);
    if (!player) return Response.json({ error: "active_player_required" }, { status: 400 });

    const currentRaw = await currentAssignment(env, teamId, input.playerIdentity);
    if (!currentRaw) return Response.json({ error: "completed_assignment_required" }, { status: 409 });
    const current = sanitizePlayerAssignment(currentRaw);
    if (current.state !== "completed" || !current.completedAt) {
      return Response.json({ error: "assignment_in_progress" }, { status: 409 });
    }

    const archivedAt = new Date().toISOString();
    await upsertRows(
      env,
      "player_assignment_history",
      { ...toDatabase(current), archived_at: archivedAt },
      "team_id,player_identity,created_at",
    );

    const now = new Date().toISOString();
    const next = {
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
    const rows = await upsertRows(env, "player_assignments", toDatabase(next), "team_id,player_identity");
    const assignment = Array.isArray(rows) && rows[0] ? sanitizePlayerAssignment(rows[0]) : next;
    return Response.json({
      ok: true,
      storage_mode: "team_remote",
      team_id: teamId,
      archived_previous: true,
      assignment,
      archived_assignment: sanitizeHistory({ ...currentRaw, archived_at: archivedAt }),
    });
  } catch (error) {
    console.error("player_assignment_history_post_failed", { teamId, message: clean(error?.message, 180) });
    return Response.json({ error: "assignment_next_failed" }, { status: 500 });
  }
}
