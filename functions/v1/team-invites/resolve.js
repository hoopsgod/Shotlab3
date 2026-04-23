import { callRpc, readUserId } from "../../_utils/supabase.js";
import { logEvent, normalizeInviteCode } from "../../_utils/invite.js";
import { enforceRateLimit, getClientKey, publicValidationError, requireApiToken } from "../../_utils/security.js";
import { classifyValidationError, recordTeamJoinEvent, TEAM_JOIN_EVENTS } from "../../_utils/teamJoinTelemetry.js";

function mapResolveError(error) {
  const message = String(error?.message || "").toUpperCase();
  if (message.includes("INVALID_CODE")) return { status: 400, code: "invalid_code" };
  if (message.includes("EXPIRED_CODE")) return { status: 400, code: "expired_code" };
  if (message.includes("REVOKED_CODE")) return { status: 400, code: "revoked_code" };
  if (message.includes("INVITE_MAX_USES_REACHED")) return { status: 409, code: "invite_max_uses_reached" };
  if (message.includes("USER_ID_REQUIRED")) return { status: 401, code: "unauthorized" };
  return { status: 500, code: "internal_error" };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const userId = readUserId(request);
  const body = await request.json().catch(() => ({}));
  const normalizedCode = normalizeInviteCode(body?.code || body?.invite_code || "");
  const rate = enforceRateLimit({ key: getClientKey(request, userId), max: 15, windowMs: 60_000 });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  logEvent("invite_validation_start", { userId, normalizedCodeLength: normalizedCode.length });
  recordTeamJoinEvent(TEAM_JOIN_EVENTS.PLAYER_JOIN_ATTEMPT, {
    route: "team-invites/resolve",
    userIdPresent: Boolean(userId),
    normalizedCodeLength: normalizedCode.length,
    requestId: request.headers.get("cf-ray") || null,
  });

  if (!userId) {
    recordTeamJoinEvent(TEAM_JOIN_EVENTS.MEMBERSHIP_INSERT_FAILED, {
      route: "team-invites/resolve",
      errorCode: "unauthorized",
      requestId: request.headers.get("cf-ray") || null,
    });
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!normalizedCode) {
    recordTeamJoinEvent(TEAM_JOIN_EVENTS.CODE_INVALID_FORMAT, {
      route: "team-invites/resolve",
      requestId: request.headers.get("cf-ray") || null,
    });
    return Response.json({ error: "invalid_or_unavailable_code" }, { status: 400 });
  }

  try {
    const rows = await callRpc(env, "resolve_team_invite", {
      p_user_id: userId,
      p_invite_code: normalizedCode,
    });

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      logEvent("invite_not_found", { userId });
      return Response.json({ error: "invalid_code" }, { status: 400 });
    }

    logEvent("invite_found", { userId, inviteId: row.invite_id, teamId: row.team_id });

    return Response.json(
      {
        join_session_token: row.join_session_token,
        expires_at: row.expires_at,
        invite_id: row.invite_id,
      },
      { status: 200 },
    );
  } catch (error) {
    const mapped = mapResolveError(error);
    logEvent("invite_not_found", { userId, error: mapped.code });
    recordTeamJoinEvent(classifyValidationError(mapped.code), {
      route: "team-invites/resolve",
      errorCode: mapped.code,
      requestId: request.headers.get("cf-ray") || null,
    });
    const generic = publicValidationError();
    return Response.json({ error: generic.error }, { status: generic.status });
  }
}
