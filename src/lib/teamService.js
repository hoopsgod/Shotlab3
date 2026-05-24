import { getBackendRuntime } from './backendConfig.js'

const TEAM_TABLE = 'teams'

const safeRows = (value) => (Array.isArray(value) ? value : [])

const normalizeCode = (value) => String(value || '').trim().toUpperCase()

export const generateTeamJoinCode = (seed = '') => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const source = `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  let out = ''
  for (let i = 0; i < 6; i += 1) {
    const idx = Math.floor(Math.random() * alphabet.length)
    out += alphabet[idx]
  }
  return out
}

export function createTeamService({ supabaseClient } = {}) {
  const runtime = getBackendRuntime()
  const configured = Boolean(supabaseClient?.isConfigured)

  const demoResult = (data, reason = runtime.demoFallback ? 'demo_mode' : 'supabase_unavailable') => ({ ok: true, data, mode: 'demo', reason })
  const safeCall = async (fn, fallback) => {
    if (!configured) return demoResult(fallback, 'missing_supabase_env')
    try {
      return await fn()
    } catch (error) {
      return demoResult(fallback, 'supabase_unavailable')
    }
  }

  return {
    runtime,
    async createTeam({ coachUser, name = 'Team' } = {}) {
      if (!coachUser?.id && !coachUser?.email) return demoResult(null, 'no_coach_session')
      return safeCall(async () => {
        const row = {
          name: String(name || 'Team').trim() || 'Team',
          ownerCoachId: String(coachUser.email || coachUser.id),
          joinCode: generateTeamJoinCode(String(coachUser.id || coachUser.email || 'coach')),
          joinCodeUpdatedAt: Date.now(),
          createdAt: Date.now(),
        }
        const res = await supabaseClient.from(TEAM_TABLE).upsert(row, { onConflict: 'id' })
        if (res?.error) return { ok: false, data: null, mode: 'supabase', error: res.error }
        const created = safeRows(res?.data)[0] || row
        return { ok: true, data: created, mode: 'supabase' }
      }, null)
    },
    async loadCoachTeams({ coachUser } = {}) {
      if (!coachUser?.id && !coachUser?.email) return demoResult([], 'no_coach_session')
      return safeCall(async () => {
        const res = await supabaseClient.from(TEAM_TABLE).select()
        if (res?.error) return { ok: false, data: [], mode: 'supabase', error: res.error }
        const owner = String(coachUser.email || coachUser.id)
        const teams = safeRows(res?.data).filter((team) => String(team?.ownerCoachId || '') === owner)
        return { ok: true, data: teams, mode: 'supabase' }
      }, [])
    },
    async generateJoinCode({ teamId, existingCodes = [] } = {}) {
      if (!teamId) return { ok: false, data: null, mode: configured ? 'supabase' : 'demo', error: { code: 'team_id_required' } }
      const used = new Set((Array.isArray(existingCodes) ? existingCodes : []).map(normalizeCode).filter(Boolean))
      let code = generateTeamJoinCode(String(teamId))
      let attempts = 0
      while (used.has(code) && attempts < 6) {
        attempts += 1
        code = generateTeamJoinCode(`${teamId}:${attempts}`)
      }
      return safeCall(async () => {
        const res = await supabaseClient.from(TEAM_TABLE).upsert({ id: teamId, joinCode: code, joinCodeUpdatedAt: Date.now() }, { onConflict: 'id' })
        if (res?.error) return { ok: false, data: null, mode: 'supabase', error: res.error }
        return { ok: true, data: { joinCode: code }, mode: 'supabase' }
      }, { joinCode: code })
    },
    async readActiveJoinCode({ teamId } = {}) {
      if (!teamId) return { ok: true, data: null, mode: configured ? 'supabase' : 'demo' }
      return safeCall(async () => {
        const res = await supabaseClient.from(TEAM_TABLE).select()
        if (res?.error) return { ok: false, data: null, mode: 'supabase', error: res.error }
        const team = safeRows(res?.data).find((item) => String(item?.id) === String(teamId))
        return { ok: true, data: normalizeCode(team?.joinCode) || null, mode: 'supabase' }
      }, null)
    },
  }
}
