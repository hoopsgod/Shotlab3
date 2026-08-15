import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const CORE_ROUTE_ENHANCERS = Object.freeze([
  'scripts/apply-phase3f-profile-intelligence.mjs',
  'scripts/apply-phase3g-coach-drills-hierarchy.mjs',
  'scripts/apply-phase3h-coach-players-hierarchy.mjs',
  'scripts/apply-phase3i-team-store-immersive.mjs',
  'scripts/apply-phase3j-coach-events-hierarchy.mjs',
  'scripts/apply-phase3k-coach-strength-hierarchy.mjs',
  'scripts/apply-phase3l-coach-leaderboard-hierarchy.mjs',
  'scripts/apply-phase3m-player-team-store-retail.mjs',
  'scripts/apply-phase3n-player-commitments.mjs',
  'scripts/apply-phase3o-player-training-session.mjs',
  'scripts/apply-phase3p-player-training-completion.mjs',
  'scripts/apply-phase3q-player-session-closeout.mjs',
  'scripts/apply-phase3r-player-progress-intelligence.mjs',
  'scripts/apply-expert-app-review-v2.mjs',
  'scripts/apply-phase3u-player-account-control.mjs',
  'scripts/apply-phase3u-production-acceptance-path.mjs',
  'scripts/apply-phase3v-final-reconciliation.mjs',
  'scripts/apply-phase4a-signature-visual-identity.mjs',
  'scripts/apply-phase4b-premium-performance-marks.mjs',
  'scripts/apply-phase4c-premium-interaction-material-motion.mjs',
  'scripts/apply-phase4d-premium-state-system.mjs',
  'scripts/apply-phase4e-final-polish.mjs',
  'scripts/minify-visual-authority-css.mjs',
])

const FINAL_ROUTE_ENHANCERS = Object.freeze([
  'scripts/apply-phase5a-coach-daily-intelligence.mjs',
  'scripts/apply-phase2d-premium-empty-state-language.mjs',
  'scripts/apply-phase4c-coach-event-manage-hit-area.mjs',
  'scripts/apply-phase4d-shared-back-hit-area.mjs',
  'scripts/apply-phase4e1-coach-filter-hit-area.mjs',
  'scripts/apply-phase4e4-player-program-rsvp-hit-area.mjs',
  'scripts/apply-phase4e5-player-home-secondary-links.mjs',
  'scripts/apply-phase4e6-player-profile-tabs-hit-area.mjs',
  'scripts/apply-phase4e7-player-profile-source-filters.mjs',
  'scripts/apply-phase4e8-player-profile-drill-filters.mjs',
  'scripts/apply-release-auth-session-recovery.mjs',
  'scripts/apply-legacy-signed-collection-reads.mjs',
  'scripts/apply-post-auth-persistence-hydration.mjs',
  'scripts/apply-mobile-secondary-page-parity-v2.mjs',
  'scripts/apply-phase4e9-player-profile-data-request.mjs',
  'scripts/apply-phase4e10-player-profile-account-touch-safety.mjs',
  'scripts/apply-phase4e11-coach-residual-touch-safety.mjs',
])

const RELEASE_AUTH_RECOVERY_MARKER = 'const supabaseSessionRequest=SUPABASE_AUTH_ENABLED?supabase.auth.getSession():null;'
const PHASE5A_COACH_INTELLIGENCE = 'scripts/apply-phase5a-coach-daily-intelligence.mjs'

export const DEV_ROUTE_ENHANCERS = Object.freeze([
  ...CORE_ROUTE_ENHANCERS,
  ...FINAL_ROUTE_ENHANCERS,
])

export const BUILD_ROUTE_ENHANCERS = Object.freeze([
  'scripts/run-finish-v9-compatible.mjs',
  'scripts/align-v9-player-boundary-contract.mjs',
  ...CORE_ROUTE_ENHANCERS,
  'scripts/align-phase4f-browser-contracts.mjs',
  ...FINAL_ROUTE_ENHANCERS,
])

export function routeEnhancersFor(mode) {
  if (mode === 'dev') return DEV_ROUTE_ENHANCERS
  if (mode === 'build') return BUILD_ROUTE_ENHANCERS
  throw new Error(`Unknown route-enhancer mode: ${String(mode)}. Expected "dev" or "build".`)
}

function hasReleaseAuthRecovery(cwd) {
  try {
    return readFileSync(path.resolve(cwd, 'src/App.jsx'), 'utf8').includes(RELEASE_AUTH_RECOVERY_MARKER)
  } catch {
    return false
  }
}

export function runRouteEnhancers(mode, { cwd = process.cwd(), env = process.env } = {}) {
  const enhancers = routeEnhancersFor(mode)

  for (const script of enhancers) {
    if (script === PHASE5A_COACH_INTELLIGENCE && hasReleaseAuthRecovery(cwd)) {
      console.log('Phase 5A Coach intelligence already satisfied before release auth recovery; skipping repeat mutation.')
      continue
    }

    const result = spawnSync(process.execPath, [path.resolve(cwd, script)], {
      cwd,
      env,
      stdio: 'inherit',
    })

    if (result.error) throw result.error
    if (result.status !== 0) {
      const suffix = result.signal ? ` (signal ${result.signal})` : ''
      throw new Error(`Route enhancer failed (${result.status ?? 'no exit code'})${suffix}: ${script}`)
    }
  }
}

const currentFile = fileURLToPath(import.meta.url)
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null

if (invokedFile === currentFile) {
  try {
    runRouteEnhancers(process.argv[2])
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
