import { callRpc } from "../../../_utils/supabase.js";
import { logEvent, normalizeInviteCode } from "../../../_utils/invite.js";
import { startInviteContext } from "../../../_utils/inviteFlowCore.js";
import { enforceRateLimit, getClientKey, publicValidationError, requireApiToken } from "../../../_utils/security.js";
import { classifyValidationError, recordTeamJoinEvent, TEAM_JOIN_EVENTS } from "../../../_utils/teamJoinTelemetry.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => ({}));
  const subjectKey = String(body?.subject_key || "").trim().toLowerCase();
  const normalizedCode = normalizeInviteCode(body?.code || body?.invite_code || "");
  const rate = enforceRateLimit({ key: getClientKey(request, subjectKey), max: 12, windowMs: 60_000 });
  if (!rate.allowed) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  }

  logEvent("invite_validation_start", { subjectKey, normalizedCodeLength: normalizedCode.length, mode: "context_start" });
  recordTeamJoinEvent(TEAM_JOIN_EVENTS.PLAYER_JOIN_ATTEMPT, {
    route: "team-invites/context/start",
    subjectDomain: subjectKey.includes("@") ? subjectKey.split("@")[1] : null,
    normalizedCodeLength: normalizedCode.length,
    requestId: request.headers.get("cf-ray") || null,
  });

  const result = await startInviteContext({
    callRpc: (fn, params) => callRpc(env, fn, params),
    subjectKey,
    inviteCode: normalizedCode,
  });

  if (!result.ok) {
    logEvent("invite_not_found", { subjectKey, error: result.error, mode: "context_start" });
    recordTeamJoinEvent(classifyValidationError(result.error), {
      route: "team-invites/context/start",
      errorCode: result.error,
      requestId: request.headers.get("cf-ray") || null,
    });
    const generic = publicValidationError();
    return Response.json(
      {
        error: generic.error,
        normalized_code: result?.debug?.normalizedCode || normalizedCode,
        lookup_hash_prefix: result?.debug?.lookupHashPrefix || "",
        hash_source: result?.debug?.hashSource || "public.hash_invite_code(public.normalize_invite_code(code))",
        lookup_count: Number(result?.debug?.lookupCount || 0),
        matched_team_id: result?.debug?.matchedTeamId || "",
        invite_state: result?.debug?.inviteState || "",
        expires_at: result?.debug?.expiresAt || null,
      },
      { status: generic.status },
    );
  }

  logEvent("invite_found", { subjectKey, inviteId: result.data.invite_id, teamId: result.data.team_id, mode: "context_start" });
  recordTeamJoinEvent("team_join.player.code_validated", {
    route: "team-invites/context/start",
    inviteId: result.data.invite_id,
    teamId: result.data.team_id,
    requestId: request.headers.get("cf-ray") || null,
  });
  return Response.json(result.data, { status: result.status });
}
