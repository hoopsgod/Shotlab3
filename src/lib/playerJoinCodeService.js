import { getBackendRuntime } from './backendConfig.js'

const TEAM_TABLE = 'teams'
const TEAM_MEMBERS_TABLE = 'team_members'

const normalizeJoinCode = (value) => String(value || '').trim().toUpperCase()
const safeRows = (value) => (Array.isArray(value) ? value : [])

const buildDemoResult = (data, reason) => ({ ok: true, data, mode: 'demo', reason })

const getTeamJoinCode = (team) => team?.joinCode || team?.join_code || ''

const isCodeExpired = (team) => {
  const raw = team?.joinCodeExpiresAt ?? team?.join_code_expires_at
  if (raw == null) return false
  const expiresAt = Number(raw)
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return false
  return Date.now() > expiresAt
}

export function createPlayerJoinCodeService({ supabaseClient } = {}) {
  const runtime = getBackendRuntime()
  const configured = Boolean(supabaseClient?.isConfigured)

  const safeCall = async (operation, fallbackData, fallbackReason = 'supabase_unavailable') => {
    if (!configured) return buildDemoResult(fallbackData, 'missing_supabase_env')
    try {
      return await operation()
    } catch {
      return buildDemoResult(fallbackData, fallbackReason)
    }
  }

  return {
    runtime,
    normalizeJoinCode,
    async validateJoinCode({ joinCode } = {}) {
      const normalizedCode = normalizeJoinCode(joinCode)
      if (!normalizedCode) return { ok: false, data: null, mode: configured ? 'supabase' : 'demo', error: { code: 'join_code_required', message: 'Enter a team join code.' } }
      const lookup = await this.findTeamByJoinCode({ joinCode: normalizedCode })
      if (!lookup.ok) return lookup
      return { ok: true, data: { joinCode: normalizedCode, team: lookup.data }, mode: lookup.mode }
    },
    async findTeamByJoinCode({ joinCode } = {}) {
      const normalizedCode = normalizeJoinCode(joinCode)
      if (!normalizedCode) return { ok: false, data: null, mode: configured ? 'supabase' : 'demo', error: { code: 'join_code_required', message: 'Enter a valid code.' } }
      return safeCall(async () => {
        const res = await supabaseClient.from(TEAM_TABLE).select()
        if (res?.error) return { ok: false, data: null, mode: 'supabase', error: { code: 'team_lookup_failed', message: 'Unable to validate this code right now.' } }
        const team = safeRows(res?.data).find((item) => normalizeJoinCode(getTeamJoinCode(item)) === normalizedCode)
        if (!team) return { ok: false, data: null, mode: 'supabase', error: { code: 'invalid_join_code', message: 'That join code is invalid. Check with your coach.' } }
        if (isCodeExpired(team)) return { ok: false, data: null, mode: 'supabase', error: { code: 'expired_join_code', message: 'This join code has expired. Ask your coach for a new code.' } }
        return { ok: true, data: team, mode: 'supabase' }
      }, null)
    },
    async createTeamMembership({ teamId, playerUser } = {}) {
      if (!teamId) return { ok: false, data: null, mode: configured ? 'supabase' : 'demo', error: { code: 'team_id_required', message: 'Team is required.' } }
      if (!playerUser?.id && !playerUser?.email) return buildDemoResult(null, 'no_authenticated_player')
      return safeCall(async () => {
        const row = {
          team_id: String(teamId),
          user_id: String(playerUser.id || playerUser.email),
          role: 'player',
          status: 'active',
          joined_at: Date.now(),
        }
        const res = await supabaseClient.from(TEAM_MEMBERS_TABLE).upsert(row, { onConflict: 'team_id,user_id' })
        if (res?.error) return { ok: false, data: null, mode: 'supabase', error: { code: 'membership_create_failed', message: 'Could not join this team right now.' } }
        return { ok: true, data: safeRows(res?.data)[0] || row, mode: 'supabase' }
      }, null)
    },
    async loadPlayerMembership({ playerUser } = {}) {
      if (!playerUser?.id && !playerUser?.email) return buildDemoResult(null, 'no_authenticated_player')
      return safeCall(async () => {
        const res = await supabaseClient.from(TEAM_MEMBERS_TABLE).select()
        if (res?.error) return { ok: false, data: null, mode: 'supabase', error: { code: 'membership_load_failed', message: 'Unable to load team membership.' } }
        const userId = String(playerUser.id || playerUser.email)
        const membership = safeRows(res?.data).find((row) => {
          const rowUser = String(row?.user_id || row?.userId || '')
          const status = String(row?.status || 'active')
          return rowUser === userId && status !== 'disabled'
        }) || null
        return { ok: true, data: membership, mode: 'supabase' }
      }, null)
    },
    async joinTeamForPlayer({ joinCode, playerUser } = {}) {
      const validated = await this.validateJoinCode({ joinCode })
      if (!validated.ok) return validated
      const team = validated?.data?.team
      const existing = await this.loadPlayerMembership({ playerUser })
      if (existing.ok && existing.data && String(existing.data.team_id || existing.data.teamId) === String(team?.id)) return { ok: true, data: { team, membership: existing.data }, mode: existing.mode }
      const created = await this.createTeamMembership({ teamId: team?.id, playerUser })
      if (!created.ok) return created
      return { ok: true, data: { team, membership: created.data }, mode: created.mode }
    },
  }
}
