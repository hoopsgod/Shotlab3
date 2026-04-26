import { normalizeInviteCode } from "./invite.js";

function mapResolveError(error) {
  const message = String(error?.message || "").toUpperCase();
  if (message.includes("SUPABASE_URL_MISSING") || message.includes("SUPABASE_SERVICE_ROLE_KEY_MISSING")) return { status: 500, code: "env_config_mismatch" };
  if (message.includes("INVALID_CODE")) return { status: 400, code: "invalid_code" };
  if (message.includes("EXPIRED_CODE")) return { status: 400, code: "expired_code" };
  if (message.includes("REVOKED_CODE")) return { status: 400, code: "revoked_code" };
  if (message.includes("INVITE_MAX_USES_REACHED")) return { status: 409, code: "invite_max_uses_reached" };
  if (message.includes("SUBJECT_KEY_REQUIRED")) return { status: 400, code: "subject_required" };
  if (message.includes("USER_ID_REQUIRED")) return { status: 401, code: "unauthorized" };
  return { status: 500, code: "internal_error" };
}

function mapConfirmError(error) {
  const message = String(error?.message || "").toUpperCase();
  if (message.includes("SUPABASE_URL_MISSING") || message.includes("SUPABASE_SERVICE_ROLE_KEY_MISSING")) return { status: 500, code: "env_config_mismatch" };
  if (message.includes("JOIN_CONTEXT_TOKEN_REQUIRED")) return { status: 400, code: "consume_context_token_missing" };
  if (message.includes("INVALID_OR_EXPIRED_JOIN_CONTEXT")) return { status: 400, code: "invalid_join_context" };
  if (message.includes("JOIN_CONTEXT_EXPIRED")) return { status: 400, code: "join_context_expired" };
  if (message.includes("JOIN_CONTEXT_ALREADY_USED")) return { status: 409, code: "join_context_used" };
  if (message.includes("SUBJECT_KEY_REQUIRED")) return { status: 400, code: "consume_subject_mismatch" };
  if (message.includes("INVALID INPUT SYNTAX FOR TYPE UUID") && message.includes("USER")) return { status: 400, code: "consume_user_id_type_mismatch" };
  if (message.includes("INVALID INPUT SYNTAX FOR TYPE UUID") && message.includes("TEAM")) return { status: 400, code: "consume_team_id_type_mismatch" };
  if (message.includes("INCOMPATIBLE TYPES") || message.includes("CANNOT BE IMPLEMENTED")) return { status: 500, code: "consume_team_id_type_mismatch" };
  if (message.includes("MEMBERSHIP")) return { status: 500, code: "consume_membership_insert_failed" };
  if (message.includes("INVALID_CODE")) return { status: 400, code: "invalid_code" };
  if (message.includes("EXPIRED_CODE")) return { status: 400, code: "expired_code" };
  if (message.includes("REVOKED_CODE")) return { status: 400, code: "revoked_code" };
  if (message.includes("INVITE_MAX_USES_REACHED")) return { status: 409, code: "invite_max_uses_reached" };
  if (message.includes("USER_ID_REQUIRED")) return { status: 401, code: "unauthorized" };
  if (message.includes("SUBJECT_KEY_REQUIRED")) return { status: 400, code: "subject_required" };
  return { status: 500, code: "internal_error" };
}

export async function startInviteContext({ callRpc, subjectKey, inviteCode }) {
  const normalizedSubject = String(subjectKey || "").trim().toLowerCase();
  const normalizedCode = normalizeInviteCode(inviteCode || "");

  if (!normalizedSubject) return { ok: false, status: 400, error: "subject_required" };
  if (!normalizedCode) return { ok: false, status: 400, error: "invalid_format" };

  try {
    const lookupRows = await callRpc("lookup_team_invite_by_code", {
      p_invite_code: normalizedCode,
    });
    const lookup = Array.isArray(lookupRows) ? lookupRows[0] : null;
    const lookupCount = Number(lookup?.lookup_count || 0);
    const debug = {
      normalizedCode: String(lookup?.normalized_code || normalizedCode),
      lookupHashPrefix: String(lookup?.lookup_hash_prefix || ""),
      hashSource: "public.hash_invite_code(public.normalize_invite_code(code))",
      lookupCount,
      matchedTeamId: String(lookup?.team_id || ""),
      inviteState: String(lookup?.invite_state || ""),
      expiresAt: lookup?.expires_at || null,
    };

    if (lookupCount <= 0) {
      return { ok: false, status: 400, error: "invalid_code", debug };
    }

    const rows = await callRpc("resolve_team_invite_context", {
      p_subject_key: normalizedSubject,
      p_invite_code: debug.normalizedCode,
    });

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return { ok: false, status: 400, error: "invalid_code", debug };

    return {
      ok: true,
      status: 200,
      data: {
        join_context_token: row.join_context_token,
        expires_at: row.expires_at,
        invite_id: row.invite_id,
        team_id: row.team_id,
        normalized_code: debug.normalizedCode,
        lookup_hash_prefix: debug.lookupHashPrefix,
        hash_source: debug.hashSource,
        lookup_count: debug.lookupCount,
        matched_team_id: debug.matchedTeamId || String(row.team_id || ""),
        invite_state: debug.inviteState,
        invite_expires_at: debug.expiresAt,
      },
    };
  } catch (error) {
    const mapped = mapResolveError(error);
    return {
      ok: false,
      status: mapped.status,
      error: mapped.code,
      debug: {
        normalizedCode,
        lookupHashPrefix: "",
        hashSource: "public.hash_invite_code(public.normalize_invite_code(code))",
        lookupCount: 0,
        matchedTeamId: "",
        inviteState: "",
        expiresAt: null,
      },
    };
  }
}

export async function confirmInviteContext({ callRpc, userId, subjectKey, joinContextToken, clientRequestId = null }) {
  const normalizedUserId = String(userId || "").trim();
  const normalizedSubject = String(subjectKey || "").trim().toLowerCase();
  const normalizedToken = String(joinContextToken || "").trim();

  if (!normalizedUserId) return { ok: false, status: 401, error: "unauthorized" };
  if (!normalizedSubject) return { ok: false, status: 400, error: "subject_required" };
  if (!normalizedToken) return { ok: false, status: 400, error: "join_context_token_required" };

  let resolvedUserUuid = "";
  try {
    const resolveRows = await callRpc("resolve_app_user_uuid", {
      p_identifier: normalizedUserId,
    });
    if (typeof resolveRows === "string") {
      resolvedUserUuid = String(resolveRows || "").trim();
    } else if (Array.isArray(resolveRows)) {
      const first = resolveRows[0];
      resolvedUserUuid = String(first?.resolve_app_user_uuid || first?.resolved_user_uuid || first?.user_id || first || "").trim();
    } else if (resolveRows && typeof resolveRows === "object") {
      resolvedUserUuid = String(resolveRows.resolve_app_user_uuid || resolveRows.resolved_user_uuid || resolveRows.user_id || "").trim();
    } else {
      resolvedUserUuid = String(resolveRows || "").trim();
    }
    if (!resolvedUserUuid) {
      return {
        ok: false,
        status: 400,
        error: "consume_user_id_type_mismatch",
        diagnostic: {
          sqlstate: "",
          db_message: "resolve_app_user_uuid returned empty value",
          team_id_type: "",
          user_id_value_type: typeof normalizedUserId,
          resolved_uuid: "",
        },
      };
    }

    const rows = await callRpc("confirm_team_invite_join_from_context", {
      p_user_id: resolvedUserUuid,
      p_subject_key: normalizedSubject,
      p_join_context_token: normalizedToken,
      p_client_request_id: clientRequestId,
    });

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return { ok: false, status: 500, error: "internal_error" };

    return {
      ok: true,
      status: row.join_status === "duplicate_membership" ? 200 : 201,
      data: {
        membership_id: row.membership_id,
        team_id: row.team_id,
        invite_id: row.invite_id,
        status: row.join_status,
        resolved_user_uuid: resolvedUserUuid,
      },
    };
  } catch (error) {
    const mapped = mapConfirmError(error);
    const resolvedCode = mapped.code === "internal_error" ? "membership_insert_failed" : mapped.code;
    const details = error?.details || {};
    return {
      ok: false,
      status: mapped.status,
      error: resolvedCode,
      diagnostic: {
        sqlstate: String(details?.code || "").toUpperCase(),
        db_message: String(details?.message || error?.message || ""),
        team_id_type: String(details?.hint || details?.details || ""),
        user_id_value_type: typeof normalizedUserId,
        resolved_uuid: resolvedUserUuid || "",
      },
    };
  }
}

export async function bootstrapCoachSignup({ callRpc, coachUserId, teamName, inviteTtlHours = 720, maxUses = null }) {
  const userId = String(coachUserId || "").trim();
  if (!userId) return { ok: false, status: 401, error: "unauthorized" };

  try {
    const rows = await callRpc("coach_signup_create_team_and_invite", {
      p_coach_user_id: userId,
      p_team_name: String(teamName || "").trim(),
      p_invite_ttl_hours: inviteTtlHours,
      p_max_uses: Number.isFinite(maxUses) ? maxUses : null,
    });

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return { ok: false, status: 500, error: "internal_error" };

    return {
      ok: true,
      status: 201,
      data: {
        team_id: row.team_id,
        invite_id: row.invite_id,
        invite_code: row.invite_code,
        invite_expires_at: row.invite_expires_at,
      },
    };
  } catch (error) {
    const rawMessage = String(error?.message || "");
    const message = rawMessage.toUpperCase();
    if (message.includes("SUPABASE_URL_MISSING") || message.includes("SUPABASE_SERVICE_ROLE_KEY_MISSING")) {
      return { ok: false, status: 500, error: "env_config_mismatch" };
    }
    if (message.includes("COACH_USER_NOT_FOUND")) {
      return { ok: false, status: 404, error: "coach_user_not_found", diagnostic_message: "Coach user could not be resolved to a backend UUID." };
    }
    const status = Number(error?.status) || 500;
    const pgCode = String(error?.details?.code || "").toUpperCase();

    if (
      status === 404 ||
      pgCode === "PGRST202" ||
      message.includes("COULD NOT FIND THE FUNCTION") ||
      (message.includes("FUNCTION") && message.includes("DOES NOT EXIST"))
    ) {
      const fnMatch = rawMessage.match(/function\s+([a-zA-Z0-9_.]+)/i);
      const missingFn = fnMatch?.[1] ? String(fnMatch[1]).replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase() : "";
      if (missingFn) {
        return {
          ok: false,
          status: 500,
          error: `missing_function_${missingFn}`,
          diagnostic_message: `Required function ${missingFn} is not available in Supabase.`,
        };
      }
      return { ok: false, status: 500, error: "missing_rpc", diagnostic_message: "coach_signup_create_team_and_invite is not available in Supabase." };
    }

    if (
      pgCode === "42883" ||
      pgCode === "22P02" ||
      message.includes("NO FUNCTION MATCHES THE GIVEN NAME AND ARGUMENT TYPES") ||
      message.includes("WITH THE GIVEN NAME AND ARGUMENT TYPES") ||
      message.includes("INVALID INPUT SYNTAX FOR TYPE UUID")
    ) {
      return { ok: false, status: 500, error: "rpc_argument_mismatch", diagnostic_message: "RPC arguments do not match expected types (coach id must match backend type)." };
    }

    if (
      pgCode === "42804" &&
      (message.includes("INCOMPATIBLE TYPES") || message.includes("CANNOT BE IMPLEMENTED"))
    ) {
      return {
        ok: false,
        status: 500,
        error: "schema_type_mismatch_teams_id",
        diagnostic_message: "Schema mismatch: team-related id column types are incompatible with public.teams.id.",
      };
    }

    if (
      status === 401 ||
      status === 403 ||
      pgCode === "42501" ||
      message.includes("PERMISSION DENIED") ||
      message.includes("NOT AUTHORIZED")
    ) {
      const invalidKey = message.includes("INVALID API KEY") || message.includes("JWT") || message.includes("ANON KEY");
      if (invalidKey) {
        return { ok: false, status: 500, error: "invalid_service_key", diagnostic_message: "Supabase service role key is invalid for RPC access." };
      }
      return { ok: false, status: 500, error: "rpc_permission_denied", diagnostic_message: "Supabase denied permission to execute coach signup RPC." };
    }

    if (
      pgCode === "42P01" ||
      message.includes("RELATION") && message.includes("DOES NOT EXIST")
    ) {
      const relationMatch = rawMessage.match(/relation\s+"?([a-zA-Z0-9_.]+)"?\s+does not exist/i);
      const missingRelation = relationMatch?.[1] ? String(relationMatch[1]).replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase() : "";
      if (missingRelation) {
        return {
          ok: false,
          status: 500,
          error: `table_missing_${missingRelation}`,
          diagnostic_message: `Required table ${missingRelation} is missing.`,
        };
      }
      return { ok: false, status: 500, error: "table_missing", diagnostic_message: "One or more required team invite tables are missing." };
    }

    return { ok: false, status: 500, error: "unknown_rpc_failure", diagnostic_message: "Supabase RPC failed for an unknown reason." };
  }
}
