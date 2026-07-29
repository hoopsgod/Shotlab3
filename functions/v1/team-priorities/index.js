import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { callRpc, selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const COACH_ROLES = new Set(["coach", "assistant_coach"]);

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const safeNumber = (value, fallback, min, max) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
};

export function sanitizeTeamPriorities(value = {}) {
  return {
    todayFocusText: cleanText(value?.todayFocusText || "Daily shot volume + clean mechanics", 240),
    focusEmphasis: cleanText(value?.focusEmphasis || "Volume", 60),
    priorityDrillText: cleanText(value?.priorityDrillText || "At-home drill block", 180),
    challengeText: cleanText(value?.challengeText || "Build momentum: complete one drill and log shots today.", 600),
    weeklyMakesTarget: safeNumber(value?.weeklyMakesTarget, 500, 0, 1_000_000),
    weeklyCheckinsTarget: safeNumber(value?.weeklyCheckinsTarget, 2, 0, 50),
  };
}

function rpcScalar(json, key) {
  if (typeof json === "string") return json.trim();
  if (Array.isArray(json)) {
    const first = json[0];
    if (typeof first === "string") return first.trim();
    return cleanText(first?.[key] || first?.resolved_user_uuid || first?.user_id, 120);
  }
  return cleanText(json?.[key] || json?.resolved_user_uuid || json?.user_id, 120);
}

async function resolveRequesterUuid(env, requester) {
  try {
    return rpcScalar(
      await callRpc(env, "resolve_app_user_uuid", { p_identifier: requester }),
      "resolve_app_user_uuid",
    );
  } catch {
    return "";
  }
}

export async function collectTeamPriorityAccess(env, requester) {
  const normalizedRequester = normalizeIdentity(requester);
  const resolvedUuid = await resolveRequesterUuid(env, normalizedRequester);
  const readableTeamIds = new Set();
  const writableTeamIds = new Set();

  try {
    const profiles = await selectRows(
      env,
      "legacy_auth_profiles",
      `select=team_id,role&email=eq.${encodeURIComponent(normalizedRequester)}`,
    );
    for (const row of Array.isArray(profiles) ? profiles : []) {
      const teamId = cleanText(row?.team_id || row?.teamId, 160);
      const role = normalizeIdentity(row?.role);
      if (!teamId) continue;
      readableTeamIds.add(teamId);
      if (COACH_ROLES.has(role)) writableTeamIds.add(teamId);
    }
  } catch {}

  if (resolvedUuid) {
    try {
      const memberships = await selectRows(
        env,
        "team_memberships",
        `select=team_id,role,status&user_id=eq.${encodeURIComponent(resolvedUuid)}&status=eq.active`,
      );
      for (const row of Array.isArray(memberships) ? memberships : []) {
        const teamId = cleanText(row?.team_id || row?.teamId, 160);
        const role = normalizeIdentity(row?.role);
        if (!teamId) continue;
        readableTeamIds.add(teamId);
        if (COACH_ROLES.has(role)) writableTeamIds.add(teamId);
      }
    } catch {}

    try {
      const ownedTeams = await selectRows(
        env,
        "teams",
        `select=id,coach_user_id&coach_user_id=eq.${encodeURIComponent(resolvedUuid)}`,
      );
      for (const row of Array.isArray(ownedTeams) ? ownedTeams : []) {
        const teamId = cleanText(row?.id, 160);
        if (!teamId) continue;
        readableTeamIds.add(teamId);
        writableTeamIds.add(teamId);
      }
    } catch {}
  }

  return { readableTeamIds, writableTeamIds, resolvedUuid };
}

function rowToResponse(row = {}) {
  return {
    teamId: cleanText(row?.team_id || row?.teamId, 160),
    priorities: sanitizeTeamPriorities(row?.priorities || {}),
    updatedAt: cleanText(row?.updated_at || row?.updatedAt, 120),
    updatedBy: normalizeIdentity(row?.updated_by || row?.updatedBy),
  };
}

function localDemoResponse(prioritiesByTeam = {}) {
  return Response.json({
    ok: true,
    storage_mode: "demo_local",
    priorities_by_team: prioritiesByTeam,
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
    key: `team_priorities_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) return localDemoResponse();

  try {
    const { readableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.size) return Response.json({ error: "forbidden" }, { status: 403 });

    const prioritiesByTeam = {};
    const metadataByTeam = {};
    for (const teamId of readableTeamIds) {
      const rows = await selectRows(
        env,
        "team_priorities",
        `select=team_id,priorities,updated_at,updated_by&team_id=eq.${encodeURIComponent(teamId)}&limit=1`,
      );
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) continue;
      const normalized = rowToResponse(row);
      prioritiesByTeam[teamId] = normalized.priorities;
      metadataByTeam[teamId] = { updatedAt: normalized.updatedAt, updatedBy: normalized.updatedBy };
    }

    return Response.json({
      ok: true,
      storage_mode: "team_remote",
      priorities_by_team: prioritiesByTeam,
      metadata_by_team: metadataByTeam,
    });
  } catch (error) {
    console.error("team_priorities_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "priority_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await resolveRequester(request, env);
  const requester = auth.identity;
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `team_priorities_post:${getClientKey(request, requester)}`,
    max: 20,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  const body = await request.json().catch(() => null);
  const teamId = cleanText(body?.team_id || body?.teamId, 160);
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (!body?.priorities || typeof body.priorities !== "object" || Array.isArray(body.priorities)) {
    return Response.json({ error: "invalid_priorities" }, { status: 400 });
  }

  const priorities = sanitizeTeamPriorities(body.priorities);
  if (auth.source === "demo_header" && DEMO_IDENTITIES.has(requester)) return localDemoResponse({ [teamId]: priorities });

  try {
    const { writableTeamIds } = await collectTeamPriorityAccess(env, requester);
    if (!writableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });

    const updatedAt = new Date().toISOString();
    const rows = await upsertRows(env, "team_priorities", {
      team_id: teamId,
      priorities,
      updated_at: updatedAt,
      updated_by: requester,
    }, "team_id");
    const saved = Array.isArray(rows) && rows[0] ? rowToResponse(rows[0]) : {
      teamId,
      priorities,
      updatedAt,
      updatedBy: requester,
    };

    return Response.json({
      ok: true,
      storage_mode: "team_remote",
      team_id: teamId,
      priorities: saved.priorities,
      updated_at: saved.updatedAt,
      updated_by: saved.updatedBy,
    }, { status: 200 });
  } catch (error) {
    console.error("team_priorities_post_failed", { teamId, message: cleanText(error?.message, 180) });
    return Response.json({ error: "priority_write_failed" }, { status: 500 });
  }
}
