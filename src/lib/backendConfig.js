import { supabase } from './supabase.js'

export const BACKEND_MODE = {
  DEMO: 'demo',
  SUPABASE: 'supabase',
}

export function resolveBackendMode() {
  return supabase.isConfigured ? BACKEND_MODE.SUPABASE : BACKEND_MODE.DEMO
}

export function getBackendRuntime() {
  const mode = resolveBackendMode()
  return {
    mode,
    supabaseEnabled: mode === BACKEND_MODE.SUPABASE,
    demoFallback: mode === BACKEND_MODE.DEMO,
    reason: mode === BACKEND_MODE.DEMO ? 'missing_supabase_env' : 'supabase_configured',
  }
}
