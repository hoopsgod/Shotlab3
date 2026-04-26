import { callRpc, readUserId } from "../../_utils/supabase.js";
import { logEvent } from "../../_utils/invite.js";
import { bootstrapCoachSignup } from "../../_utils/inviteFlowCore.js";
import { recordTeamJoinEvent, TEAM_JOIN_EVENTS } from "../../_utils/teamJoinTelemetry.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const userId = readUserId(request);
  const body = await request.json().catch(() => ({}));
  const teamName = String(body?.team_name || "").trim();
  const inviteTtlHours = Number.isFinite(body?.invite_ttl_hours) ? Number(body.invite_ttl_hours) : 720;
  const maxUses = body?.max_uses === null || body?.max_uses === undefined ? null : Number(body.max_uses);

  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  logEvent("coach_signup_team_invite_start", { userId });

  const result = await bootstrapCoachSignup({
    callRpc: (fn, params) => callRpc(env, fn, params),
    coachUserId: userId,
    teamName,
    inviteTtlHours,
    maxUses: Number.isFinite(maxUses) ? maxUses : null,
  });

  if (!result.ok) {
    logEvent("coach_signup_team_invite_failure", { userId, error: result.error });
    recordTeamJoinEvent(
      result.error === "env_config_mismatch" ? TEAM_JOIN_EVENTS.ENV_CONFIG_MISMATCH : TEAM_JOIN_EVENTS.MEMBERSHIP_INSERT_FAILED,
      { route: "coach-signup/bootstrap", userIdPresent: Boolean(userId), errorCode: result.error, requestId: request.headers.get("cf-ray") || null },
    );
    return Response.json(
      {
        error: result.error,
        diagnostic_code: result.error,
        diagnostic_message: result.diagnostic_message || null,
      },
      { status: result.status },
    );
  }

  recordTeamJoinEvent(TEAM_JOIN_EVENTS.COACH_INVITE_CREATED, {
    route: "coach-signup/bootstrap",
    coachUserIdPresent: Boolean(userId),
    teamId: result.data.team_id,
    inviteId: result.data.invite_id,
    requestId: request.headers.get("cf-ray") || null,
  });
  return Response.json(result.data, { status: result.status });
}
