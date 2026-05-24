import { supabase } from './supabase.js'

const STORAGE_KEY = 'sl:player-identity-membership'

const safeRows = (value) => (Array.isArray(value) ? value : [])

const safeParse = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const safeStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

const normalizeMembership = (membership, team = null) => {
  if (!membership) return null
  const status = String(membership?.status || '').toLowerCase()
  if (status === 'disabled') return null
  const teamId = String(membership?.team_id || membership?.teamId || '').trim()
  if (!teamId) return null
  return {
    team_id: teamId,
    role: String(membership?.role || 'player'),
    status: status || 'active',
    team_name: team?.name || membership?.team_name || membership?.teamName || null,
  }
}

const normalizeIdentity = (user) => {
  if (!user) return null
  const playerId = String(user?.id || user?.email || '').trim()
  if (!playerId) return null
  return { player_id: playerId, email: user?.email || null }
}

const buildEmpty = (reason = 'unavailable') => ({
  ok: true,
  mode: 'demo',
  reason,
  data: { identity: null, membership: null },
})

export function createPlayerIdentityMembershipHydrationService({ supabaseClient = supabase, storageKey = STORAGE_KEY } = {}) {
  const configured = Boolean(supabaseClient?.isConfigured)

  const loadStored = () => {
    const storage = safeStorage()
    if (!storage) return null
    return safeParse(storage.getItem(storageKey))
  }

  const persist = (value) => {
    const storage = safeStorage()
    if (!storage) return
    try {
      storage.setItem(storageKey, JSON.stringify(value))
    } catch {
      return
    }
  }

  const clearStored = () => {
    const storage = safeStorage()
    if (!storage) return
    try {
      storage.removeItem(storageKey)
    } catch {
      return
    }
  }

  const loadIdentity = async () => {
    if (!configured) return null
    const session = await supabaseClient?.auth?.getSession?.().catch(() => ({ data: { session: null } }))
    return normalizeIdentity(session?.data?.session?.user || null)
  }

  const loadMembership = async (identity) => {
    if (!configured || !identity?.player_id) return null
    const membershipRes = await supabaseClient.from('team_members').select().catch(() => ({ data: null, error: new Error('membership_load_failed') }))
    if (membershipRes?.error) return null
    const membershipRow = safeRows(membershipRes?.data).find((row) => String(row?.user_id || row?.userId || '') === identity.player_id) || null
    if (!membershipRow) return null
    const teamId = String(membershipRow?.team_id || membershipRow?.teamId || '').trim()
    if (!teamId) return null
    const teamRes = await supabaseClient.from('teams').select().catch(() => ({ data: null, error: new Error('team_lookup_failed') }))
    const teamRow = teamRes?.error ? null : safeRows(teamRes?.data).find((row) => String(row?.id || '') === teamId) || null
    return normalizeMembership(membershipRow, teamRow)
  }

  const hydrate = async () => {
    if (!configured) return buildEmpty('missing_supabase_env')
    try {
      const identity = await loadIdentity()
      if (!identity) {
        clearStored()
        return buildEmpty('no_authenticated_player')
      }
      const membership = await loadMembership(identity)
      const data = { identity, membership }
      persist(data)
      return { ok: true, mode: 'supabase', reason: membership ? 'hydrated' : 'membership_missing', data }
    } catch {
      return buildEmpty('hydrate_failed')
    }
  }

  const restore = async () => {
    const hydrated = await hydrate()
    if (hydrated.mode === 'supabase') return hydrated
    const stored = loadStored()
    if (!stored?.identity?.player_id) return hydrated
    const normalized = {
      identity: { player_id: String(stored.identity.player_id), email: stored.identity.email || null },
      membership: normalizeMembership(stored.membership || null),
    }
    return { ok: true, mode: 'demo', reason: 'restored_from_storage', data: normalized }
  }

  return {
    loadCurrentPlayerIdentity: loadIdentity,
    loadCurrentTeamMembership: async () => {
      const identity = await loadIdentity()
      if (!identity) return null
      return loadMembership(identity)
    },
    hydrate,
    restoreMembershipContext: restore,
    clearStoredContext: clearStored,
  }
}

