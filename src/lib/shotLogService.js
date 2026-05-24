import { getBackendRuntime } from './backendConfig.js'

const SHOT_LOGS_TABLE = 'shot_logs'

const safeRows = (value) => (Array.isArray(value) ? value : [])

const toNumberOrNull = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const asText = (value) => String(value ?? '').trim()

const toDemo = (data, reason, extra = {}) => ({ ok: true, data, mode: 'demo', reason, ...extra })

const normalizeShotLogForDb = (row = {}) => {
  const playerId = asText(row.player_id || row.playerId)
  const teamId = asText(row.team_id || row.teamId)
  if (!playerId || !teamId) return null

  const made = toNumberOrNull(row.made)
  const attempted = toNumberOrNull(row.attempted_shots ?? row.attemptedShots ?? row.total_reps ?? row.totalReps)

  const payload = {
    player_id: playerId,
    team_id: teamId,
    drill_id: asText(row.drill_id || row.drillId) || undefined,
    session_id: asText(row.session_id || row.sessionId) || undefined,
    made: made ?? 0,
    attempted_shots: attempted ?? undefined,
    date: asText(row.date) || undefined,
    created_at: row.created_at || new Date().toISOString(),
    email: asText(row.email).toLowerCase() || undefined,
    name: asText(row.name) || undefined,
  }

  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ''))
}

export function summarizeShotTotals(logs = []) {
  const rows = safeRows(logs)
  return rows.reduce((acc, row) => {
    acc.made += toNumberOrNull(row?.made) || 0
    acc.attempted += toNumberOrNull(row?.attempted_shots ?? row?.attemptedShots ?? row?.total_reps ?? row?.totalReps) || 0
    acc.count += 1
    return acc
  }, { made: 0, attempted: 0, count: 0 })
}

export function createShotLogService({ supabaseClient } = {}) {
  const runtime = getBackendRuntime()
  const configured = Boolean(supabaseClient?.isConfigured)

  const safeCall = async (fn, fallbackData, reason = 'supabase_unavailable') => {
    if (!configured) return toDemo(fallbackData, 'missing_supabase_env')
    try {
      return await fn()
    } catch {
      return toDemo(fallbackData, reason)
    }
  }

  return {
    runtime,
    async createShotLog({ shotLog, player, team } = {}) {
      const payload = normalizeShotLogForDb({ ...(shotLog || {}), player_id: player?.id || player?.email || shotLog?.player_id || shotLog?.playerId, team_id: team?.id || shotLog?.team_id || shotLog?.teamId, email: player?.email || shotLog?.email, name: player?.name || shotLog?.name })
      if (!payload) return toDemo(null, 'missing_player_or_team_context', { skipped: true })
      return safeCall(async () => {
        const res = await supabaseClient.from(SHOT_LOGS_TABLE).upsert(payload)
        if (res?.error) return toDemo(payload, 'backend_save_failed', { skipped: false })
        return { ok: true, data: safeRows(res?.data)[0] || payload, mode: 'supabase' }
      }, payload, 'backend_save_failed')
    },
    async loadPlayerShotLogs({ playerId, teamId } = {}) {
      if (!asText(playerId) || !asText(teamId)) return toDemo([], 'missing_player_or_team_context')
      return safeCall(async () => {
        const res = await supabaseClient.from(SHOT_LOGS_TABLE).select()
        if (res?.error) return toDemo([], 'backend_load_failed')
        const rows = safeRows(res?.data).filter((r) => asText(r?.player_id || r?.playerId) === asText(playerId) && asText(r?.team_id || r?.teamId) === asText(teamId))
        return { ok: true, data: rows, mode: 'supabase' }
      }, [], 'backend_load_failed')
    },
    async loadTeamShotLogs({ teamId } = {}) {
      if (!asText(teamId)) return toDemo([], 'missing_team_context')
      return safeCall(async () => {
        const res = await supabaseClient.from(SHOT_LOGS_TABLE).select()
        if (res?.error) return toDemo([], 'backend_load_failed')
        const rows = safeRows(res?.data).filter((r) => asText(r?.team_id || r?.teamId) === asText(teamId))
        return { ok: true, data: rows, mode: 'supabase' }
      }, [], 'backend_load_failed')
    },
    async summarizePlayerShotTotals({ playerId, teamId } = {}) {
      const loaded = await this.loadPlayerShotLogs({ playerId, teamId })
      return { ...loaded, data: summarizeShotTotals(loaded?.data || []) }
    },
    async summarizeTeamShotTotals({ teamId } = {}) {
      const loaded = await this.loadTeamShotLogs({ teamId })
      return { ...loaded, data: summarizeShotTotals(loaded?.data || []) }
    },
  }
}
