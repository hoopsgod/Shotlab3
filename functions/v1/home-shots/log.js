import { callRpc, readUserId, selectRows, upsertRows } from "../../_utils/supabase.js";
import { requireApiToken } from "../../_utils/security.js";

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
  if (status >= 500) return false;
  return status === 400 || status === 404 || message.includes("column") || message.includes("schema cache") || message.includes("could not find");
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


function compactRepairError(error) {
  return `${Number(error?.status || 0) || "unknown"}:${safeErrorMessage(error)}`;
}

function repairPayloadVariants({ tableName, requester, resolvedUserUuid, teamId, name }) {
  const displayName = String(name || requester || "Player").trim();
  if (tableName === "players") {
    return [
      { row: { email: requester, player_id: requester, team_id: teamId, name: displayName, role: "player", status: "active" }, onConflict: "team_id,email" },
      { row: { email: requester, player_id: requester, team_id: teamId, name: displayName }, onConflict: "team_id,email" },
      { row: { email: requester, playerId: requester, teamId, name: displayName, role: "player", status: "active" }, onConflict: "teamId,email" },
      { row: { email: requester, playerId: requester, teamId, name: displayName }, onConflict: "teamId,email" },
      { row: { email: requester, user_id: resolvedUserUuid || requester, team_id: teamId, name: displayName, role: "player", status: "active" }, onConflict: "team_id,email" },
      { row: { email: requester, userId: resolvedUserUuid || requester, teamId, name: displayName, role: "player", status: "active" }, onConflict: "teamId,email" },
    ];
  }
  const identityVariants = uniqueNormalized([resolvedUserUuid, requester]);
  const rows = [];
  for (const identity of identityVariants) {
    rows.push({ row: { team_id: teamId, user_id: identity, role: "player", status: "active" }, onConflict: "team_id,user_id" });
    rows.push({ row: { team_id: teamId, user_id: identity, email: requester, role: "player", status: "active" }, onConflict: "team_id,user_id" });
    rows.push({ row: { teamId, userId: identity, role: "player", status: "active" }, onConflict: "teamId,userId" });
    rows.push({ row: { teamId, userId: identity, email: requester, role: "player", status: "active" }, onConflict: "teamId,userId" });
  }
  rows.push({ row: { team_id: teamId, email: requester, role: "player", status: "active" }, onConflict: "team_id,email" });
  rows.push({ row: { teamId, email: requester, role: "player", status: "active" }, onConflict: "teamId,email" });
  return rows;
}

async function tryFlexibleRepairUpsert(env, tableName, options, diagnosticKey, diagnostic) {
  const attempts = [];
  for (const variant of repairPayloadVariants({ tableName, ...options })) {
    const columns = Object.keys(variant.row).join(",");
    try {
      await upsertRows(env, tableName, variant.row, variant.onConflict);
      attempts.push(`ok:${columns}`);
      diagnostic[diagnosticKey] = attempts.join("|");
      return { ok: true, attempts };
    } catch (error) {
      attempts.push(`${columns}:${compactRepairError(error)}`);
      if (!shouldTreatLookupErrorAsNoMatch(error)) {
        diagnostic[diagnosticKey] = attempts.slice(0, 4).join("|");
        return { ok: false, fatal: error, attempts };
      }
    }
  }
  diagnostic[diagnosticKey] = attempts.slice(0, 4).join("|") || "not_attempted";
  return { ok: false, attempts };
}

async function verifyRepairIsAllowed(env, { requester, teamId }, diagnostic) {
  diagnostic.team_binding_repair_account_probe = "not_attempted";
  try {
    const exactRows = await selectRows(
      env,
      "legacy_auth_profiles",
      `select=email,name,role,team_id&email=eq.${encodeURIComponent(requester)}&team_id=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1`,
    );
    const exactProfile = Array.isArray(exactRows) ? exactRows[0] : null;
    if (exactProfile) {
      diagnostic.team_binding_repair_account_probe = "match:legacy_auth_profiles/team_id";
      return { ok: true, profile: exactProfile };
    }
  } catch (error) {
    diagnostic.team_binding_repair_account_probe = `exact_error:${safeErrorMessage(error)}`;
    if (!shouldTreatLookupErrorAsNoMatch(error)) return { ok: false, fatal: error, reason: "registered_profile_probe_failed" };
  }

  try {
    const rows = await selectRows(env, "legacy_auth_profiles", `select=email,name,role,team_id,teamId&email=eq.${encodeURIComponent(requester)}`);
    const profiles = Array.isArray(rows) ? rows : [];
    const matchingProfile = profiles.find((profile) => String(profile.team_id || profile.teamId || "").trim() === teamId && normalizeIdentity(profile.role || "player") === "player");
    if (matchingProfile) {
      diagnostic.team_binding_repair_account_probe = "match:legacy_auth_profiles/fallback";
      return { ok: true, profile: matchingProfile };
    }
    if (!profiles.length) {
      diagnostic.team_binding_repair_account_probe = "0";
      return { ok: false, reason: "registered_profile_not_found" };
    }
    const teamIds = profiles.map((profile) => String(profile.team_id || profile.teamId || "").trim()).filter(Boolean).slice(0, 3).join(",") || "none";
    diagnostic.team_binding_repair_account_probe = `team_mismatch:${safeDiagnosticText(teamIds, 80)}`;
    return { ok: false, reason: "registered_profile_team_mismatch" };
  } catch (error) {
    diagnostic.team_binding_repair_account_probe = `fallback_error:${safeErrorMessage(error)}`;
    if (!shouldTreatLookupErrorAsNoMatch(error)) return { ok: false, fatal: error, reason: "registered_profile_probe_failed" };
    return { ok: false, reason: "registered_profile_probe_unavailable" };
  }
}

async function probeHomeShotPlayerBinding(env, { requester, resolvedUserUuid, teamId }, diagnostic) {
  let hasEmailMembership = false;
  let hasUuidMembership = false;
  let hasPlayerRecord = false;
  const membershipTeamColumns = ["team_id", "teamId"];
  const membershipIdentityColumns = ["user_id", "userId", "email"];

  if (resolvedUserUuid) {
    diagnostic.uuid_membership_query_attempted = "yes";
    const membershipByUuid = await findActiveRowByFlexibleColumns(env, { tableName: "team_memberships", teamColumns: membershipTeamColumns, identityColumns: membershipIdentityColumns, teamId, identities: [resolvedUserUuid], activeRowPredicate: isActiveRow });
    if (membershipByUuid.fatal) {
      diagnostic.uuid_membership_query_result = `error:${safeErrorMessage(membershipByUuid.fatal)}`;
      return { ok: false, fatal: membershipByUuid.fatal, error: "membership_uuid_query_failed", stage: "uuid_membership_lookup", message: "Failed to check uuid membership." };
    }
    hasUuidMembership = membershipByUuid.found;
    diagnostic.uuid_membership_query_result = membershipByUuid.result || (hasUuidMembership ? "match" : "0");
  } else {
    diagnostic.uuid_membership_query_result = "skipped_missing_resolved_uuid";
  }

  if (!hasUuidMembership) {
    diagnostic.email_membership_query_attempted = "yes";
    const membershipByEmail = await findActiveRowByFlexibleColumns(env, { tableName: "team_memberships", teamColumns: membershipTeamColumns, identityColumns: membershipIdentityColumns, teamId, identities: [requester], activeRowPredicate: isActiveRow });
    if (membershipByEmail.fatal) {
      diagnostic.email_membership_query_result = `error:${safeErrorMessage(membershipByEmail.fatal)}`;
      return { ok: false, fatal: membershipByEmail.fatal, error: "membership_email_query_failed", stage: "email_membership_lookup", message: "Failed to check email membership." };
    }
    hasEmailMembership = membershipByEmail.found;
    diagnostic.email_membership_query_result = membershipByEmail.result || (hasEmailMembership ? "match" : "0");
  }

  if (!hasEmailMembership && !hasUuidMembership) {
    diagnostic.player_record_query_attempted = "yes";
    const playerRecord = await findActiveRowByFlexibleColumns(env, { tableName: "players", teamColumns: ["team_id", "teamId"], identityColumns: ["email", "user_id", "userId", "player_id", "playerId", "id"], teamId, identities: [requester, resolvedUserUuid], activeRowPredicate: isActivePlayerRow });
    if (playerRecord.fatal) {
      diagnostic.player_record_query_result = `error:${safeErrorMessage(playerRecord.fatal)}`;
      return { ok: false, fatal: playerRecord.fatal, error: "player_record_query_failed", stage: "player_record_lookup", message: "Failed to check player record." };
    }
    hasPlayerRecord = playerRecord.found;
    diagnostic.player_record_query_result = playerRecord.result || (hasPlayerRecord ? "match" : "0");
  }

  let authorizedBy = "none";
  if (hasEmailMembership) authorizedBy = "email";
  if (!hasEmailMembership && hasUuidMembership) authorizedBy = "uuid";
  if (!hasEmailMembership && !hasUuidMembership && hasPlayerRecord) authorizedBy = "player_record";
  diagnostic.authorized_by = authorizedBy;
  return { ok: authorizedBy !== "none", authorizedBy };
}

async function resolveOrRepairHomeShotPlayerBinding(env, { request, requester, resolvedUserUuid, teamId, name }, diagnostic) {
  const initial = await probeHomeShotPlayerBinding(env, { requester, resolvedUserUuid, teamId }, diagnostic);
  if (initial.ok || initial.fatal) return initial;
  diagnostic.team_binding_repair_attempted = "yes";
  const repairAllowed = await verifyRepairIsAllowed(env, { requester, teamId }, diagnostic);
  if (!repairAllowed.ok) return { ok: false, repairFailed: true, repairReason: repairAllowed.reason || "repair_not_allowed", fatal: repairAllowed.fatal || null };
  if (!env?.INTERNAL_API_TOKEN) {
    diagnostic.team_binding_repair_auth = "required";
    return { ok: false, repairFailed: true, repairReason: "repair_auth_required" };
  }
  const repairAuth = requireApiToken(request, env);
  if (!repairAuth.ok) {
    diagnostic.team_binding_repair_auth = "required";
    return { ok: false, repairFailed: true, repairReason: "repair_auth_required" };
  }
  diagnostic.team_binding_repair_auth = "ok";

  const repairOptions = { requester, resolvedUserUuid, teamId, name: name || repairAllowed.profile?.name || requester };
  const playerRepair = await tryFlexibleRepairUpsert(env, "players", repairOptions, "team_binding_repair_players_result", diagnostic);
  diagnostic.team_binding_repair_reread = "after_players";
  const afterPlayerRepair = await probeHomeShotPlayerBinding(env, { requester, resolvedUserUuid, teamId }, diagnostic);
  if (afterPlayerRepair.ok) {
    diagnostic.team_binding_repair_result = afterPlayerRepair.authorizedBy === "player_record" ? "repaired_player_record" : "repaired";
    return afterPlayerRepair;
  }

  const membershipRepair = await tryFlexibleRepairUpsert(env, "team_memberships", repairOptions, "team_binding_repair_memberships_result", diagnostic);
  diagnostic.team_binding_repair_reread = "after_membership";
  const repaired = await probeHomeShotPlayerBinding(env, { requester, resolvedUserUuid, teamId }, diagnostic);
  if (repaired.ok) {
    diagnostic.team_binding_repair_result = repaired.authorizedBy === "player_record" && !membershipRepair.ok ? "repaired_player_record" : "repaired";
    return repaired;
  }

  const fatal = repaired.fatal || afterPlayerRepair.fatal || playerRepair.fatal || membershipRepair.fatal || null;
  const repairReason = !playerRepair.ok && !membershipRepair.ok ? "repair_upsert_failed" : "repair_reread_no_binding";
  return { ok: false, repairFailed: true, repairReason, fatal };
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
    team_binding_repair_attempted: "no",
    team_binding_repair_account_probe: "not_attempted",
    team_binding_repair_players_result: "not_attempted",
    team_binding_repair_memberships_result: "not_attempted",
    team_binding_repair_reread: "no",
    team_binding_repair_result: "not_attempted",
    team_binding_repair_auth: "not_attempted",
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

  const binding = await resolveOrRepairHomeShotPlayerBinding(env, {
    request,
    requester,
    resolvedUserUuid,
    teamId,
    name: String(body.name || "").trim() || requester,
  }, diagnostic);

  if (binding.fatal && !binding.repairFailed) {
    return diagnosticError(binding.error, 500, binding.stage, binding.message, diagnostic);
  }

  if (!binding.ok) {
    if (binding.fatal) diagnostic.team_binding_repair_result = `error:${safeErrorMessage(binding.fatal)}`;
    else diagnostic.team_binding_repair_result = binding.repairReason || "missing_durable_binding";
    return diagnosticError(
      "missing_durable_team_binding",
      403,
      "team_binding_repair",
      "Your player account is not durably linked to this team yet.",
      diagnostic,
      { repair_reason: binding.repairReason || "missing_durable_binding" },
    );
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
