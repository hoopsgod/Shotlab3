const asText = (value) => String(value ?? '').trim();
const normalizeEmail = (value) => asText(value).toLowerCase();

export const HOME_SHOT_MAX_MADE = 10000;
export const HOME_SHOT_VALIDATION_MESSAGE = 'Enter a whole number from 1 to 10,000 before logging shots.';
export const HOME_SHOT_SYNC_ERROR_MESSAGE = 'Could not save home shots to team dashboard. Please try again.';

export function parsePositiveInteger(value) {
  const raw = String(value ?? '').trim();
  if (!/^[0-9]+$/.test(raw)) return null;
  const numericValue = Number(raw);
  if (!Number.isInteger(numericValue) || !Number.isSafeInteger(numericValue) || numericValue <= 0 || numericValue > HOME_SHOT_MAX_MADE) return null;
  return numericValue;
}

export function validateHomeShotLogInput({ made, date } = {}) {
  const numericMade = parsePositiveInteger(made);
  if (numericMade == null) {
    return { ok: false, error: HOME_SHOT_VALIDATION_MESSAGE };
  }
  if (!asText(date)) {
    return { ok: false, error: 'Choose a date before logging shots.' };
  }
  return { ok: true, made: numericMade, date: asText(date) };
}

export function buildLocalHomeShotLog({ id, user, made, date, ts = Date.now() } = {}) {
  const email = normalizeEmail(user?.email);
  const teamId = asText(user?.teamId);
  if (!email || !teamId) return null;
  return {
    id: asText(id),
    email,
    playerId: email,
    teamId,
    name: asText(user?.name) || email,
    made: Number(made) || 0,
    date: asText(date),
    ts,
    syncState: 'syncing',
    syncSource: 'local',
  };
}

export function normalizeSavedHomeShotLog(saved = {}, fallback = {}) {
  return {
    id: asText(saved.id) || fallback.id,
    email: normalizeEmail(saved.email || fallback.email),
    playerId: normalizeEmail(saved.player_id || saved.playerId || fallback.playerId || fallback.email),
    teamId: asText(saved.team_id || saved.teamId || fallback.teamId),
    name: asText(saved.name || fallback.name),
    made: Number(saved.made ?? fallback.made) || 0,
    date: asText(saved.date || fallback.date),
    ts: Number.isFinite(Number(saved.ts)) ? Number(saved.ts) : fallback.ts,
    syncState: 'remote_saved',
    syncSource: 'remote',
    syncError: '',
  };
}

export function shouldUseQuietHomeShotFallback({ status, errorCode, message, isOffline = false } = {}) {
  const normalizedCode = asText(errorCode).toLowerCase();
  const normalizedMessage = asText(message).toLowerCase();
  const numericStatus = Number(status || 0);

  if (isOffline) return true;
  if (!numericStatus) return true;
  if (numericStatus >= 400) return true;

  const recoverableCodes = new Set([
    'network_error',
    'sync_failed',
    'persist_failed',
    'home_shot_log_failed',
    'forbidden',
    'missing_durable_team_binding',
    'shot_logs_insert_failed',
    'membership_uuid_query_failed',
    'membership_email_query_failed',
    'player_record_query_failed',
    'legacy_profile_lookup_failed',
  ]);

  if (recoverableCodes.has(normalizedCode)) return true;
  if (normalizedMessage.includes('no active membership')) return true;
  if (normalizedMessage.includes('missing durable membership')) return true;
  if (normalizedMessage.includes('not durably linked')) return true;
  return false;
}

export function extractHomeShotSyncDiagnostic(error) {
  const diagnostic = error?.body?.diagnostic || {};
  const pick = (key) => asText(diagnostic?.[key]);
  return {
    status: Number(error?.status || diagnostic?.status || 0) || null,
    error: asText(error?.body?.error || error?.message || 'sync_failed') || 'sync_failed',
    stage: pick('stage'),
    message: pick('message'),
    authorized_by: pick('authorized_by'),
    uuid_membership_query_result: pick('uuid_membership_query_result'),
    email_membership_query_result: pick('email_membership_query_result'),
    player_record_query_result: pick('player_record_query_result'),
    team_binding_repair_attempted: pick('team_binding_repair_attempted'),
    team_binding_repair_account_probe: pick('team_binding_repair_account_probe'),
    team_binding_repair_players_result: pick('team_binding_repair_players_result'),
    team_binding_repair_memberships_result: pick('team_binding_repair_memberships_result'),
    team_binding_repair_result: pick('team_binding_repair_result'),
  };
}

export function formatHomeShotSyncIssueMessage({ errorCode, diagnosticMessage } = {}) {
  const normalizedCode = asText(errorCode).toLowerCase();
  if (normalizedCode === 'missing_durable_team_binding' || normalizedCode === 'forbidden') {
    return 'Your player account is not durably linked to this team yet.';
  }
  return asText(diagnosticMessage) || HOME_SHOT_SYNC_ERROR_MESSAGE;
}

export function normalizeHomeShotRemoteException(error) {
  if (error?.status || error?.body) return error;
  const normalized = new Error('network_error');
  normalized.cause = error;
  return normalized;
}

export function resolveHomeShotSaveFailure({ error, quietContext = {}, debug = false } = {}) {
  const normalizedError = normalizeHomeShotRemoteException(error);
  const errorCode = asText(normalizedError?.body?.error || normalizedError?.message || 'sync_failed') || 'sync_failed';
  const diagnosticMessage = asText(normalizedError?.body?.diagnostic?.message);
  const diagnostic = extractHomeShotSyncDiagnostic(normalizedError);
  const quietFallback = shouldUseQuietHomeShotFallback({
    status: normalizedError?.status,
    errorCode,
    message: diagnosticMessage,
    ...quietContext,
  });
  const syncState = quietFallback ? 'local_pending' : 'failed_sync';
  const baseError = HOME_SHOT_SYNC_ERROR_MESSAGE;
  return {
    ok: quietFallback,
    mode: syncState,
    syncState,
    error: errorCode,
    errorCode,
    diagnosticMessage,
    diagnostic,
    issueMessage: formatHomeShotSyncIssueMessage({ errorCode, diagnosticMessage }),
    quietFallback,
    status: normalizedError?.status || null,
    statSyncError: quietFallback ? '' : debug ? `${baseError} Error: ${errorCode}` : baseError,
  };
}

export function resolveHomeShotRetryFailure({ quietFallback = false, errorCode = 'sync_failed' } = {}) {
  const syncState = quietFallback ? 'local_pending' : 'failed_sync';
  return {
    ok: Boolean(quietFallback),
    mode: syncState,
    syncState,
    error: asText(errorCode) || 'sync_failed',
    statSyncError: quietFallback ? '' : HOME_SHOT_SYNC_ERROR_MESSAGE,
  };
}

export function upsertHomeShotsLeaderboardRow(rows = [], { user, made, limit = 10 } = {}) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const email = normalizeEmail(user?.email);
  const displayName = asText(user?.name) || email || 'Player';
  const madeCount = Number(made) || 0;
  const nextRows = sourceRows.map((row) => ({ ...row }));
  const existingIndex = nextRows.findIndex((row) => {
    const rowEmail = normalizeEmail(row?.email || row?.player_email || row?.player_id || row?.playerId);
    if (email && rowEmail) return rowEmail === email;
    return asText(row?.player_display_name).toLowerCase() === displayName.toLowerCase();
  });

  if (existingIndex >= 0) {
    nextRows[existingIndex].email = nextRows[existingIndex].email || email;
    nextRows[existingIndex].player_display_name = nextRows[existingIndex].player_display_name || displayName;
    nextRows[existingIndex].total_home_shots = (Number(nextRows[existingIndex].total_home_shots) || 0) + madeCount;
  } else {
    nextRows.push({ email, player_display_name: displayName, total_home_shots: madeCount });
  }

  return nextRows
    .sort((a, b) => (Number(b.total_home_shots) || 0) - (Number(a.total_home_shots) || 0) || asText(a.player_display_name).localeCompare(asText(b.player_display_name)))
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
