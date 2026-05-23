import { supabase } from './supabase.js'
import { BACKEND_HEALTH, getBackendHealthSnapshot } from './backendHealth.js'

export const BACKEND_MODE = {
  DEMO: 'demo',
  SUPABASE: 'supabase',
}

export function resolveBackendMode() {
  return supabase.isConfigured ? BACKEND_MODE.SUPABASE : BACKEND_MODE.DEMO
}

export function getBackendRuntime() {
  const mode = resolveBackendMode()
  const health = getBackendHealthSnapshot()
  return {
    mode,
    supabaseEnabled: mode === BACKEND_MODE.SUPABASE,
    demoFallback: mode === BACKEND_MODE.DEMO,
    reason:
      health.status === BACKEND_HEALTH.DEMO_MODE_ACTIVE
        ? 'missing_supabase_env'
        : 'supabase_configured',
    health,
  }
}
