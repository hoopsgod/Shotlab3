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


function rpcScalar(json, key) {
  if (typeof json === "string") return json;
  if (Array.isArray(json)) {
    const first = json[0];
    if (typeof first === "string") return first;
    return String(first?.[key] || first?.resolved_user_uuid || first?.user_id || "").trim();
  }
  return String(json?.[key] || json?.resolved_user_uuid || json?.user_id || "").trim();
}

function normalizeTimestamp(value) {
  if (value == null || value === "") return new Date().toISOString();
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  const raw = String(value).trim();
  if (/^[0-9]+$/.test(raw)) {
    const numericValue = Number(raw);
    if (Number.isFinite(numericValue)) return new Date(numericValue).toISOString();
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString();
}

function safeErrorMessage(error) {
  const message = String(error?.message || "unknown_error").trim();
  return message.slice(0, 120) || "unknown_error";
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

function shouldTreatLookupErrorAsSchemaMiss(error) {
  const status = Number(error?.status || error?.details?.code || 0);
  const message = safeErrorMessage(error).toLowerCase();
  return status === 400 || status === 404 || message.includes("column") || message.includes("schema cache") || message.includes("could not find");
}

async function findActiveRowByFlexibleColumns(env, { tableName, teamColumns, identityColumns, teamId, identities, activeRowPredicate, onQueryError }) {
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
          if (activeRow) return { found: true, attempts, result: `match:${teamColumn}/${identityColumn}` };
        } catch (error) {
          const safeMessage = safeErrorMessage(error);
          errors.push(`${teamColumn}/${identityColumn}:${safeMessage}`);
          if (onQueryError && !shouldTreatLookupErrorAsSchemaMiss(error)) {
            const fatal = onQueryError(error);
            if (fatal) return { found: false, fatal, attempts, errors };
          }
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
    authorized_by: "none",
    player_record_query_attempted: "no",
    player_record_query_result: "not_attempted",
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
    resolvedUserUuid = normalizeIdentity(rpcScalar(await callRpc(env, "resolve_app_user_uuid", { p_identifier: requester }), "resolve_app_user_uuid"));
    diagnostic.resolved_app_user_uuid_success = "yes";
    diagnostic.resolved_uuid_present = resolvedUserUuid ? "yes" : "no";
  } catch (error) {
    diagnostic.resolved_app_user_uuid_success = "no";
    diagnostic.resolved_uuid_present = "no";
  }

  const membershipTeamColumns = ["team_id", "teamId"];
  const membershipUserColumns = ["user_id", "userId"];
  const playerTeamColumns = ["team_id", "teamId"];
  const playerIdentityColumns = ["email", "player_id", "playerId", "user_id", "userId"];

  let hasEmailMembership = false;
  let hasUuidMembership = false;
  let hasPlayerRecord = false;

  if (resolvedUserUuid) {
    diagnostic.uuid_membership_query_attempted = "yes";
    const uuidMembership = await findActiveRowByFlexibleColumns(env, {
      tableName: "team_memberships",
      teamColumns: membershipTeamColumns,
      identityColumns: membershipUserColumns,
      teamId,
      identities: [resolvedUserUuid],
      activeRowPredicate: isActiveRow,
      onQueryError: (error) => {
        if (Number(error?.status || 0) >= 500) {
          diagnostic.uuid_membership_query_result = `error:${safeErrorMessage(error)}`;
          return diagnosticError("membership_uuid_query_failed", 500, "uuid_membership_lookup", "Failed to check uuid membership.", diagnostic);
        }
        return null;
      },
    });
    if (uuidMembership.fatal) return uuidMembership.fatal;
    hasUuidMembership = uuidMembership.found;
    diagnostic.uuid_membership_query_result = uuidMembership.result || (hasUuidMembership ? "match" : "0");
  }
  if (!resolvedUserUuid) diagnostic.uuid_membership_query_result = "skipped_missing_resolved_uuid";

  if (!hasUuidMembership) {
    diagnostic.email_membership_query_attempted = "yes";
    const emailMembership = await findActiveRowByFlexibleColumns(env, {
      tableName: "team_memberships",
      teamColumns: membershipTeamColumns,
      identityColumns: membershipUserColumns,
      teamId,
      identities: [requester],
      activeRowPredicate: isActiveRow,
    });
    hasEmailMembership = emailMembership.found;
    diagnostic.email_membership_query_result = !hasEmailMembership && emailMembership.errors?.length
      ? `error_treated_as_no_match:${emailMembership.errors.slice(0, 3).join("|")}`
      : emailMembership.result || (hasEmailMembership ? "match" : "0");
  }

  if (!hasUuidMembership && !hasEmailMembership) {
    diagnostic.player_record_query_attempted = "yes";
    const playerRecord = await findActiveRowByFlexibleColumns(env, {
      tableName: "players",
      teamColumns: playerTeamColumns,
      identityColumns: playerIdentityColumns,
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
    diagnostic.shot_logs_insert_success = "no";
    diagnostic.shot_logs_insert_error = safeErrorMessage(error);
    return diagnosticError("persist_failed", 500, "shot_logs_insert", "Failed to persist home shots log.", diagnostic, {
      shot_logs_insert_safe_error_code: "persist_failed",
      shot_logs_insert_safe_error_message: safeErrorMessage(error),
    });
  }
}
