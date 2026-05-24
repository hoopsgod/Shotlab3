import { normalizeEmail } from './authFlow.js'

const toDisplayName = (value = '', fallbackEmail = '') => {
  const name = String(value || '').trim()
  if (name) return name
  const local = String(fallbackEmail || '').split('@')[0]
  return local || 'Coach'
}

export async function bootstrapCoachProfile({ supabaseClient, authUser, email, displayName } = {}) {
  if (!supabaseClient?.isConfigured) return { ok: false, skipped: 'config_missing' }
  const authUserId = String(authUser?.id || '').trim()
  const normalizedEmail = normalizeEmail(email || authUser?.email || '')
  if (!authUserId || !normalizedEmail) return { ok: false, skipped: 'missing_identity' }

  const row = {
    auth_user_id: authUserId,
    email: normalizedEmail,
    role: 'coach',
    display_name: toDisplayName(displayName || authUser?.user_metadata?.display_name, normalizedEmail),
  }

  try {
    const result = await supabaseClient.profiles.upsertCoach(row)
    if (result?.error) return { ok: false, errorCode: String(result.error.code || 'profile_upsert_failed') }
    return { ok: true, profile: result.data?.[0] || row }
  } catch {
    return { ok: false, errorCode: 'profile_upsert_failed' }
  }
}
