const asText = (value) => String(value ?? '').trim();
const normalizeEmail = (value) => asText(value).toLowerCase();

export const HOME_SHOT_VALIDATION_MESSAGE = 'Enter at least 1 made shot before logging.';
export const HOME_SHOT_SYNC_ERROR_MESSAGE = 'Could not save home shots to team dashboard. Please try again.';

export function parsePositiveInteger(value) {
  const raw = String(value ?? '').trim();
  if (!/^[0-9]+$/.test(raw)) return null;
  const numericValue = Number(raw);
  if (!Number.isInteger(numericValue) || !Number.isSafeInteger(numericValue) || numericValue <= 0) return null;
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


export function resolveHomeShotRetryFailure({ quietFallback = false, errorCode = 'sync_failed' } = {}) {
  const syncState = quietFallback ? 'local_pending' : 'failed_sync';
  return {
    ok: false,
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
