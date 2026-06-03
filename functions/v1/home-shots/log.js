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

function safeDiagnosticText(value, maxLength = 160) {
  return String(value || "")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
    .replace(/service_role|apikey|authorization|password|secret|token/gi, "[redacted]")
    .trim()
    .slice(0, maxLength);
}

function safeErrorMessage(error) {
  return safeDiagnosticText(error?.message || "unknown_error", 120) || "unknown_error";
}

function safePostgrestInsertError(error) {
  const details = error?.details || {};
  return {
    status: Number(error?.status || 0) || null,
    code: safeDiagnosticText(details.code, 40),
    message: safeErrorMessage(error),
    details: safeDiagnosticText(details.details, 180),
    hint: safeDiagnosticText(details.hint, 180),
  };
}

function shouldRetryShotLogInsertWithoutClientId(error) {
  const details = error?.details || {};
  const haystack = [error?.message, details.message, details.details, details.hint, details.code]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  if (!haystack.includes("id")) return false;
  return (
    haystack.includes("invalid input syntax") ||
    haystack.includes("bigint") ||
    haystack.includes("uuid") ||
    haystack.includes("identity") ||
    haystack.includes('column "id"') ||
    haystack.includes("column id")
  );
}

function rpcScalar(json, key) {
  if (typeof json === "string") return json.trim();
  if (Array.isArray(json)) {
    const first = json[0];
    if (typeof first === "string") return first.trim();
    return String(first?.[key] || first?.resolved_user_uuid || first?.user_id || "").trim();
  }
  return String(json?.[key] || json?.resolved_user_uuid || json?.user_id || "").trim();
}

function normalizeTimestamp(value) {
  if (value == null || value === "") return new Date(Date.now()).toISOString();
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  const raw = String(value).trim();
  if (/^[0-9]+$/.test(raw)) {
    const numericValue = Number(raw);
    if (Number.isFinite(numericValue)) return new Date(numericValue).toISOString();
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date(Date.now()).toISOString();
}

function uniqueNormalized(values = []) {
  return [...new Set(values.map((value) => normalizeIdentity(value)).filter(Boolean))];
}

function isActiveRow(row = {}) {
  const status = normalizeIdentity(row.status ?? row.membership_status ?? row.membershipStatus ?? row.state ?? "active");
  return !status || status === "active" || status === "joined";
}

function isActivePlayerRow(row = {}) {
  if (!isActiveRow(row)) return false;
  const role = normalizeIdentity(row.role ?? row.player_role ?? row.playerRole ?? "player");
  return !role || role === "player" || role === "athlete";
}

function shouldTreatLookupErrorAsNoMatch(error) {
  const status = Number(error?.status || 0);
  const message = safeErrorMessage(error).toLowerCase();
  return !status || status === 400 || status === 404 || status >= 500 || message.includes("column") || message.includes("schema cache") || message.includes("could not find");
}

async function findActiveRowByFlexibleColumns(env, { tableName, teamColumns, identityColumns, teamId, identities, activeRowPredicate }) {
  const normalizedIdentities = uniqueNormalized(identities);
  const errors = [];
  let attempts = 0;
  for (const teamColumn of teamColumns) {
    for (const identityColumn of identityColumns) {
      for (const identity of normalizedIdentities) {
        attempts += 1;
        try {
          const rows = await selectRows(
            env,
            tableName,
            `select=*&${teamColumn}=eq.${encodeURIComponent(teamId)}&${identityColumn}=eq.${encodeURIComponent(identity)}&limit=1`,
          );
          const activeRow = Array.isArray(rows) ? rows.find((row) => activeRowPredicate(row)) : null;
          if (activeRow) return { found: true, attempts, result: `match:${teamColumn}/${identityColumn}`, row: activeRow };
        } catch (error) {
          const safeMessage = safeErrorMessage(error);
          errors.push(`${teamColumn}/${identityColumn}:${safeMessage}`);
          if (!shouldTreatLookupErrorAsNoMatch(error)) return { found: false, fatal: error, attempts, errors };
        }
      }
    }
  }
  return { found: false, attempts, errors, result: errors.length ? `0;errors=${errors.slice(0, 3).join("|")}` : "0" };
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
    player_record_query_attempted: "no",
    player_record_query_result: "not_attempted",
    authorized_by: "none",
    shot_logs_insert_attempted: "no",
    shot_logs_insert_success: "no",
    shot_logs_insert_error: "none",
    shot_logs_insert_retry_without_client_id: "no",
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
    resolvedUserUuid = normalizeIdentity(rpcScalar(await callRpc(env, "resolve_app_user_uuid", { p_identifier: requester }), "resolve_app_user_uuid"));
    diagnostic.resolved_app_user_uuid_success = "yes";
    diagnostic.resolved_uuid_present = resolvedUserUuid ? "yes" : "no";
  } catch (error) {
    diagnostic.resolved_app_user_uuid_success = "no";
    diagnostic.resolved_uuid_present = "no";
  }

  let hasEmailMembership = false;
  let hasUuidMembership = false;
  const membershipTeamColumns = ["team_id", "teamId"];
  const membershipIdentityColumns = ["user_id", "userId", "email"];

  if (resolvedUserUuid) {
    diagnostic.uuid_membership_query_attempted = "yes";
    const membershipByUuid = await findActiveRowByFlexibleColumns(env, {
      tableName: "team_memberships",
      teamColumns: membershipTeamColumns,
      identityColumns: membershipIdentityColumns,
      teamId,
      identities: [resolvedUserUuid],
      activeRowPredicate: isActiveRow,
    });
    if (membershipByUuid.fatal) {
      diagnostic.uuid_membership_query_result = `error:${safeErrorMessage(membershipByUuid.fatal)}`;
      return diagnosticError("membership_uuid_query_failed", 500, "uuid_membership_lookup", "Failed to check uuid membership.", diagnostic);
    }
    hasUuidMembership = membershipByUuid.found;
    diagnostic.uuid_membership_query_result = membershipByUuid.result || (hasUuidMembership ? "match" : "0");
  }
  if (!resolvedUserUuid) diagnostic.uuid_membership_query_result = "skipped_missing_resolved_uuid";

  if (!hasUuidMembership) {
    diagnostic.email_membership_query_attempted = "yes";
    const membershipByEmail = await findActiveRowByFlexibleColumns(env, {
      tableName: "team_memberships",
      teamColumns: membershipTeamColumns,
      identityColumns: membershipIdentityColumns,
      teamId,
      identities: [requester],
      activeRowPredicate: isActiveRow,
    });
    hasEmailMembership = membershipByEmail.found;
    diagnostic.email_membership_query_result = membershipByEmail.result || (hasEmailMembership ? "match" : "0");
  }

  let hasPlayerRecord = false;
  if (!hasEmailMembership && !hasUuidMembership) {
    diagnostic.player_record_query_attempted = "yes";
    const playerRecord = await findActiveRowByFlexibleColumns(env, {
      tableName: "players",
      teamColumns: ["team_id", "teamId"],
      identityColumns: ["email", "user_id", "userId", "player_id", "playerId", "id"],
      teamId,
      identities: [requester, resolvedUserUuid],
      activeRowPredicate: isActivePlayerRow,
    });
    hasPlayerRecord = playerRecord.found;
    diagnostic.player_record_query_result = playerRecord.result || (hasPlayerRecord ? "match" : "0");
  }

  if (hasEmailMembership) diagnostic.authorized_by = "email";
  if (!hasEmailMembership && hasUuidMembership) diagnostic.authorized_by = "uuid";
  if (!hasEmailMembership && !hasUuidMembership && hasPlayerRecord) diagnostic.authorized_by = "player_record";

  if (!hasEmailMembership && !hasUuidMembership && !hasPlayerRecord) {
    return diagnosticError("forbidden", 403, "authorization", "No active membership or player record found.", diagnostic);
  }

  const randomSuffix = Math.random().toString(36).slice(2, 10);
  const rowId = String(body.id || "").trim() || `shotlog_${Date.now()}_${randomSuffix}`;
  const ts = normalizeTimestamp(body.ts);

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
    const firstInsertDetails = safePostgrestInsertError(error);
    diagnostic.shot_logs_insert_success = "no";
    diagnostic.shot_logs_insert_error = safeErrorMessage(error);

    if (shouldRetryShotLogInsertWithoutClientId(error)) {
      diagnostic.shot_logs_insert_retry_without_client_id = "yes";
      const rowWithoutClientId = { ...row };
      delete rowWithoutClientId.id;
      try {
        const inserted = await upsertRows(env, "shot_logs", rowWithoutClientId);
        diagnostic.shot_logs_insert_success = "yes";
        diagnostic.shot_logs_insert_error = "none";
        return Response.json({
          ok: true,
          shot_log: Array.isArray(inserted) ? inserted[0] || { ...row, id: row.id } : row,
          diagnostic: { ...diagnostic, shot_logs_insert_first_attempt_error: firstInsertDetails },
        }, { status: 200 });
      } catch (retryError) {
        diagnostic.shot_logs_insert_success = "no";
        diagnostic.shot_logs_insert_error = safeErrorMessage(retryError);
        return diagnosticError("persist_failed", 500, "shot_logs_insert", "Failed to persist home shots log.", diagnostic, {
          shot_logs_insert_safe_error_code: "persist_failed",
          shot_logs_insert_safe_error_message: safeErrorMessage(retryError),
          shot_logs_insert_first_attempt_error: firstInsertDetails,
          shot_logs_insert_retry_error: safePostgrestInsertError(retryError),
        });
      }
    }

    return diagnosticError("persist_failed", 500, "shot_logs_insert", "Failed to persist home shots log.", diagnostic, {
      shot_logs_insert_safe_error_code: "persist_failed",
      shot_logs_insert_safe_error_message: safeErrorMessage(error),
      shot_logs_insert_postgrest_error: firstInsertDetails,
    });
  }
}
