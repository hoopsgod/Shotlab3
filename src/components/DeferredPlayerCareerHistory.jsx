import { lazy, Suspense } from 'react'
import WorkspaceRecoveryBoundary from './WorkspaceRecoveryBoundary.jsx'

const LazyPlayerCareerHistory = lazy(() => import('./PlayerCareerHistory.jsx'))

function PlayerCareerHistoryFallback() {
  return (
    <section
      aria-label="Loading career history"
      data-testid="player-career-history-loading"
      style={{
        minHeight: 420,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        borderRadius: 20,
        border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
        background: 'var(--surface-card, #111318)',
        color: 'var(--text-muted, #9ca3af)',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.04em',
      }}
    >
      Loading career history…
    </section>
  )
}

export default function DeferredPlayerCareerHistory(props) {
  return (
    <WorkspaceRecoveryBoundary label="Career history" testId="player-career-history-recovery">
      <Suspense fallback={<PlayerCareerHistoryFallback />}>
        <LazyPlayerCareerHistory {...props} />
      </Suspense>
    </WorkspaceRecoveryBoundary>
  )
}
