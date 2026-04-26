import { callRpc, readUserId, selectRows, upsertRows, updateRows } from "../../_utils/supabase.js";
import { logEvent } from "../../_utils/invite.js";
import { confirmInviteContext } from "../../_utils/inviteFlowCore.js";
import { getClientKey, requireApiToken } from "../../_utils/security.js";
import { classifyValidationError, recordTeamJoinEvent, TEAM_JOIN_EVENTS } from "../../_utils/teamJoinTelemetry.js";

const consumeInFlight = new Map();

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireApiToken(request, env);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const userId = readUserId(request);
  const body = await request.json().catch(() => ({}));
  const joinContextToken = String(body?.join_context_token || "").trim();
  const subjectKey = String(body?.subject_key || "").trim().toLowerCase();
  const attemptedTeamId = String(body?.team_id_hint || "").trim();
  const attemptedRole = String(body?.role_hint || "player").trim().toLowerCase() || "player";
  const clientRequestId = body?.client_request_id ? String(body.client_request_id) : null;
  const consumeKey = getClientKey(request, `${userId}:${subjectKey}`);
  const existing = consumeInFlight.get(consumeKey);
  if (existing) {
    const replay = await existing;
    return Response.json({ ...replay.body, replayed: true }, { status: replay.status });
  }

  const consumePromise = (async () => {
  logEvent("membership_insert_start", { userId, subjectKey, hasToken: Boolean(joinContextToken), mode: "confirm_context" });

  const result = await confirmInviteContext({
    callRpc: (fn, params) => callRpc(env, fn, params),
    userId,
    subjectKey,
    joinContextToken,
    clientRequestId,
    attemptedTeamId,
    attemptedRole,
  });

  if (
    !result.ok &&
    (result.error === "consume_membership_insert_failed" || result.error === "membership_insert_failed") &&
    String(result?.diagnostic?.attempted_resolved_user_uuid || "")
  ) {
    try {
      const resolvedUserUuid = String(result.diagnostic.attempted_resolved_user_uuid);
      const tokenHashRows = await callRpc(env, "hash_invite_code", { normalized_code: joinContextToken });
      const tokenHash = typeof tokenHashRows === "string"
        ? tokenHashRows
        : Array.isArray(tokenHashRows)
          ? String(tokenHashRows[0]?.hash_invite_code || tokenHashRows[0]?.token_hash || tokenHashRows[0] || "")
          : String(tokenHashRows?.hash_invite_code || tokenHashRows?.token_hash || "");
      const sessions = await selectRows(
        env,
        "invite_join_sessions",
        `select=team_id,subject_key,expires_at,consumed_at&token_hash=eq.${encodeURIComponent(tokenHash)}&subject_key=eq.${encodeURIComponent(subjectKey)}&limit=1`,
      );
      const activeSession = Array.isArray(sessions) ? sessions[0] : null;
      const validatedTeamId = String(activeSession?.team_id || "");
      if (!validatedTeamId || activeSession?.consumed_at || (activeSession?.expires_at && Date.parse(activeSession.expires_at) <= Date.now())) {
        throw new Error("validated_invite_context_not_found_for_fallback");
      }
      const existing = await selectRows(
        env,
        "team_memberships",
        `select=id,team_id,user_id,role,status&team_id=eq.${encodeURIComponent(validatedTeamId)}&user_id=eq.${encodeURIComponent(resolvedUserUuid)}&limit=1`,
      );
      if (Array.isArray(existing) && existing[0]?.id) {
        await updateRows(
          env,
          "team_memberships",
          `id=eq.${encodeURIComponent(existing[0].id)}`,
          { status: "active", role: attemptedRole || "player" },
        ).catch(() => null);
        return {
          status: 200,
          body: {
            membership_id: existing[0].id,
            team_id: validatedTeamId,
            invite_id: "",
            status: "duplicate_membership",
            resolved_user_uuid: resolvedUserUuid,
            fallback: "membership_exists",
          },
        };
      }
      const inserted = await upsertRows(
        env,
        "team_memberships",
        { team_id: validatedTeamId, user_id: resolvedUserUuid, role: attemptedRole || "player", status: "active" },
        "team_id,user_id",
      );
      const membershipId = Array.isArray(inserted) ? String(inserted[0]?.id || "") : "";
      if (membershipId) {
        return {
          status: 201,
          body: {
            membership_id: membershipId,
            team_id: validatedTeamId,
            invite_id: "",
            status: "joined",
            resolved_user_uuid: resolvedUserUuid,
            fallback: "direct_upsert",
          },
        };
      }
    } catch (fallbackError) {
      result.diagnostic = {
        ...(result.diagnostic || {}),
        fallback_error: String(fallbackError?.message || "fallback_membership_upsert_failed"),
      };
    }
  }

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
    return {
      status: result.status,
      body: {
      error: result.error,
      diagnostic_code: result.error,
      diagnostic_message: result?.diagnostic?.db_message || null,
      sqlstate: result?.diagnostic?.sqlstate || "",
      db_message: result?.diagnostic?.db_message || "",
      db_detail: result?.diagnostic?.db_detail || "",
      db_hint: result?.diagnostic?.db_hint || "",
      table: result?.diagnostic?.table || "",
      constraint: result?.diagnostic?.constraint || "",
      team_id_type: result?.diagnostic?.team_id_type || "",
      user_id_value_type: result?.diagnostic?.user_id_value_type || "",
      attempted_team_id: result?.diagnostic?.attempted_team_id || attemptedTeamId || "",
      attempted_resolved_user_uuid: result?.diagnostic?.attempted_resolved_user_uuid || "",
      attempted_role: result?.diagnostic?.attempted_role || attemptedRole || "player",
      resolved_uuid: result?.diagnostic?.resolved_uuid || "",
      fallback_error: result?.diagnostic?.fallback_error || "",
      },
    };
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
  return { status: result.status, body: result.data };
  })();
  consumeInFlight.set(consumeKey, consumePromise);
  try {
    const response = await consumePromise;
    return Response.json(response.body, { status: response.status });
  } finally {
    consumeInFlight.delete(consumeKey);
  }
}
