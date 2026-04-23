import { callRpc, readUserId } from "../../_utils/supabase.js";
import { logEvent } from "../../_utils/invite.js";
import { confirmInviteContext } from "../../_utils/inviteFlowCore.js";
import { enforceRateLimit, getClientKey, requireApiToken } from "../../_utils/security.js";
import { classifyValidationError, recordTeamJoinEvent, TEAM_JOIN_EVENTS } from "../../_utils/teamJoinTelemetry.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const userId = readUserId(request);
  const body = await request.json().catch(() => ({}));
  const joinContextToken = String(body?.join_context_token || "").trim();
  const subjectKey = String(body?.subject_key || "").trim().toLowerCase();
  const clientRequestId = body?.client_request_id ? String(body.client_request_id) : null;
  const rate = enforceRateLimit({ key: getClientKey(request, userId), max: 20, windowMs: 60_000 });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  logEvent("membership_insert_start", { userId, subjectKey, hasToken: Boolean(joinContextToken), mode: "confirm_context" });

  const result = await confirmInviteContext({
    callRpc: (fn, params) => callRpc(env, fn, params),
    userId,
    subjectKey,
    joinContextToken,
    clientRequestId,
  });

  if (!result.ok) {
    logEvent("membership_insert_failure", { userId, subjectKey, error: result.error, mode: "confirm_context" });
    const eventName = result.error === "env_config_mismatch"
      ? TEAM_JOIN_EVENTS.ENV_CONFIG_MISMATCH
      : result.error === "duplicate_membership"
        ? TEAM_JOIN_EVENTS.MEMBERSHIP_EXISTS
        : classifyValidationError(result.error);
    recordTeamJoinEvent(eventName, {
      route: "team-memberships/confirm-context",
      userIdPresent: Boolean(userId),
      subjectDomain: subjectKey.includes("@") ? subjectKey.split("@")[1] : null,
      errorCode: result.error,
      requestId: request.headers.get("cf-ray") || null,
    });
    return Response.json({ error: result.error }, { status: result.status });
  }

  logEvent("membership_insert_success", {
    userId,
    subjectKey,
    teamId: result.data.team_id,
    membershipId: result.data.membership_id,
    status: result.data.status,
    mode: "confirm_context",
  });
  recordTeamJoinEvent(
    result.data.status === "duplicate_membership" ? TEAM_JOIN_EVENTS.MEMBERSHIP_EXISTS : TEAM_JOIN_EVENTS.MEMBERSHIP_CREATED,
    {
      route: "team-memberships/confirm-context",
      teamId: result.data.team_id,
      membershipId: result.data.membership_id,
      requestId: request.headers.get("cf-ray") || null,
    },
  );
  return Response.json(result.data, { status: result.status });
}
