import { buildApiIdentityHeaders } from './apiIdentityHeaders.js';

const clean = (value) => String(value ?? '').trim();
const hasRowIdentity = (row = {}) => [row?.player_id, row?.playerId, row?.email, row?.player_email, row?.user_id, row?.userId, row?.profile_id, row?.profileId, row?.id]
  .some((value) => clean(value));

export const homeShotsLeaderboardFailureState = ({ status = 0, errorCode = '', parseMode = 'json' } = {}) => {
  const code = clean(errorCode).toLowerCase();
  if (status === 401 || code === 'unauthorized') return { status: 'permission', message: 'Sign in is required to view this team leaderboard.' };
  if (status === 403 || code === 'forbidden') return { status: 'permission', message: 'You do not have permission to view this team leaderboard.' };
  if (status === 404 || code === 'endpoint_missing') return { status: 'unavailable', message: 'The leaderboard service is unavailable right now. Try again later.' };
  if (code === 'team_id_required') return { status: 'missing_context', message: 'Choose a team before viewing its leaderboard.' };
  if (parseMode === 'non_json') return { status: 'unavailable', message: 'The leaderboard service returned an invalid response. Try again later.' };
  if (status >= 500 || code === 'internal_error') return { status: 'error', message: 'The leaderboard service could not load right now. Try again.' };
  if (code === 'rate_limited') return { status: 'error', message: 'Too many leaderboard requests. Try again shortly.' };
  if (code === 'invalid_scope') return { status: 'error', message: 'This leaderboard view is unavailable. Try again.' };
  return { status: 'error', message: 'We could not refresh these rankings. Try again.' };
};

export async function loadHomeShotsLeaderboard({
  teamId,
  scope = 'players',
  userEmail,
  limit = 10,
  fetchImpl = globalThis.fetch,
} = {}) {
  const normalizedTeamId = clean(teamId);
  const normalizedUserEmail = clean(userEmail).toLowerCase();
  if (!normalizedTeamId) {
    const failure = homeShotsLeaderboardFailureState({ errorCode: 'team_id_required' });
    return { ok: false, rows: [], errorCode: 'team_id_required', httpStatus: null, ...failure };
  }
  if (!normalizedUserEmail) {
    const failure = homeShotsLeaderboardFailureState({ errorCode: 'unauthorized' });
    return { ok: false, rows: [], errorCode: 'unauthorized', httpStatus: null, ...failure };
  }
  if (typeof fetchImpl !== 'function') {
    const failure = homeShotsLeaderboardFailureState({ errorCode: 'endpoint_missing' });
    return { ok: false, rows: [], errorCode: 'endpoint_missing', httpStatus: null, ...failure };
  }
  const url = `/v1/leaderboards/home-shots?team_id=${encodeURIComponent(normalizedTeamId)}&limit=${Math.max(1, Math.min(10, Number(limit) || 10))}&scope=${encodeURIComponent(scope)}`;
  try {
    const response = await fetchImpl(url, { headers: buildApiIdentityHeaders({ requester: normalizedUserEmail }) });
    const contentType = String(response?.headers?.get?.('content-type') || '').toLowerCase();
    let body = {};
    let parseMode = 'json';
    if (contentType.includes('application/json')) body = await response.json().catch(() => { parseMode = 'invalid_json'; return {}; });
    else {
      parseMode = 'non_json';
      await response?.text?.().catch(() => '');
    }
    if (!response?.ok) {
      const errorCode = clean(body?.error) || parseMode;
      return {
        ok: false,
        rows: [],
        httpStatus: Number(response?.status) || null,
        errorCode,
        diagnostics: body?.diagnostics || null,
        ...homeShotsLeaderboardFailureState({ status: response?.status, errorCode, parseMode }),
      };
    }
    const rows = Array.isArray(body?.leaderboard) ? body.leaderboard : [];
    if (rows.some((row) => !row || typeof row !== 'object' || !hasRowIdentity(row))) {
      return {
        ok: false,
        rows: [],
        httpStatus: Number(response?.status) || 200,
        errorCode: 'invalid_leaderboard_rows',
        diagnostics: body?.diagnostics || null,
        ...homeShotsLeaderboardFailureState({ errorCode: 'endpoint_missing', parseMode: 'invalid_rows' }),
      };
    }
    return {
      ok: true,
      status: 'success',
      rows,
      httpStatus: Number(response?.status) || 200,
      errorCode: '',
      diagnostics: body?.diagnostics || null,
      url,
    };
  } catch {
    return {
      ok: false,
      rows: [],
      httpStatus: null,
      errorCode: 'network_error',
      ...homeShotsLeaderboardFailureState({ errorCode: 'network_error' }),
    };
  }
}
