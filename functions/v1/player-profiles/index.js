import { selectRows, upsertRows } from "../../_utils/supabase.js";
import { enforceRateLimit, getClientKey } from "../../_utils/security.js";
import { readAuthenticatedIdentity } from "../../_utils/legacySession.js";
import { collectTeamPriorityAccess } from "../team-priorities/index.js";

const DEMO_IDENTITIES = new Set(["coach.demo@shotlab.app", "demo@shotlab.app"]);
const MAX_PROFILES_PER_TEAM = 750;

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();
const cleanText = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function sanitizePlayerProfileRow(value = {}, fallbackTeamId = "") {
  const rawUserId = value?.user_id ?? value?.userId;
  return {
    id: cleanText(value?.id, 180),
    teamId: cleanText(value?.team_id || value?.teamId || fallbackTeamId, 180),
    userId: rawUserId == null || cleanText(rawUserId, 320) === "" ? "" : normalizeIdentity(rawUserId),
    firstName: cleanText(value?.first_name || value?.firstName, 120),
    lastName: cleanText(value?.last_name || value?.lastName, 120),
    jerseyNumber: cleanText(value?.jersey_number || value?.jerseyNumber, 40),
    createdAt: finiteNumber(value?.created_at ?? value?.createdAt),
    invitedEmail: normalizeIdentity(value?.invited_email || value?.invitedEmail),
    inviteStatus: cleanText(value?.invite_status || value?.inviteStatus, 40),
    inviteId: cleanText(value?.invite_id || value?.inviteId, 80),
    inviteSentAt: cleanText(value?.invite_sent_at || value?.inviteSentAt, 80),
    inviteClaimedAt: cleanText(value?.invite_claimed_at || value?.inviteClaimedAt, 80),
  };
}

function toDatabase(row) {
  return {
    id: row.id,
    team_id: row.teamId,
    user_id: row.userId || null,
    first_name: row.firstName || null,
    last_name: row.lastName || null,
    jersey_number: row.jerseyNumber || null,
    created_at: row.createdAt,
    invited_email: row.invitedEmail || null,
    invite_status: row.inviteStatus || null,
    invite_id: row.inviteId || null,
    invite_sent_at: row.inviteSentAt || null,
    invite_claimed_at: row.inviteClaimedAt || null,
  };
}

function toResponse(row = {}) {
  const profile = sanitizePlayerProfileRow(row);
  return {
    id: profile.id,
    team_id: profile.teamId,
    user_id: profile.userId || null,
    first_name: profile.firstName,
    last_name: profile.lastName,
    jersey_number: profile.jerseyNumber,
    created_at: profile.createdAt,
    invited_email: profile.invitedEmail || null,
    invite_status: profile.inviteStatus || null,
    invite_id: profile.inviteId || null,
    invite_sent_at: profile.inviteSentAt || null,
    invite_claimed_at: profile.inviteClaimedAt || null,
  };
}

function identityCandidates(requester, resolvedUuid = "") {
  return new Set([normalizeIdentity(requester), normalizeIdentity(resolvedUuid)].filter(Boolean));
}

function belongsToRequester(row, requester, resolvedUuid = "") {
  const candidates = identityCandidates(requester, resolvedUuid);
  const userId = normalizeIdentity(row?.user_id || row?.userId);
  return Boolean(userId && candidates.has(userId));
}

async function readTeamProfiles(env, teamId) {
  const rows = await selectRows(
    env,
    "player_profiles",
    `select=id,user_id,team_id,first_name,last_name,jersey_number,created_at,invited_email,invite_status,invite_id,invite_sent_at,invite_claimed_at&team_id=eq.${encodeURIComponent(teamId)}&order=created_at.asc&limit=${MAX_PROFILES_PER_TEAM}`,
  );
  return Array.isArray(rows) ? rows : [];
}

async function responseProfiles(env, teamId, requester, resolvedUuid, canManageTeam) {
  const rows = await readTeamProfiles(env, teamId);
  return (canManageTeam ? rows : rows.filter((row) => belongsToRequester(row, requester, resolvedUuid))).map(toResponse);
}

function demoResponse(profiles = []) {
  return Response.json({ ok: true, storage_mode: "demo_local", profiles });
}

async function authenticate(request, env) {
  return readAuthenticatedIdentity({ env, request, allowDemo: true });
}

export async function onRequestGet({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `player_profiles_get:${getClientKey(request, requester)}`,
    max: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse();

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    const requestedTeamId = cleanText(new URL(request.url).searchParams.get("team_id"), 180);
    if (requestedTeamId && !readableTeamIds.has(requestedTeamId)) return Response.json({ error: "forbidden" }, { status: 403 });

    const teamIds = requestedTeamId ? [requestedTeamId] : [...readableTeamIds];
    if (!teamIds.length) return Response.json({ error: "forbidden" }, { status: 403 });

    const profiles = [];
    for (const teamId of teamIds) {
      profiles.push(...await responseProfiles(env, teamId, requester, resolvedUuid, writableTeamIds.has(teamId)));
    }
    return Response.json({ ok: true, storage_mode: "signed_api", profiles });
  } catch (error) {
    console.error("player_profiles_get_failed", { message: cleanText(error?.message, 180) });
    return Response.json({ error: "profile_load_failed" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await authenticate(request, env);
  const requester = normalizeIdentity(auth?.identity);
  if (!requester) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rate = enforceRateLimit({
    key: `player_profiles_post:${getClientKey(request, requester)}`,
    max: 30,
    windowMs: 60_000,
  });
  if (!rate.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const body = await request.json().catch(() => null);
  const teamId = cleanText(body?.team_id || body?.teamId, 180);
  const inputRows = Array.isArray(body?.profiles) ? body.profiles : [];
  if (!teamId) return Response.json({ error: "team_id_required" }, { status: 400 });
  if (inputRows.length > MAX_PROFILES_PER_TEAM) return Response.json({ error: "too_many_profiles" }, { status: 400 });

  const rows = inputRows.map((row) => sanitizePlayerProfileRow(row, teamId));
  for (let index = 0; index < rows.length; index += 1) {
    const rawTeamId = cleanText(inputRows[index]?.team_id || inputRows[index]?.teamId, 180);
    if (!rows[index].id) return Response.json({ error: "profile_id_required" }, { status: 400 });
    if ((rawTeamId && rawTeamId !== teamId) || rows[index].teamId !== teamId) return Response.json({ error: "team_mismatch" }, { status: 400 });
  }
  if (new Set(rows.map((row) => row.id)).size !== rows.length) return Response.json({ error: "duplicate_profile_id" }, { status: 400 });
  if (DEMO_IDENTITIES.has(requester)) return demoResponse(rows.map(toDatabase));

  try {
    const { readableTeamIds, writableTeamIds, resolvedUuid } = await collectTeamPriorityAccess(env, requester);
    if (!readableTeamIds.has(teamId)) return Response.json({ error: "forbidden" }, { status: 403 });
    const canManageTeam = writableTeamIds.has(teamId);
    const candidates = canManageTeam
      ? rows
      : rows.filter((row) => identityCandidates(requester, resolvedUuid).has(row.userId));

    const upserts = [];
    for (const row of candidates) {
      const collisions = await selectRows(
        env,
        "player_profiles",
        `select=id,user_id,team_id,created_at,invited_email&id=eq.${encodeURIComponent(row.id)}&limit=1`,
      );
      const prior = Array.isArray(collisions) ? collisions[0] : null;
      const priorTeamId = cleanText(prior?.team_id, 180);
      const priorUserId = normalizeIdentity(prior?.user_id);

      if (prior && priorTeamId !== teamId) return Response.json({ error: "profile_id_conflict" }, { status: 409 });

      if (canManageTeam) {
        if (priorUserId && row.userId && priorUserId !== row.userId) return Response.json({ error: "profile_identity_conflict" }, { status: 409 });
        if (!priorUserId && row.userId && prior) return Response.json({ error: "coach_cannot_claim_profile" }, { status: 403 });
        row.userId = priorUserId || row.userId;
      } else {
        if (priorUserId && !identityCandidates(requester, resolvedUuid).has(priorUserId)) {
          return Response.json({ error: "profile_identity_conflict" }, { status: 409 });
        }
        if (!priorUserId && prior && normalizeIdentity(prior?.invited_email) !== requester) {
          return Response.json({ error: "profile_claim_forbidden" }, { status: 403 });
        }
        row.userId = requester;
      }

      if (row.createdAt == null) row.createdAt = finiteNumber(prior?.created_at) || Date.now();
      upserts.push(toDatabase(row));
    }

    if (upserts.length) await upsertRows(env, "player_profiles", upserts, "id");
    return Response.json({
      ok: true,
      storage_mode: "signed_api",
      profiles: await responseProfiles(env, teamId, requester, resolvedUuid, canManageTeam),
      ignored_count: rows.length - candidates.length,
    });
  } catch (error) {
    console.error("player_profiles_post_failed", { teamId, message: cleanText(error?.message, 180) });
    return Response.json({ error: "profile_sync_failed" }, { status: 500 });
  }
}
