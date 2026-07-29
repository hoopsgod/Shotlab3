import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const STATES = new Set(["planned", "completed", "dismissed"]);

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);

export function sanitizeCoachFollowUp(value = {}) {
  const state = normalizeIdentity(value?.state);
  return {
    teamId: cleanText(value?.team_id || value?.teamId, 160),
    playerIdentity: normalizeIdentity(value?.player_identity || value?.playerIdentity).slice(0, 320),
    playerName: cleanText(value?.player_name || value?.playerName, 320),
    state: STATES.has(state) ? state : "planned",
    note: cleanText(value?.note, 4000),
    createdAt: cleanText(value?.created_at || value?.createdAt, 120),
    updatedAt: cleanText(value?.updated_at || value?.updatedAt, 120),
    completedAt: cleanText(value?.completed_at || value?.completedAt, 120),
    updatedBy: normalizeIdentity(value?.updated_by || value?.updatedBy),
  };
}

function rowToResponse(row = {}) {
  return sanitizeCoachFollowUp(row);
}

function demoResponse(followUps = []) {
  return Response.json({
    ok: true,
    storage_mode: "demo_local",
    follow_ups: followUps,
  });
}

async function resolveRequester(request, env) {
  const auth = await readAuthenticatedIdentity({ env, request, allowDemo: true });
  return { ...auth, identity: normalizeIdentity(auth.identity) };
}

export async function onRequestGet({ request, env }) {
  const auth = await resolveRequester(request, env);
  const requester = auth.identity;
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `coach_follow_ups_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) return demoResponse();

  try {
    const { writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!writableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });

    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 160);
    const readableTeamIds = requestedTeamId
      ? (writableTeamIds.has(requestedTeamId) ? [requestedTeamId] : [])
      : [...writableTeamIds];
    if (requestedTeamId && !readableTeamIds.length) return Response.json({ error: "forbidden" }, { status: 403 });

    const followUps = [];
    for (const teamId of readableTeamIds) {
      const rows = await selectRows(
        env,
        "coach_follow_ups",
        `select=team_id,player_identity,player_name,state,note,created_at,updated_at,completed_at,updated_by&team_id=eq.${encodeURIComponent(teamId)}&order=updated_at.desc&limit=250`,
      );
      for (const row of Array.isArray(rows) ? rows : []) followUps.push(rowToResponse(row));
    }

    return Response.json({
      ok: true,
      storage_mode: "team_remote",
      follow_ups: followUps,
    });
  } catch (error) {
    console.error("coach_follow_ups_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "follow_up_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await resolveRequester(request, env);
  const requester = auth.identity;
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `coach_follow_ups_post:${getClientKey(request, requester)}`,
    max: 30,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  const body = await request.json().catch(() => null);
  const followUp = sanitizeCoachFollowUp(body || {});
  if (!followUp.teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (!followUp.playerIdentity) return Response.json({ error: "player_identity_required" }, { status: 400 });

  const now = new Date().toISOString();
  const saved = {
    ...followUp,
    createdAt: followUp.createdAt || now,
    updatedAt: now,
    completedAt: followUp.state === "completed" ? now : "",
    updatedBy: requester,
  };

  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) return demoResponse([saved]);

  try {
    const { writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!writableTeamIds.has(followUp.teamId)) return Response.json({ error: "forbidden" }, { status: 403 });

    const rows = await upsertRows(env, "coach_follow_ups", {
      team_id: saved.teamId,
      player_identity: saved.playerIdentity,
      player_name: saved.playerName,
      state: saved.state,
      note: saved.note,
      created_at: saved.createdAt,
      updated_at: saved.updatedAt,
      completed_at: saved.completedAt || null,
      updated_by: requester,
    }, "team_id,player_identity");

    const normalized = Array.isArray(rows) && rows[0] ? rowToResponse(rows[0]) : saved;
    return Response.json({
      ok: true,
      storage_mode: "team_remote",
      follow_up: normalized,
    });
  } catch (error) {
    console.error("coach_follow_ups_post_failed", {
      teamId: followUp.teamId,
      playerIdentity: followUp.playerIdentity,
      message: cleanText(error?.message, 180),
    });
    return Response.json({ error: "follow_up_write_failed" }, { status: 500 });
  }
}
