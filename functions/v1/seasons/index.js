import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { callRpc, selectRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const clean = (value) => String(value ?? "").trim();
const normalizeIdentity = (value) => clean(value).toLowerCase();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEMO_COACH_EMAIL = "coach.demo@shotlab.app";
const MAX_PLAN_BYTES = 350_000;

function validDate(value) {
  const raw = clean(value);
  if (!ISO_DATE.test(raw)) return false;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === raw;
}

function validatePlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return { ok: false, error: "invalid_plan" };
  const transitionId = clean(plan.transitionId);
  const activeSeason = plan.activeSeason;
  if (!transitionId || transitionId.length > 180) return { ok: false, error: "invalid_transition_id" };
  if (!activeSeason || typeof activeSeason !== "object" || Array.isArray(activeSeason)) return { ok: false, error: "invalid_active_season" };
  const teamId = clean(activeSeason.teamId);
  const sourceArchiveId = clean(activeSeason.sourceArchiveId);
  const name = clean(activeSeason.name);
  const startDate = clean(activeSeason.startDate);
  const projectedEndDate = clean(activeSeason.projectedEndDate);
  if (!teamId || teamId.length > 180) return { ok: false, error: "invalid_team_id" };
  if (!sourceArchiveId || sourceArchiveId.length > 220) return { ok: false, error: "invalid_source_archive" };
  if (!name || name.length > 120) return { ok: false, error: "invalid_season_name" };
  if (!validDate(startDate) || (projectedEndDate && !validDate(projectedEndDate))) return { ok: false, error: "invalid_season_dates" };
  if (projectedEndDate && startDate > projectedEndDate) return { ok: false, error: "invalid_season_range" };
  if (!Array.isArray(plan.returningMemberships) || plan.returningMemberships.length > 500) return { ok: false, error: "invalid_memberships" };
  for (const membership of plan.returningMemberships) {
    if (!membership || typeof membership !== "object" || !clean(membership.identity)) return { ok: false, error: "invalid_player_identity" };
  }
  const serialized = JSON.stringify(plan);
  if (new TextEncoder().encode(serialized).byteLength > MAX_PLAN_BYTES) return { ok: false, error: "plan_too_large" };
  return { ok: true, teamId, plan: JSON.parse(serialized) };
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `seasons_get:${getClientKey(request, requester)}`, max: 60, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (auth.source === "demo_header" && requester === DEMO_COACH_EMAIL) {
    return Response.json({ ok: true, seasons: [], demoLocalOnly: true });
  }
  try {
    const { readableTeamIds } = await collectTeamPriorityAccess(env, requester);
    const seasons = [];
    for (const teamId of readableTeamIds) {
      const rows = await selectRows(env, "active_seasons", `select=id,team_id,name,start_date,projected_end_date,source_archive_id,lifecycle_status,reusable_structure,created_at&team_id=eq.${encodeURIComponent(teamId)}&order=created_at.desc`);
      seasons.push(...(Array.isArray(rows) ? rows : []));
    }
    return Response.json({ ok: true, seasons });
  } catch (error) {
    console.error("active_seasons_get_failed", { message: clean(error?.message).slice(0, 160) });
    return Response.json({ error: "season_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rate = enforceRateLimit({ key: `seasons_post:${getClientKey(request, requester)}`, max: 6, windowMs: 60_000 });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null);
  const validated = validatePlan(body?.plan);
  if (!validated.ok) return Response.json({ error: validated.error }, { status: 400 });

  if (auth.source === "demo_header" && requester === DEMO_COACH_EMAIL) {
    return Response.json({ ok: true, idempotent: false, demoLocalOnly: true, seasonId: `demo-season-${validated.plan.transitionId}`, transitionId: validated.plan.transitionId }, { status: 201 });
  }

  try {
    const { writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!writableTeamIds.has(validated.teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const result = await callRpc(env, "start_new_season", {
      p_plan: validated.plan,
      p_requester_user_id: requester,
    });
    const payload = Array.isArray(result) ? result[0] : result;
    return Response.json(payload && typeof payload === "object" ? payload : { ok: true, result: payload }, { status: 201 });
  } catch (error) {
    const message = clean(error?.message || error?.details?.message).toUpperCase();
    if (message.includes("FORBIDDEN") || message.includes("UNAUTHORIZED")) return Response.json({ error: "forbidden" }, { status: 403 });
    if (message.includes("ACTIVE_SEASONS_ONE_ACTIVE_PER_TEAM") || message.includes("ACTIVE_SEASONS_TEAM_NAME_UNIQUE")) return Response.json({ error: "active_season_exists" }, { status: 409 });
    if (message.includes("SOURCE_ARCHIVE_NOT_FOUND")) return Response.json({ error: "source_archive_not_found" }, { status: 404 });
    console.error("season_rollover_failed", { message: clean(error?.message).slice(0, 180) });
    return Response.json({ error: "season_rollover_failed" }, { status: 500 });
  }
}
