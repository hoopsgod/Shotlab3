import { supabase } from './supabase.js'
import { createPlayerJoinCodeService } from './playerJoinCodeService.js'

const service = createPlayerJoinCodeService({ supabaseClient: supabase })

export async function getCurrentPlayerUser() {
  const session = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
  return session?.data?.session?.user || null
}

export async function loadCurrentPlayerMembership() {
  const playerUser = await getCurrentPlayerUser()
  return service.loadPlayerMembership({ playerUser })
}

export async function joinCurrentPlayerToTeam(joinCode) {
  const playerUser = await getCurrentPlayerUser()
  return service.joinTeamForPlayer({ joinCode, playerUser })
}
