import { supabase } from './supabase.js'

export const BACKEND_HEALTH = {
  DEMO_MODE_ACTIVE: 'demo_mode_active',
  SUPABASE_CONFIGURED: 'supabase_configured',
  SUPABASE_UNAVAILABLE: 'supabase_unavailable',
}

const DEV = Boolean(typeof import.meta !== 'undefined' && import.meta?.env?.DEV)

export function getBackendHealthSnapshot() {
  if (!supabase?.isConfigured) {
    return {
      status: BACKEND_HEALTH.DEMO_MODE_ACTIVE,
      ok: true,
      message: 'Supabase env vars are missing. Demo mode fallback remains active.',
      detail: 'missing_supabase_env',
    }
  }

  return {
    status: BACKEND_HEALTH.SUPABASE_CONFIGURED,
    ok: true,
    message: 'Supabase env vars detected. Backend requests are enabled.',
    detail: 'supabase_env_present',
  }
}

export async function checkBackendHealth({ timeoutMs = 3500 } = {}) {
  const snapshot = getBackendHealthSnapshot()
  if (snapshot.status === BACKEND_HEALTH.DEMO_MODE_ACTIVE) return snapshot

  try {
    const probePromise = supabase.from('teams').select()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('backend_probe_timeout')), timeoutMs)
    })
    const result = await Promise.race([probePromise, timeoutPromise])

    if (result?.error) {
      return {
        status: BACKEND_HEALTH.SUPABASE_UNAVAILABLE,
        ok: false,
        message: 'Supabase is configured but currently unavailable. Demo-safe behavior remains active.',
        detail: String(result.error?.code || result.error?.message || 'probe_error'),
      }
    }

    return snapshot
  } catch (error) {
    return {
      status: BACKEND_HEALTH.SUPABASE_UNAVAILABLE,
      ok: false,
      message: 'Supabase is configured but unreachable. Demo-safe behavior remains active.',
      detail: String(error?.message || 'probe_failed'),
    }
  }
}

export function logBackendHealth(status) {
  if (!DEV || !status) return
  const payload = {
    status: status.status,
    ok: status.ok,
    detail: status.detail,
  }
  const method = status.ok ? 'info' : 'warn'
  console[method]('[ShotLab backend]', payload)
}
