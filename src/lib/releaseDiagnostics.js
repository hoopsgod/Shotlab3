const asText = (value) => String(value ?? '').trim()

export function isShotLabDebugMode(search = undefined) {
  const rawSearch = typeof search === 'string'
    ? search
    : typeof window !== 'undefined'
      ? window.location?.search || ''
      : ''
  const params = new URLSearchParams(rawSearch.startsWith('?') ? rawSearch : `?${rawSearch}`)
  return ['shotLabDebug', 'homeShotDebug', 'debug'].some((key) => {
    const value = asText(params.get(key)).toLowerCase()
    return value === '1' || value === 'true' || value === 'yes'
  })
}

export function buildReleaseDiagnosticPayload({
  event = 'release_diagnostic',
  shotLogSaveStatus = '',
  leaderboardRpcResultCount = null,
  fallbackLeaderboardResultCount = null,
  teamId = '',
  playerId = '',
  authenticatedUserEmail = '',
  extra = {},
} = {}) {
  return {
    event: asText(event) || 'release_diagnostic',
    shotLogSaveStatus: asText(shotLogSaveStatus),
    leaderboardRpcResultCount: Number.isFinite(Number(leaderboardRpcResultCount)) ? Number(leaderboardRpcResultCount) : null,
    fallbackLeaderboardResultCount: Number.isFinite(Number(fallbackLeaderboardResultCount)) ? Number(fallbackLeaderboardResultCount) : null,
    teamId: asText(teamId),
    playerId: asText(playerId),
    authenticatedUserEmail: asText(authenticatedUserEmail).toLowerCase(),
    ...extra,
  }
}

export function emitReleaseDiagnostic(details = {}, { debug = isShotLabDebugMode(), logger = console } = {}) {
  const payload = buildReleaseDiagnosticPayload(details)
  if (debug && typeof logger?.info === 'function') {
    logger.info('[shotlab-release-diagnostic]', payload)
  }
  return payload
}
