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

function safeDiagnosticText(value, maxLength = 180) {
  return String(value || "").trim().slice(0, maxLength);
}

function safeErrorMessage(error) {
  return safeDiagnosticText(error?.message || "unknown_error", 140) || "unknown_error";
}

function safePostgrestInsertError(error) {
  const details = error?.details || {};
  return {
    status: Number(error?.status || 0) || null,
    code: safeDiagnosticText(details.code, 40),
    message: safeErrorMessage(error),
    details: safeDiagnosticText(details.details || details.message, 220),
    hint: safeDiagnosticText(details.hint, 220),
  };
}

function errorHaystack(error) {
  const details = error?.details || {};
  return [error?.message, details.message, details.details, details.hint, details.code]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
}

function isSchemaShapeError(error) {
  const haystack = errorHaystack(error);
  return (
    haystack.includes("invalid input syntax") ||
    haystack.includes("could not find") ||
    haystack.includes("schema cache") ||
    haystack.includes("column") ||
    haystack.includes("bigint") ||
    haystack.includes("uuid") ||
    haystack.includes("violates not-null") ||
    haystack.includes("null value") ||
    haystack.includes("type mismatch")
  );
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

function rpcScalar(json, key) {
  if (typeof json === "string") return json.trim();
  if (Array.isArray(json)) {
    const first = json[0];
    if (typeof first === "string") return first.trim();
    return String(first?.[key] || first?.resolved_user_uuid || first?.user_id || "").trim();
  }
  return String(json?.[key] || json?.resolved_user_uuid || json?.user_id || "").trim();
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
  for (const teamColumn of teamColumns) {
    for (const identityColumn of identityColumns) {
      for (const identity of normalizedIdentities) {
        try {
          const rows = await selectRows(
            env,
            tableName,
            `select=*&${teamColumn}=eq.${encodeURIComponent(teamId)}&${identityColumn}=eq.${encodeURIComponent(identity)}&limit=1`,
          );
          const activeRow = Array.isArray(rows) ? rows.find((row) => activeRowPredicate(row)) : null;
          if (activeRow) return { found: true, result: `match:${tableName}/${teamColumn}/${identityColumn}`, row: activeRow };
        } catch (error) {
          errors.push(`${teamColumn}/${identityColumn}:${safeErrorMessage(error)}`);
          if (!shouldTreatLookupErrorAsNoMatch(error)) return { found: false, fatal: error, errors };
        }
      }
    }
  }
  return { found: false, errors, result: errors.length ? `0;errors=${errors.slice(0, 3).join("|")}` : "0" };
}

async function findLegacyPlayerProfileEvidence(env, { requester, teamId }) {
  for (const teamColumn of ["team_id", "teamId"]) {
    try {
      const rows = await selectRows(
        env,
        "legacy_auth_profiles",
        `select=email,name,role,${teamColumn}&email=eq.${encodeURIComponent(requester)}&${teamColumn}=eq.${encodeURIComponent(teamId)}&role=eq.player&limit=1`,
      );
      const profile = Array.isArray(rows) ? rows[0] : null;
      if (profile) return { ok: true, result: `match:legacy_auth_profiles/${teamColumn}`, profile };
    } catch (error) {
      if (!shouldTreatLookupErrorAsNoMatch(error)) return { ok: false, fatal: error, result: `error:legacy_auth_profiles/${teamColumn}` };
    }
  }
  return { ok: false, result: "0" };
}

async function authorizeHomeShotSave(env, { requester, resolvedUserUuid, teamId, legacyProfileFallback }, diagnostic) {
  const membershipTeamColumns = ["team_id", "teamId"];
  const membershipIdentityColumns = ["user_id", "userId", "email"];

  if (resolvedUserUuid) {
    diagnostic.uuid_membership_query_attempted = "yes";
    const byUuid = await findActiveRowByFlexibleColumns(env, {
      tableName: "team_memberships",
      teamColumns: membershipTeamColumns,
      identityColumns: membershipIdentityColumns,
      teamId,
      identities: [resolvedUserUuid],
      activeRowPredicate: isActiveRow,
    });
    if (byUuid.fatal) {
      diagnostic.uuid_membership_query_result = `error:${safeErrorMessage(byUuid.fatal)}`;
      return { ok: false, fatal: byUuid.fatal, error: "membership_uuid_query_failed", stage: "uuid_membership_lookup", message: "Failed to check uuid membership." };
    }
    diagnostic.uuid_membership_query_result = byUuid.result || (byUuid.found ? "match" : "0");
    if (byUuid.found) {
      diagnostic.authorized_by = "uuid";
      return { ok: true, authorizedBy: "uuid" };
    }
  } else {
    diagnostic.uuid_membership_query_result = "skipped_missing_resolved_uuid";
  }

  diagnostic.email_membership_query_attempted = "yes";
  const byEmail = await findActiveRowByFlexibleColumns(env, {
    tableName: "team_memberships",
    teamColumns: membershipTeamColumns,
    identityColumns: membershipIdentityColumns,
    teamId,
    identities: [requester],
    activeRowPredicate: isActiveRow,
  });
  if (byEmail.fatal) {
    diagnostic.email_membership_query_result = `error:${safeErrorMessage(byEmail.fatal)}`;
    return { ok: false, fatal: byEmail.fatal, error: "membership_email_query_failed", stage: "email_membership_lookup", message: "Failed to check email membership." };
  }
  diagnostic.email_membership_query_result = byEmail.result || (byEmail.found ? "match" : "0");
  if (byEmail.found) {
    diagnostic.authorized_by = "email";
    return { ok: true, authorizedBy: "email" };
  }

  diagnostic.player_record_query_attempted = "yes";
  const playerRecord = await findActiveRowByFlexibleColumns(env, {
    tableName: "players",
    teamColumns: ["team_id", "teamId"],
    identityColumns: ["email", "user_id", "userId", "player_id", "playerId", "id"],
    teamId,
    identities: [requester, resolvedUserUuid],
    activeRowPredicate: isActivePlayerRow,
  });
  if (playerRecord.fatal) {
    diagnostic.player_record_query_result = `error:${safeErrorMessage(playerRecord.fatal)}`;
    return { ok: false, fatal: playerRecord.fatal, error: "player_record_query_failed", stage: "player_record_lookup", message: "Failed to check player record." };
  }
  diagnostic.player_record_query_result = playerRecord.result || (playerRecord.found ? "match" : "0");
  if (playerRecord.found) {
    diagnostic.authorized_by = "player_record";
    return { ok: true, authorizedBy: "player_record" };
  }

  if (legacyProfileFallback?.verified) {
    diagnostic.legacy_profile_fallback_result = legacyProfileFallback.result || "verified";
    diagnostic.authorized_by = "legacy_profile";
    return { ok: true, authorizedBy: "legacy_profile" };
  }

  const legacy = await findLegacyPlayerProfileEvidence(env, { requester, teamId });
  diagnostic.legacy_profile_fallback_result = legacy.result || "0";
  if (legacy.ok) {
    diagnostic.authorized_by = "legacy_profile";
    return { ok: true, authorizedBy: "legacy_profile" };
  }
  if (legacy.fatal) return { ok: false, fatal: legacy.fatal, error: "legacy_profile_lookup_failed", stage: "legacy_profile_lookup", message: "Failed to check legacy profile." };

  return { ok: false, error: "missing_durable_team_binding", stage: "authorization", message: "No active membership or player record found." };
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

function dedupeCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (!candidate?.row) return false;
    const key = JSON.stringify(candidate.row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function withoutKeys(row, keys = []) {
  const next = { ...row };
  for (const key of keys) delete next[key];
  return next;
}

function buildShotLogInsertCandidates({ rowId, requester, resolvedUserUuid, teamId, name, made, date, ts }) {
  const legacyEmail = { email: requester, name, player_id: requester, team_id: teamId, made, date, ts };
  const legacyUuid = resolvedUserUuid ? { ...legacyEmail, player_id: resolvedUserUuid } : null;
  const modern = resolvedUserUuid ? {
    team_id: teamId,
    player_user_id: resolvedUserUuid,
    makes: made,
    attempts: null,
    logged_at: ts,
    metadata: {
      source: "home_shots",
      email: requester,
      name,
      player_id: requester,
      date,
      made,
    },
  } : null;

  const candidates = [
    { label: "legacy_email_no_client_id", row: legacyEmail, playerIdSource: "requester_email" },
    legacyUuid ? { label: "legacy_uuid_no_client_id", row: legacyUuid, playerIdSource: "resolved_uuid" } : null,
    modern ? { label: "modern_team_auth_no_client_id", row: modern, playerIdSource: "resolved_uuid_modern" } : null,
    { label: "legacy_email_no_ts", row: withoutKeys(legacyEmail, ["ts"]), playerIdSource: "requester_email" },
    legacyUuid ? { label: "legacy_uuid_no_ts", row: withoutKeys(legacyUuid, ["ts"]), playerIdSource: "resolved_uuid" } : null,
    modern ? { label: "modern_team_auth_no_attempts", row: withoutKeys(modern, ["attempts"]), playerIdSource: "resolved_uuid_modern" } : null,
    { label: "legacy_email_with_client_id", row: { id: rowId, ...legacyEmail }, playerIdSource: "requester_email" },
    legacyUuid ? { label: "legacy_uuid_with_client_id", row: { id: rowId, ...legacyUuid }, playerIdSource: "resolved_uuid" } : null,
  ];

  return dedupeCandidates(candidates.filter(Boolean));
}

async function bestEffortBumpHomeShotSummary(env, { teamId, requester, made, insertStrategy }) {
  if (!String(insertStrategy || "").startsWith("modern_team_auth")) return;
  try {
    const rows = await selectRows(
      env,
      "team_player_home_shot_totals",
      `select=team_id,player_id,total_home_shots&team_id=eq.${encodeURIComponent(teamId)}&player_id=eq.${encodeURIComponent(requester)}&limit=1`,
    );
    const current = Array.isArray(rows) && rows[0] ? Number(rows[0].total_home_shots || 0) : 0;
    await upsertRows(env, "team_player_home_shot_totals", {
      team_id: teamId,
      player_id: requester,
      total_home_shots: current + made,
      updated_at: new Date(Date.now()).toISOString(),
    }, "team_id,player_id");
  } catch (_error) {}
}

export async function onRequestPost({ request, env, data = {} }) {
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
    legacy_profile_fallback_result: "not_attempted",
    authorized_by: "none",
    shot_logs_insert_attempted: "no",
    shot_logs_insert_success: "no",
    shot_logs_insert_error: "none",
    shot_logs_insert_retry_without_client_id: "yes_default_no_client_id",
    shot_logs_insert_retry_with_alternate_player_id: "multi_shape",
    shot_logs_player_id_source: "requester_email",
    shot_logs_insert_strategy: "not_attempted",
    shot_logs_insert_attempts: "0",
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
  } catch (_error) {
    diagnostic.resolved_app_user_uuid_success = "no";
    diagnostic.resolved_uuid_present = "no";
  }

  const auth = await authorizeHomeShotSave(env, {
    requester,
    resolvedUserUuid,
    teamId,
    legacyProfileFallback: data.homeShotLegacyProfileFallback || null,
  }, diagnostic);

  if (auth.fatal) {
    return diagnosticError(auth.error, 500, auth.stage, auth.message, diagnostic);
  }

  if (!auth.ok) {
    return diagnosticError(
      "missing_durable_team_binding",
      403,
      "authorization",
      "Your player account is not durably linked to this team yet.",
      diagnostic,
      { repair_reason: auth.error || "missing_durable_binding" },
    );
  }

  const randomSuffix = Math.random().toString(36).slice(2, 10);
  const rowId = String(body.id || "").trim() || `shotlog_${Date.now()}_${randomSuffix}`;
  const ts = normalizeTimestamp(body.ts);
  const name = String(body.name || "").trim() || requester;
  const candidates = buildShotLogInsertCandidates({ rowId, requester, resolvedUserUuid, teamId, name, made, date, ts });
  const errors = [];

  diagnostic.shot_logs_insert_attempted = "yes";

  for (const candidate of candidates) {
    diagnostic.shot_logs_insert_attempts = String(Number(diagnostic.shot_logs_insert_attempts || 0) + 1);
    diagnostic.shot_logs_insert_strategy = candidate.label;
    diagnostic.shot_logs_player_id_source = candidate.playerIdSource;
    try {
      const inserted = await upsertRows(env, "shot_logs", candidate.row);
      diagnostic.shot_logs_insert_success = "yes";
      diagnostic.shot_logs_insert_error = "none";
      await bestEffortBumpHomeShotSummary(env, { teamId, requester, made, insertStrategy: candidate.label });
      const insertedRow = Array.isArray(inserted) ? inserted[0] || {} : {};
      const shotLog = {
        id: String(insertedRow.id ?? rowId),
        email: requester,
        name,
        player_id: requester,
        team_id: teamId,
        made,
        date,
        ts,
        server_shape: candidate.label,
      };
      return Response.json({ ok: true, shot_log: shotLog, diagnostic }, { status: 200 });
    } catch (error) {
      const detail = safePostgrestInsertError(error);
      errors.push(`${candidate.label}:${detail.status || "unknown"}:${detail.message}:${detail.details || detail.hint || ""}`.slice(0, 260));
      diagnostic.shot_logs_insert_error = safeErrorMessage(error);
      if (!isSchemaShapeError(error)) break;
    }
  }

  diagnostic.shot_logs_insert_success = "no";
  return diagnosticError("persist_failed", 500, "shot_logs_insert", "Failed to persist home shots log.", diagnostic, {
    shot_logs_insert_safe_error_code: "persist_failed",
    shot_logs_insert_safe_error_message: diagnostic.shot_logs_insert_error,
    shot_logs_insert_errors: errors.slice(0, 8),
  });
}
