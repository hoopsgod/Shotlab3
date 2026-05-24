import { supabase } from './supabase.js'
import { createPlayerJoinCodeService } from './playerJoinCodeService.js'

const service = createPlayerJoinCodeService({ supabaseClient: supabase })
const DEMO_SAFE_MEMBERSHIP_RESULT = { ok: true, data: null, mode: 'demo', reason: 'supabase_unavailable' }

export async function getCurrentPlayerUser() {
  const session = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
  return session?.data?.session?.user || null
}

export async function loadCurrentPlayerMembership() {
  try {
    const playerUser = await getCurrentPlayerUser()
    return await service.loadPlayerMembership({ playerUser })
  } catch {
    return DEMO_SAFE_MEMBERSHIP_RESULT
  }
}

export async function joinCurrentPlayerToTeam(joinCode) {
  try {
    const playerUser = await getCurrentPlayerUser()
    return await service.joinTeamForPlayer({ joinCode, playerUser })
  } catch {
    return DEMO_SAFE_MEMBERSHIP_RESULT
  }
}
