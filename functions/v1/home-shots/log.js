import { callRpc, readUserId, selectRows, upsertRows } from "../../_utils/supabase.js";

const HOME_SHOT_MAX_MADE = 10000;

function parsePositiveInteger(value) {
  const raw = String(value ?? "").trim();
  if (!/^[0-9]+$/.test(raw)) return null;
  const numericValue = Number(raw);
  if (!Number.isInteger(numericValue) || !Number.isSafeInteger(numericValue) || numericValue <= 0 || numericValue > HOME_SHOT_MAX_MADE) return null;
  return numericValue;
}

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePayload(body = {}) {
  const teamId = String(body.team_id ?? body.teamId ?? "").trim();
  const playerId = normalizeIdentity(body.player_id ?? body.playerId ?? body.email);
  const email = normalizeIdentity(body.email ?? body.player_id ?? body.playerId);
  const made = parsePositiveInteger(body.made);
  const date = String(body.date || "").trim();
  return { teamId, playerId, email, made, date };
}

function safeErrorMessage(error) {
  const message = String(error?.message || "unknown_error").trim();
  return message.slice(0, 120) || "unknown_error";
}

function diagnosticError(error, status, stage, message, diagnostic, extra = {}) {
  return Response.json(
    {
      ok: false,
      error,
      diagnostic: { stage, message, status, ...diagnostic, ...extra },
    },
    { status },
  );
}

export async function onRequestPost({ request, env }) {
  const requester = normalizeIdentity(readUserId(request));
  const diagnostic = {
    requester_present: requester ? "yes" : "no",
    submitted_team_id_present: "no",
    submitted_player_identity_matches_requester: "no",
    resolved_app_user_uuid_success: "no",
    resolved_uuid_present: "no",
    email_membership_query_attempted: "no",
    email_membership_query_result: "not_attempted",
    uuid_membership_query_attempted: "no",
    uuid_membership_query_result: "not_attempted",
    authorized_by: "none",
    shot_logs_insert_attempted: "no",
    shot_logs_insert_success: "no",
    shot_logs_insert_error: "none",
  };

  if (!requester) {
    return diagnosticError("missing_user_identity", 401, "request_identity", "Request user identity missing.", diagnostic);
  }

  const body = await request.json().catch(() => ({}));
  const { teamId, playerId, email, made, date } = normalizePayload(body);

  diagnostic.submitted_team_id_present = teamId ? "yes" : "no";

  if (!teamId) return diagnosticError("team_id_required", 400, "request_validation", "team_id is required.", diagnostic);
  if (!playerId && !email) return diagnosticError("player_identity_required", 400, "request_validation", "Player identity is required.", diagnostic);
  const submittedIdentity = normalizeIdentity(playerId || email);
  diagnostic.submitted_player_identity_matches_requester = submittedIdentity === requester ? "yes" : "no";
  if (submittedIdentity !== requester) return diagnosticError("identity_mismatch", 403, "request_validation", "Submitted identity did not match requester.", diagnostic);
  if (made == null) return diagnosticError("invalid_made", 400, "request_validation", "made must be a positive integer.", diagnostic);
  if (!date) return diagnosticError("date_required", 400, "request_validation", "date is required.", diagnostic);

  let resolvedUserUuid = "";
  try {
    resolvedUserUuid = normalizeIdentity(await callRpc(env, "resolve_app_user_uuid", { p_identifier: requester }));
    diagnostic.resolved_app_user_uuid_success = "yes";
    diagnostic.resolved_uuid_present = resolvedUserUuid ? "yes" : "no";
  } catch (error) {
    diagnostic.resolved_app_user_uuid_success = "no";
    diagnostic.resolved_uuid_present = "no";
  }

  let membershipsByEmail = [];
  let hasEmailMembership = false;
  let hasUuidMembership = false;
  if (resolvedUserUuid) {
    diagnostic.uuid_membership_query_attempted = "yes";
    try {
      const membershipsByUuid = await selectRows(
        env,
        "team_memberships",
        `select=id,status&team_id=eq.${encodeURIComponent(teamId)}&user_id=eq.${encodeURIComponent(resolvedUserUuid)}&status=eq.active&limit=1`,
      );
      hasUuidMembership = Array.isArray(membershipsByUuid) && membershipsByUuid.length > 0;
      diagnostic.uuid_membership_query_result = String(Array.isArray(membershipsByUuid) ? membershipsByUuid.length : 0);
    } catch (error) {
      diagnostic.uuid_membership_query_result = `error:${safeErrorMessage(error)}`;
      return diagnosticError("membership_uuid_query_failed", 500, "uuid_membership_lookup", "Failed to check uuid membership.", diagnostic);
    }
  }
  if (!resolvedUserUuid) diagnostic.uuid_membership_query_result = "skipped_missing_resolved_uuid";

  if (!hasUuidMembership) {
    diagnostic.email_membership_query_attempted = "yes";
    try {
      membershipsByEmail = await selectRows(
        env,
        "team_memberships",
        `select=id,status&team_id=eq.${encodeURIComponent(teamId)}&user_id=eq.${encodeURIComponent(requester)}&status=eq.active&limit=1`,
      );
      hasEmailMembership = Array.isArray(membershipsByEmail) && membershipsByEmail.length > 0;
      diagnostic.email_membership_query_result = String(Array.isArray(membershipsByEmail) ? membershipsByEmail.length : 0);
    } catch (error) {
      const safeMessage = safeErrorMessage(error);
      if (safeMessage) {
        diagnostic.email_membership_query_result = `error_treated_as_no_match:${safeMessage}`;
      } else {
        diagnostic.email_membership_query_result = "error_treated_as_no_match";
      }
      hasEmailMembership = false;
    }
  }

  if (hasEmailMembership) diagnostic.authorized_by = "email";
  if (!hasEmailMembership && hasUuidMembership) diagnostic.authorized_by = "uuid";

  if (!hasEmailMembership && !hasUuidMembership) {
    return diagnosticError("forbidden", 403, "authorization", "No active membership found.", diagnostic);
  }

  const randomSuffix = Math.random().toString(36).slice(2, 10);
  const rowId = String(body.id || "").trim() || `shotlog_${Date.now()}_${randomSuffix}`;
  const ts = Number.isFinite(body.ts) ? body.ts : Date.now();

  const row = {
    id: rowId,
    email: requester,
    name: String(body.name || "").trim() || requester,
    player_id: requester,
    team_id: teamId,
    made,
    date,
    ts,
  };

  diagnostic.shot_logs_insert_attempted = "yes";
  try {
    const inserted = await upsertRows(env, "shot_logs", row);
    diagnostic.shot_logs_insert_success = "yes";
    diagnostic.shot_logs_insert_error = "none";
    return Response.json({ ok: true, shot_log: Array.isArray(inserted) ? inserted[0] || row : row, diagnostic }, { status: 200 });
  } catch (error) {
    diagnostic.shot_logs_insert_success = "no";
    diagnostic.shot_logs_insert_error = safeErrorMessage(error);
    return diagnosticError("persist_failed", 500, "shot_logs_insert", "Failed to persist home shots log.", diagnostic, {
      shot_logs_insert_safe_error_code: "persist_failed",
      shot_logs_insert_safe_error_message: safeErrorMessage(error),
    });
  }
}
