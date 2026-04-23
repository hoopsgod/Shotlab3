import { callRpc, readUserId } from "../../_utils/supabase.js";
import { logEvent } from "../../_utils/invite.js";
import { enforceRateLimit, getClientKey, requireApiToken } from "../../_utils/security.js";
import { classifyValidationError, recordTeamJoinEvent, TEAM_JOIN_EVENTS } from "../../_utils/teamJoinTelemetry.js";

function mapConfirmError(error) {
  const message = String(error?.message || "").toUpperCase();
  if (message.includes("INVALID_OR_EXPIRED_JOIN_SESSION")) return { status: 400, code: "invalid_join_session" };
  if (message.includes("JOIN_SESSION_EXPIRED")) return { status: 400, code: "join_session_expired" };
  if (message.includes("JOIN_SESSION_ALREADY_USED")) return { status: 409, code: "join_session_used" };
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
  const joinSessionToken = String(body?.join_session_token || "").trim();
  const clientRequestId = body?.client_request_id ? String(body.client_request_id) : null;
  const rate = enforceRateLimit({ key: getClientKey(request, userId), max: 20, windowMs: 60_000 });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  logEvent("membership_insert_start", { userId, hasToken: Boolean(joinSessionToken) });
  recordTeamJoinEvent(TEAM_JOIN_EVENTS.PLAYER_JOIN_ATTEMPT, {
    route: "team-memberships/confirm",
    userIdPresent: Boolean(userId),
    hasJoinSessionToken: Boolean(joinSessionToken),
    requestId: request.headers.get("cf-ray") || null,
  });

  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!joinSessionToken) {
    return Response.json({ error: "join_session_token_required" }, { status: 400 });
  }

  try {
    const rows = await callRpc(env, "confirm_team_invite_join", {
      p_user_id: userId,
      p_join_session_token: joinSessionToken,
      p_client_request_id: clientRequestId,
    });

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      logEvent("membership_insert_failure", { userId, error: "no_result" });
      return Response.json({ error: "internal_error" }, { status: 500 });
    }

    logEvent("membership_insert_success", {
      userId,
      teamId: row.team_id,
      membershipId: row.membership_id,
      status: row.join_status,
    });

    return Response.json(
      {
        membership_id: row.membership_id,
        team_id: row.team_id,
        invite_id: row.invite_id,
        status: row.join_status,
      },
      { status: row.join_status === "duplicate_membership" ? 200 : 201 },
    );
  } catch (error) {
    const mapped = mapConfirmError(error);
    logEvent("membership_insert_failure", { userId, error: mapped.code });
    recordTeamJoinEvent(
      mapped.code === "env_config_mismatch" ? TEAM_JOIN_EVENTS.ENV_CONFIG_MISMATCH : classifyValidationError(mapped.code),
      {
        route: "team-memberships/confirm",
        errorCode: mapped.code,
        requestId: request.headers.get("cf-ray") || null,
      },
    );
    return Response.json({ error: mapped.code }, { status: mapped.status });
  }
}
