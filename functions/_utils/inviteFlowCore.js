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
  if (message.includes("INVALID_OR_EXPIRED_JOIN_CONTEXT")) return { status: 400, code: "invalid_join_context" };
  if (message.includes("JOIN_CONTEXT_EXPIRED")) return { status: 400, code: "join_context_expired" };
  if (message.includes("JOIN_CONTEXT_ALREADY_USED")) return { status: 409, code: "join_context_used" };
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
    const rows = await callRpc("resolve_team_invite_context", {
      p_subject_key: normalizedSubject,
      p_invite_code: normalizedCode,
    });

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return { ok: false, status: 400, error: "invalid_code" };

    return {
      ok: true,
      status: 200,
      data: {
        join_context_token: row.join_context_token,
        expires_at: row.expires_at,
        invite_id: row.invite_id,
        team_id: row.team_id,
      },
    };
  } catch (error) {
    const mapped = mapResolveError(error);
    return { ok: false, status: mapped.status, error: mapped.code };
  }
}

export async function confirmInviteContext({ callRpc, userId, subjectKey, joinContextToken, clientRequestId = null }) {
  const normalizedUserId = String(userId || "").trim();
  const normalizedSubject = String(subjectKey || "").trim().toLowerCase();
  const normalizedToken = String(joinContextToken || "").trim();

  if (!normalizedUserId) return { ok: false, status: 401, error: "unauthorized" };
  if (!normalizedSubject) return { ok: false, status: 400, error: "subject_required" };
  if (!normalizedToken) return { ok: false, status: 400, error: "join_context_token_required" };

  try {
    const rows = await callRpc("confirm_team_invite_join_from_context", {
      p_user_id: normalizedUserId,
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
      },
    };
  } catch (error) {
    const mapped = mapConfirmError(error);
    return { ok: false, status: mapped.status, error: mapped.code };
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
    const message = String(error?.message || "").toUpperCase();
    if (message.includes("SUPABASE_URL_MISSING") || message.includes("SUPABASE_SERVICE_ROLE_KEY_MISSING")) {
      return { ok: false, status: 500, error: "env_config_mismatch" };
    }
    return { ok: false, status: 500, error: "team_invite_creation_failed" };
  }
}
