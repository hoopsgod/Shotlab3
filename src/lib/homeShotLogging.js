const asText = (value) => String(value ?? '').trim();
const normalizeEmail = (value) => asText(value).toLowerCase();

export const HOME_SHOT_MAX_MADE = 10000;
export const HOME_SHOT_VALIDATION_MESSAGE = 'Enter a whole number from 1 to 10,000 before logging shots.';
export const HOME_SHOT_SYNC_ERROR_MESSAGE = 'Could not save home shots to team dashboard. Please try again.';
export const HOME_SHOT_LOCAL_ONLY_MESSAGE = 'Demo shots are saved locally only.';
export const HOME_SHOT_SYNC_DIAGNOSTIC_CODES = new Set([
  'missing_user_identity',
  'identity_mismatch',
  'forbidden',
  'membership_uuid_query_failed',
  'persist_failed',
  'network_error',
]);

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

export function isDemoLocalHomeShotUser(user = {}) {
  const email = normalizeEmail(user?.email);
  const teamId = asText(user?.teamId || user?.team_id).toLowerCase();
  return Boolean(
    user?.isDemo ||
    user?.demo ||
    user?.localOnly ||
    email === 'demo@shotlab.app' ||
    email.endsWith('@demo.shotlab.app') ||
    teamId === 'demo-team' ||
    teamId.startsWith('team-demo') ||
    teamId === 'local-team' ||
    teamId.startsWith('team-local')
  );
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
    syncState: 'local_pending',
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

export function shouldUseQuietHomeShotFallback({ status, errorCode, message, isExplicitDemoOrLocal = false, isOffline = false, isMembershipPending = false } = {}) {
  const normalizedCode = asText(errorCode).toLowerCase();
  const normalizedMessage = asText(message).toLowerCase();
  const explicitLocalOnlyCodes = new Set([
    'missing_user_identity',
    'team_id_required',
    'player_identity_required',
    'identity_mismatch',
    'unauthorized',
    'not_found',
  ]);
  if (isOffline || normalizedCode === 'network_error') return true;
  if (isExplicitDemoOrLocal && explicitLocalOnlyCodes.has(normalizedCode)) return true;
  if (isExplicitDemoOrLocal && [401, 404].includes(Number(status))) return true;
  const membershipMissing = normalizedCode === 'forbidden' || normalizedMessage.includes('no active membership') || normalizedMessage.includes('missing durable membership');
  if (membershipMissing) return Boolean(isExplicitDemoOrLocal || isMembershipPending);
  return false;
}



export function normalizeHomeShotRemoteException(error) {
  if (error?.status || error?.body) return error;
  const normalized = new Error('network_error');
  normalized.cause = error;
  return normalized;
}


export function formatHomeShotSyncDiagnostic(errorCode) {
  const code = asText(errorCode) || 'sync_failed';
  return `${HOME_SHOT_SYNC_ERROR_MESSAGE} Sync error: ${code}`;
}

export function resolveHomeShotSaveFailure({ error, quietContext = {}, debug = false } = {}) {
  const normalizedError = normalizeHomeShotRemoteException(error);
  const errorCode = asText(normalizedError?.body?.error || normalizedError?.message || 'sync_failed') || 'sync_failed';
  const diagnosticMessage = asText(normalizedError?.body?.diagnostic?.message);
  const quietFallback = shouldUseQuietHomeShotFallback({
    status: normalizedError?.status,
    errorCode,
    message: diagnosticMessage,
    ...quietContext,
  });
  const localOnlyFallback = quietFallback && Boolean(quietContext?.isExplicitDemoOrLocal);
  const syncState = localOnlyFallback ? 'local_only' : quietFallback ? 'local_pending' : 'failed_sync';
  return {
    ok: quietFallback,
    mode: syncState,
    syncState,
    error: errorCode,
    errorCode,
    diagnosticMessage,
    quietFallback,
    status: normalizedError?.status || null,
    statSyncError: quietFallback ? '' : formatHomeShotSyncDiagnostic(errorCode),
  };
}

export function resolveHomeShotRetryFailure({ quietFallback = false, errorCode = 'sync_failed' } = {}) {
  const syncState = quietFallback ? 'local_pending' : 'failed_sync';
  return {
    ok: false,
    mode: syncState,
    syncState,
    error: asText(errorCode) || 'sync_failed',
    statSyncError: quietFallback ? '' : formatHomeShotSyncDiagnostic(errorCode),
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
