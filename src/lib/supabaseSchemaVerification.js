import { supabase } from './supabase.js'

export const MVP_SCHEMA_TABLES = Object.freeze([
  'users',
  'teams',
  'team_members',
  'join_codes',
  'drills',
  'coach_priorities',
  'shot_logs',
  'sessions',
  'leaderboard_entries',
])

export const SUPABASE_SCHEMA_STATUS = {
  DEMO_SAFE: 'demo_safe',
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
}

export async function verifySupabaseSchema({
  supabaseClient = supabase,
  expectedTables = MVP_SCHEMA_TABLES,
} = {}) {
  if (!supabaseClient?.isConfigured) {
    return {
      status: SUPABASE_SCHEMA_STATUS.DEMO_SAFE,
      ok: true,
      message: 'Supabase env vars are missing. Demo mode remains active.',
      expectedTables: [...expectedTables],
      reachableTables: [],
      missingTables: [...expectedTables],
      detail: 'missing_supabase_env',
    }
  }

  try {
    const checks = await Promise.all(
      expectedTables.map(async (table) => {
        const result = await supabaseClient.from(table).select()
        return {
          table,
          ok: !result?.error,
          error: result?.error || null,
        }
      })
    )

    const reachableTables = checks.filter((item) => item.ok).map((item) => item.table)
    const missingTables = checks.filter((item) => !item.ok).map((item) => item.table)

    if (missingTables.length > 0) {
      return {
        status: SUPABASE_SCHEMA_STATUS.UNAVAILABLE,
        ok: false,
        message: 'Supabase is configured but MVP schema verification failed for one or more tables.',
        expectedTables: [...expectedTables],
        reachableTables,
        missingTables,
        detail: checks
          .filter((item) => !item.ok)
          .map((item) => `${item.table}:${String(item.error?.code || item.error?.message || 'probe_error')}`)
          .join(','),
      }
    }

    return {
      status: SUPABASE_SCHEMA_STATUS.AVAILABLE,
      ok: true,
      message: 'Supabase is configured and MVP schema tables are reachable.',
      expectedTables: [...expectedTables],
      reachableTables,
      missingTables: [],
      detail: 'schema_probe_ok',
    }
  } catch (error) {
    return {
      status: SUPABASE_SCHEMA_STATUS.UNAVAILABLE,
      ok: false,
      message: 'Supabase is configured but schema verification is unavailable. Demo-safe behavior remains active.',
      expectedTables: [...expectedTables],
      reachableTables: [],
      missingTables: [...expectedTables],
      detail: String(error?.message || 'schema_probe_failed'),
    }
  }
}
