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

export async function loadParticipationLeaderboards({
  teamId,
  userEmail,
  fetchImpl = globalThis.fetch,
} = {}) {
  const normalizedTeamId = clean(teamId);
  if (!normalizedTeamId || typeof fetchImpl !== "function") {
    return { ok: false, error: "missing_context", leaderboards: null };
  }
  try {
    const response = await fetchImpl(`/v1/leaderboards/participation?team_id=${encodeURIComponent(normalizedTeamId)}`, {
      headers: normalizeIdentity(userEmail) ? { "x-user-id": normalizeIdentity(userEmail) } : {},
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.ok !== true) {
      return { ok: false, error: clean(body?.error) || "load_failed", leaderboards: null };
    }
    if (body?.storage_mode === "demo_local" || !body?.leaderboards) {
      return { ok: true, mode: "demo_local", leaderboards: null };
    }
    return {
      ok: true,
      mode: clean(body?.storage_mode) || "signed_api",
      leaderboards: {
        event_participation: normalizeScope(body.leaderboards.event_participation),
        strength_conditioning_participation: normalizeScope(body.leaderboards.strength_conditioning_participation),
      },
    };
  } catch {
    return { ok: false, error: "network_error", leaderboards: null };
  }
}
