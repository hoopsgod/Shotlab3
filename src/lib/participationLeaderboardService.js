const clean = (value) => String(value ?? "").trim();
const normalizeIdentity = (value) => clean(value).toLowerCase();

const normalizeRow = (row = {}) => ({
  rank: Number(row?.rank) || 0,
  playerId: clean(row?.player_id || row?.playerId),
  player_id: clean(row?.player_id || row?.playerId),
  player_display_name: clean(row?.player_display_name || row?.displayName || row?.name) || "Player",
  displayName: clean(row?.player_display_name || row?.displayName || row?.name) || "Player",
  total: Number(row?.total) || 0,
  metricValue: Number(row?.total) || 0,
  metric: clean(row?.metric),
  timeScope: clean(row?.time_scope || row?.timeScope),
  isCurrentUser: row?.is_current_user === true || row?.isCurrentUser === true,
});

const normalizeScope = (scope = {}) => ({
  current: Array.isArray(scope?.current) ? scope.current.map(normalizeRow).filter((row) => row.rank > 0) : [],
  all_time: Array.isArray(scope?.all_time) ? scope.all_time.map(normalizeRow).filter((row) => row.rank > 0) : [],
});

const failureForResponse = (status = 0, error = '') => {
  const code = normalizeIdentity(error);
  if (status === 401 || code === 'unauthorized') return { status: 'permission', error: 'Sign in is required to view participation rankings.' };
  if (status === 403 || code === 'forbidden') return { status: 'permission', error: 'You do not have permission to view these participation rankings.' };
  if (status === 404 || code === 'not_found') return { status: 'unavailable', error: 'Participation rankings are not available for this team yet.' };
  if (code === 'team_id_required') return { status: 'missing_context', error: 'Choose a team before viewing participation rankings.' };
  return { status: 'error', error: code === 'network_error' ? 'We could not refresh participation rankings. Try again.' : 'Participation rankings could not load. Try again.' };
};

export async function loadParticipationLeaderboards({
  teamId,
  userEmail,
  fetchImpl = globalThis.fetch,
} = {}) {
  const normalizedTeamId = clean(teamId);
  if (!normalizedTeamId) {
    return { ok: false, leaderboards: null, ...failureForResponse(0, 'team_id_required') };
  }
  if (!normalizeIdentity(userEmail)) return { ok: false, leaderboards: null, ...failureForResponse(401, 'unauthorized') };
  if (typeof fetchImpl !== "function") return { ok: false, leaderboards: null, ...failureForResponse(404, 'not_found') };
  try {
    const response = await fetchImpl(`/v1/leaderboards/participation?team_id=${encodeURIComponent(normalizedTeamId)}`, {
      headers: buildApiIdentityHeaders({ requester: normalizeIdentity(userEmail) }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.ok !== true) {
      const error = clean(body?.error) || "load_failed";
      return { ok: false, leaderboards: null, httpStatus: response?.status || null, errorCode: error, ...failureForResponse(response?.status, error) };
    }
    if (body?.storage_mode === "demo_local" || !body?.leaderboards) {
      return { ok: true, status: "success", mode: "demo_local", leaderboards: null };
    }
    return {
      ok: true,
      status: 'success',
      mode: clean(body?.storage_mode) || "signed_api",
      leaderboards: {
        event_participation: normalizeScope(body.leaderboards.event_participation),
        strength_conditioning_participation: normalizeScope(body.leaderboards.strength_conditioning_participation),
      },
    };
  } catch {
    return { ok: false, leaderboards: null, errorCode: 'network_error', ...failureForResponse(0, 'network_error') };
  }
}
import { buildApiIdentityHeaders } from './apiIdentityHeaders.js';
