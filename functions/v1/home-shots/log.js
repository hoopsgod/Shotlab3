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

function cleanKey(value) {
  return String(value ?? "").trim();
}

function firstPresentKey(row = {}, keys = []) {
  for (const key of keys) {
    const value = cleanKey(row?.[key]);
    if (value) return value;
  }
  return "";
}

function deriveRosterPlayerKey(playerRow = null) {
  return firstPresentKey(playerRow || {}, ["player_id", "playerId", "id", "user_id"]);
}

function deriveRosterTeamKey(playerRow = null, fallbackTeamId = "") {
  return firstPresentKey(playerRow || {}, ["team_id", "teamId"]) || cleanKey(fallbackTeamId);
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


function requireRepairToken(request, env) {
  if (!env?.INTERNAL_API_TOKEN) {
    return { ok: false, status: 401, error: "repair_token_required" };
  }
  return requireApiToken(request, env);
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

function shotLogInsertErrorHaystack(error) {
  const details = error?.details || {};
  return [error?.message, details.message, details.details, details.hint, details.code]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
}

function isShotLogInsertTypeError(error) {
  const haystack = shotLogInsertErrorHaystack(error);
  return haystack.includes("invalid input syntax") || haystack.includes("bigint") || haystack.includes("uuid") || haystack.includes("identity") || haystack.includes("type mismatch");
}

function shouldRetryShotLogInsertWithoutClientId(error, clientId = "") {
  const haystack = shotLogInsertErrorHaystack(error);
  const pointsToShotLogId =
    haystack.includes('column "id"') ||
    haystack.includes("column id") ||
    haystack.includes("shot_logs.id") ||
    haystack.includes("shot_logs_id") ||
    haystack.includes("shot log id") ||
    haystack.includes("shot_log_id");
  if (pointsToShotLogId) return isShotLogInsertTypeError(error);

  const normalizedClientId = String(clientId || "").trim().toLowerCase();
  if (!normalizedClientId || !haystack.includes(normalizedClientId) || !isShotLogInsertTypeError(error)) {
    return false;
  }

  const pointsToAnotherIdentityColumn =
    haystack.includes("player_id") ||
    haystack.includes("player id") ||
    haystack.includes("user_id") ||
    haystack.includes("user id") ||
    haystack.includes("team_id") ||
    haystack.includes("team id");
  return !pointsToAnotherIdentityColumn;
}

function shouldRetryShotLogInsertWithAlternatePlayerId(error) {
  const haystack = shotLogInsertErrorHaystack(error);
  const pointsToPlayerId = haystack.includes('column "player_id"') || haystack.includes("player_id") || haystack.includes("player id");
  return pointsToPlayerId && isShotLogInsertTypeError(error);
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


const LEGACY_PROFILE_TEAM_COLUMNS = ["team_id", "teamId"];

async function selectLegacyProfilesByColumn(env, { requester, teamId, teamColumn, exact = false }) {
  const teamFilter = exact ? `&${teamColumn}=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1` : "";
  return selectRows(
    env,
    "legacy_auth_profiles",
    `select=email,name,role,${teamColumn}&email=eq.${encodeURIComponent(requester)}${teamFilter}`,
  );
}

async function findLegacyPlayerProfileEvidence(env, { requester, teamId }) {
  for (const teamColumn of LEGACY_PROFILE_TEAM_COLUMNS) {
    try {
      const rows = await selectLegacyProfilesByColumn(env, { requester, teamId, teamColumn, exact: true });
      const profile = Array.isArray(rows) ? rows[0] : null;
      if (profile) return { ok: true, result: `match:legacy_auth_profiles/${teamColumn}`, profile };
    } catch (error) {
      if (!shouldTreatLookupErrorAsNoMatch(error)) return { ok: false, fatal: error, result: `error:legacy_auth_profiles/${teamColumn}`, reason: "registered_profile_probe_failed" };
    }
  }

  let foundAnyProfile = false;
  const teamIds = [];
  for (const teamColumn of LEGACY_PROFILE_TEAM_COLUMNS) {
    try {
      const rows = await selectLegacyProfilesByColumn(env, { requester, teamId, teamColumn });
      const profiles = Array.isArray(rows) ? rows : [];
      if (profiles.length) foundAnyProfile = true;
      const profile = profiles.find((row) => String(row[teamColumn] || "").trim() === teamId && normalizeIdentity(row.role || "player") === "player");
      if (profile) return { ok: true, result: `match:legacy_auth_profiles/${teamColumn}/fallback`, profile };
      teamIds.push(...profiles.map((row) => String(row[teamColumn] || "").trim()).filter(Boolean));
    } catch (error) {
      if (!shouldTreatLookupErrorAsNoMatch(error)) return { ok: false, fatal: error, result: `error:legacy_auth_profiles/${teamColumn}/fallback`, reason: "registered_profile_probe_failed" };
    }
  }
  if (!foundAnyProfile) return { ok: false, result: "0", reason: "registered_profile_not_found" };
  return { ok: false, result: `team_mismatch:${safeDiagnosticText(teamIds.slice(0, 3).join(",") || "none", 80)}`, reason: "registered_profile_team_mismatch" };
}


function compactRepairError(error) {
  return `${Number(error?.status || 0) || "unknown"}:${safeErrorMessage(error)}`;
}

function repairPayloadVariants({ tableName, requester, resolvedUserUuid, teamId, name }) {
  const displayName = String(name || requester || "Player").trim();
  if (tableName === "players") {
    const userIdentity = resolvedUserUuid || requester;
    return [
      { row: { email: requester, team_id: teamId, name: displayName, role: "player", status: "active" }, onConflict: "team_id,email" },
      { row: { email: requester, team_id: teamId, name: displayName }, onConflict: "team_id,email" },
      { row: { email: requester, teamId, name: displayName, role: "player", status: "active" }, onConflict: "teamId,email" },
      { row: { email: requester, teamId, name: displayName }, onConflict: "teamId,email" },
      { row: { email: requester, user_id: userIdentity, team_id: teamId, name: displayName, role: "player", status: "active" }, onConflict: "team_id,email" },
      { row: { email: requester, userId: userIdentity, teamId, name: displayName, role: "player", status: "active" }, onConflict: "teamId,email" },
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

async function verifyRepairIsAllowed(env, { request, requester, resolvedUserUuid, teamId, legacyProfileFallback }, diagnostic) {
  if (legacyProfileFallback?.verified === true) {
    diagnostic.team_binding_repair_auth = "legacy_profile";
    diagnostic.legacy_profile_fallback_result = safeDiagnosticText(legacyProfileFallback.result || "verified", 120);
    return { allowed: true, authorizedBy: "legacy_profile" };
  }

  const legacyProfile = await findLegacyPlayerProfileEvidence(env, { requester, teamId });
  diagnostic.team_binding_repair_account_probe = legacyProfile.result || "0";
  if (legacyProfile.ok) {
    diagnostic.team_binding_repair_auth = "legacy_profile";
    diagnostic.legacy_profile_fallback_result = legacyProfile.result || "match";
    return { allowed: true, authorizedBy: "legacy_profile" };
  }
  if (legacyProfile.fatal) return { allowed: false, fatal: legacyProfile.fatal, reason: legacyProfile.reason || "registered_profile_probe_failed" };

  const tokenAuth = requireRepairToken(request, env);
  diagnostic.team_binding_repair_auth = tokenAuth.ok ? "internal_api_token" : tokenAuth.error || "repair_token_required";
  if (!tokenAuth.ok) return { allowed: false, reason: "repair_not_authorized" };
  if (!resolvedUserUuid) return { allowed: false, reason: "resolved_user_uuid_missing" };
  return { allowed: true, authorizedBy: "internal_api_token" };
}

async function resolveOrRepairHomeShotPlayerBinding(env, options, diagnostic) {
  const { request, requester, resolvedUserUuid, teamId, name, legacyProfileFallback } = options;
  const identities = uniqueNormalized([requester, resolvedUserUuid]);
  const membershipLookup = await findActiveRowByFlexibleColumns(env, {
    tableName: "team_memberships",
    teamColumns: ["team_id", "teamId"],
    identityColumns: ["user_id", "userId", "email"],
    teamId,
    identities,
    activeRowPredicate: isActiveRow,
  });
  diagnostic.uuid_membership_query_attempted = resolvedUserUuid ? "yes" : "no";
  diagnostic.uuid_membership_query_result = membershipLookup.result || "0";
  diagnostic.email_membership_query_attempted = requester ? "yes" : "no";
  diagnostic.email_membership_query_result = membershipLookup.result || "0";
  if (membershipLookup.fatal) return { ok: false, fatal: membershipLookup.fatal, error: "membership_query_failed", stage: "membership_query", message: "Failed to verify player membership." };

  const playerLookup = await findActiveRowByFlexibleColumns(env, {
    tableName: "players",
    teamColumns: ["team_id", "teamId"],
    identityColumns: ["email", "player_id", "playerId", "user_id", "userId", "id"],
    teamId,
    identities,
    activeRowPredicate: isActivePlayerRow,
  });
  diagnostic.player_record_query_attempted = "yes";
  diagnostic.player_record_query_result = playerLookup.result || "0";
  if (playerLookup.fatal) return { ok: false, fatal: playerLookup.fatal, error: "player_query_failed", stage: "player_query", message: "Failed to verify player roster record." };

  if (membershipLookup.found || playerLookup.found) {
    diagnostic.authorized_by = membershipLookup.found ? "membership" : "player_roster";
    return { ok: true, membershipRow: membershipLookup.row || null, playerRow: playerLookup.row || null };
  }

  const repairAuth = await verifyRepairIsAllowed(env, { request, requester, resolvedUserUuid, teamId, legacyProfileFallback }, diagnostic);
  if (!repairAuth.allowed) {
    if (repairAuth.fatal) return { ok: false, fatal: repairAuth.fatal, error: "repair_authorization_failed", stage: "team_binding_repair", message: "Failed to verify registered player profile." };
    return { ok: false, repairReason: repairAuth.reason || "missing_durable_binding" };
  }

  if (repairAuth.authorizedBy === "legacy_profile") {
    diagnostic.authorized_by = "legacy_profile";
    return { ok: true, membershipRow: null, playerRow: null };
  }

  diagnostic.team_binding_repair_attempted = "yes";
  const repairOptions = { requester, resolvedUserUuid, teamId, name };
  const playerRepair = await tryFlexibleRepairUpsert(env, "players", repairOptions, "team_binding_repair_players_result", diagnostic);
  const membershipRepair = await tryFlexibleRepairUpsert(env, "team_memberships", repairOptions, "team_binding_repair_memberships_result", diagnostic);

  const afterMembershipRepair = await findActiveRowByFlexibleColumns(env, {
    tableName: "team_memberships",
    teamColumns: ["team_id", "teamId"],
    identityColumns: ["user_id", "userId", "email"],
    teamId,
    identities,
    activeRowPredicate: isActiveRow,
  });
  const afterPlayerRepair = await findActiveRowByFlexibleColumns(env, {
    tableName: "players",
    teamColumns: ["team_id", "teamId"],
    identityColumns: ["email", "player_id", "playerId", "user_id", "userId", "id"],
    teamId,
    identities,
    activeRowPredicate: isActivePlayerRow,
  });
  diagnostic.team_binding_repair_reread = "yes";
  diagnostic.uuid_membership_query_result = afterMembershipRepair.result || diagnostic.uuid_membership_query_result;
  diagnostic.email_membership_query_result = afterMembershipRepair.result || diagnostic.email_membership_query_result;
  diagnostic.player_record_query_result = afterPlayerRepair.result || diagnostic.player_record_query_result;

  if (afterMembershipRepair.found || afterPlayerRepair.found) {
    diagnostic.authorized_by = afterMembershipRepair.found ? "membership_repaired" : "player_roster_repaired";
    diagnostic.team_binding_repair_result = "success";
    return { ok: true, membershipRow: afterMembershipRepair.row || null, playerRow: afterPlayerRepair.row || null };
  }

  const repaired = playerRepair.ok || membershipRepair.ok;
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

export async function onRequestPost({ request, env, data = {} }) {
  const requester = normalizeIdentity(data?.verifiedRequester || readUserId(request));
  const diagnostic = {
    requester_present: requester ? "yes" : "no",
    requester_source: safeDiagnosticText(data?.verifiedRequesterSource || "direct_route_test", 80),
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
    legacy_profile_fallback_result: "not_attempted",
    authorized_by: "none",
    shot_logs_insert_attempted: "no",
    shot_logs_insert_success: "no",
    shot_logs_insert_error: "none",
    shot_logs_insert_retry_without_client_id: "no",
    shot_logs_insert_retry_with_alternate_player_id: "no",
    shot_logs_player_id_source: "requester_email",
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
    legacyProfileFallback: data.homeShotLegacyProfileFallback || null,
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

  const hasMatchedPlayerRow = Boolean(binding.playerRow);
  const rosterPlayerKey = deriveRosterPlayerKey(binding.playerRow);
  const rosterTeamKey = deriveRosterTeamKey(binding.playerRow, teamId);
  const preferredPlayerId = hasMatchedPlayerRow ? rosterPlayerKey : requester;
  const alternatePlayerId = "";
  diagnostic.shot_logs_player_id_source = rosterPlayerKey ? "matched_player_roster_key" : hasMatchedPlayerRow ? "matched_player_missing_roster_key" : "requester_email";

  const row = {
    id: rowId,
    email: requester,
    name: String(body.name || "").trim() || requester,
    player_id: preferredPlayerId,
    team_id: rosterTeamKey,
    made,
    date,
    ts,
  };

  const persistShotLogRow = async (candidateRow, fallbackRow, diagnosticPatch = {}) => {
    const inserted = await upsertRows(env, "shot_logs", candidateRow);
    diagnostic.shot_logs_insert_success = "yes";
    diagnostic.shot_logs_insert_error = "none";
    return Response.json({
      ok: true,
      shot_log: Array.isArray(inserted) ? inserted[0] || fallbackRow : fallbackRow,
      diagnostic: { ...diagnostic, ...diagnosticPatch },
    }, { status: 200 });
  };

  diagnostic.shot_logs_insert_attempted = "yes";
  try {
    return await persistShotLogRow(row, row);
  } catch (error) {
    const firstInsertDetails = safePostgrestInsertError(error);
    diagnostic.shot_logs_insert_success = "no";
    diagnostic.shot_logs_insert_error = safeErrorMessage(error);

    if (alternatePlayerId && shouldRetryShotLogInsertWithAlternatePlayerId(error)) {
      diagnostic.shot_logs_insert_retry_with_alternate_player_id = "yes";
      const alternateRow = { ...row, player_id: alternatePlayerId };
      try {
        return await persistShotLogRow(alternateRow, alternateRow, { shot_logs_insert_first_attempt_error: firstInsertDetails });
      } catch (alternateError) {
        diagnostic.shot_logs_insert_success = "no";
        diagnostic.shot_logs_insert_error = safeErrorMessage(alternateError);
        if (shouldRetryShotLogInsertWithoutClientId(alternateError, alternateRow.id)) {
          diagnostic.shot_logs_insert_retry_without_client_id = "yes";
          const alternateRowWithoutClientId = { ...alternateRow };
          delete alternateRowWithoutClientId.id;
          try {
            return await persistShotLogRow(alternateRowWithoutClientId, { ...alternateRow, id: alternateRow.id }, {
              shot_logs_insert_first_attempt_error: firstInsertDetails,
              shot_logs_insert_alternate_player_id_error: safePostgrestInsertError(alternateError),
            });
          } catch (alternateIdRetryError) {
            diagnostic.shot_logs_insert_success = "no";
            diagnostic.shot_logs_insert_error = safeErrorMessage(alternateIdRetryError);
            return diagnosticError("persist_failed", 500, "shot_logs_insert", "Failed to persist home shots log.", diagnostic, {
              shot_logs_insert_safe_error_code: "persist_failed",
              shot_logs_insert_safe_error_message: safeErrorMessage(alternateIdRetryError),
              shot_logs_insert_first_attempt_error: firstInsertDetails,
              shot_logs_insert_alternate_player_id_error: safePostgrestInsertError(alternateError),
              shot_logs_insert_retry_error: safePostgrestInsertError(alternateIdRetryError),
            });
          }
        }
        return diagnosticError("persist_failed", 500, "shot_logs_insert", "Failed to persist home shots log.", diagnostic, {
          shot_logs_insert_safe_error_code: "persist_failed",
          shot_logs_insert_safe_error_message: safeErrorMessage(alternateError),
          shot_logs_insert_first_attempt_error: firstInsertDetails,
          shot_logs_insert_alternate_player_id_error: safePostgrestInsertError(alternateError),
        });
      }
    }

    if (shouldRetryShotLogInsertWithoutClientId(error, row.id)) {
      diagnostic.shot_logs_insert_retry_without_client_id = "yes";
      const rowWithoutClientId = { ...row };
      delete rowWithoutClientId.id;
      try {
        return await persistShotLogRow(rowWithoutClientId, { ...row, id: row.id }, { shot_logs_insert_first_attempt_error: firstInsertDetails });
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
