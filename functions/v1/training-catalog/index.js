import { deleteRows, selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const MODES = new Set(["home", "program"]);
const MAX_CUSTOM_DRILLS_PER_TEAM = 100;

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const finiteNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export function sanitizeTrainingDrill(value = {}, fallbackTeamId = "", fallbackSortOrder = 0) {
  const mode = cleanText(value?.mode, 20).toLowerCase();
  const maxScore = finiteNumber(value?.max_score ?? value?.maxScore ?? value?.max);
  return {
    id: cleanText(value?.id, 160),
    teamId: cleanText(value?.team_id || value?.teamId || fallbackTeamId, 160),
    mode,
    name: cleanText(value?.name, 320),
    description: cleanText(value?.description || value?.desc, 4000),
    instructions: cleanText(value?.instructions, 8000),
    maxScore,
    icon: cleanText(value?.icon, 80),
    sortOrder: Math.max(0, Math.min(1000, Math.trunc(finiteNumber(value?.sort_order ?? value?.sortOrder) ?? fallbackSortOrder))),
  };
}

function validateTrainingDrill(row) {
  if (!row.id) return "drill_id_required";
  if (!row.teamId) return "team_id_required";
  if (!MODES.has(row.mode)) return "invalid_drill_mode";
  if (!row.name) return "drill_name_required";
  if (row.maxScore !== null && row.maxScore < 0) return "invalid_max_score";
  return "";
}

function toDatabase(row, requester) {
  return {
    team_id: row.teamId,
    id: row.id,
    mode: row.mode,
    name: row.name,
    description: row.description || null,
    instructions: row.instructions || null,
    max_score: row.maxScore,
    icon: row.icon || null,
    sort_order: row.sortOrder,
    updated_at: new Date().toISOString(),
    updated_by: requester,
  };
}

function toResponse(value = {}) {
  const row = sanitizeTrainingDrill(value);
  return {
    id: row.id,
    team_id: row.teamId,
    mode: row.mode,
    name: row.name,
    desc: row.description,
    instructions: row.instructions,
    max: row.maxScore,
    icon: row.icon,
    sortOrder: row.sortOrder,
    isDefaultDemo: false,
  };
}

function demoResponse(teamId = "", rows = [], canWrite = false) {
  return Response.json({
    ok: true,
    storage_mode: "demo_local",
    team_id: teamId,
    can_write: canWrite,
    drills: rows.map(toResponse),
  });
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

async function readTeamCatalog(env, teamId) {
  const rows = await selectRows(
    env,
    "training_drills",
    `select=team_id,id,mode,name,description,instructions,max_score,icon,sort_order,created_at,updated_at,updated_by&team_id=eq.${encodeURIComponent(teamId)}&order=mode.asc,sort_order.asc,name.asc&limit=${MAX_CUSTOM_DRILLS_PER_TEAM}`,
  );
  return (Array.isArray(rows) ? rows : []).map(toResponse);
}

function resolveRequestedTeamId(request, readableTeamIds) {
  const requested = cleanText(new URL(request.url).searchParams.get("team_id"), 160);
  if (requested) return readableTeamIds.has(requested) ? requested : "";
  return readableTeamIds.size === 1 ? [...readableTeamIds][0] : "";
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({ key: `training_catalog_get:${getClientKey(request, requester)}`, max: 60, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse("", [], requester.startsWith("coach."));

  try {
    const { readableTeamIds, writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });
    const requested = cleanText(new URL(request.url).searchParams.get("team_id"), 160);
    const teamId = resolveRequestedTeamId(request, readableTeamIds);
    if (!teamId) {
      return Response.json({ error: requested ? "forbidden" : "team_id_required" }, { status: requested ? 403 : 400 });
    }
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      team_id: teamId,
      can_write: writableTeamIds.has(teamId),
      drills: await readTeamCatalog(env, teamId),
    });
  } catch (error) {
    console.error("training_catalog_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "training_catalog_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({ key: `training_catalog_post:${getClientKey(request, requester)}`, max: 30, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const teamId = cleanText(body?.team_id || body?.teamId, 160);
  const inputRows = Array.isArray(body?.drills) ? body.drills : [];
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (inputRows.length > MAX_CUSTOM_DRILLS_PER_TEAM) return Response.json({ error: "too_many_drills" }, { status: 400 });
  const rows = inputRows.map((row, index) => sanitizeTrainingDrill(row, teamId, index));
  for (const row of rows) {
    const validationError = validateTrainingDrill(row);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });
    if (row.teamId !== teamId) return Response.json({ error: "team_mismatch" }, { status: 400 });
  }
  const incomingIds = rows.map((row) => row.id);
  if (new Set(incomingIds).size !== incomingIds.length) return Response.json({ error: "duplicate_drill_id" }, { status: 400 });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse(teamId, rows, true);

  try {
    const { writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!writableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });

    const existing = await selectRows(
      env,
      "training_drills",
      `select=id,mode&team_id=eq.${encodeURIComponent(teamId)}&limit=${MAX_CUSTOM_DRILLS_PER_TEAM}`,
    );
    const incomingIdSet = new Set(incomingIds);
    const removed = (Array.isArray(existing) ? existing : [])
      .map((row) => ({ id: cleanText(row?.id, 160), mode: cleanText(row?.mode, 20) }))
      .filter((row) => row.id && MODES.has(row.mode) && !incomingIdSet.has(row.id));

    if (rows.length) await upsertRows(env, "training_drills", rows.map((row) => toDatabase(row, requester)), "team_id,id");
    for (const row of removed) {
      await deleteRows(
        env,
        "training_drills",
        `team_id=eq.${encodeURIComponent(teamId)}&id=eq.${encodeURIComponent(row.id)}`,
      );
    }

    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      team_id: teamId,
      can_write: true,
      drills: await readTeamCatalog(env, teamId),
      deleted_count: removed.length,
    });
  } catch (error) {
    console.error("training_catalog_post_failed", { teamId, message: cleanText(error?.message, 180) });
    return Response.json({ error: "training_catalog_sync_failed" }, { status: 500 });
  }
}
