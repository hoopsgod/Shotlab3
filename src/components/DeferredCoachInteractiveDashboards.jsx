import { lazy, Suspense } from 'react'
import WorkspaceRecoveryBoundary from './WorkspaceRecoveryBoundary.jsx'

const loadCoachInteractiveDashboards = () => import('./CoachInteractiveDashboards.jsx')
const lazyNamed = (name) => lazy(() => loadCoachInteractiveDashboards().then((module) => ({ default: module[name] })))

const LazyCoachEventsInteractiveDashboard = lazyNamed('CoachEventsInteractiveDashboard')
const LazyCoachPageDashboardHeader = lazyNamed('CoachPageDashboardHeader')
const LazyCoachPlayersInteractiveDashboard = lazyNamed('CoachPlayersInteractiveDashboard')

function CoachWorkspaceFallback() {
  return (
    <section
      aria-label="Loading coach workspace"
      data-testid="coach-interactive-dashboard-loading"
      style={{
        minHeight: 220,
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
      Loading coach workspace…
    </section>
  )
}

function DeferredCoachWorkspace({ Component, recoveryLabel, recoveryTestId, ...props }) {
  return (
    <WorkspaceRecoveryBoundary label={recoveryLabel} testId={recoveryTestId}>
      <Suspense fallback={<CoachWorkspaceFallback />}>
        <Component {...props} />
      </Suspense>
    </WorkspaceRecoveryBoundary>
  )
}

export function CoachEventsInteractiveDashboard(props) {
  return <DeferredCoachWorkspace Component={LazyCoachEventsInteractiveDashboard} recoveryLabel="Coach events" recoveryTestId="coach-events-recovery" {...props} />
}

export function CoachPageDashboardHeader(props) {
  return <DeferredCoachWorkspace Component={LazyCoachPageDashboardHeader} recoveryLabel="Coach dashboard" recoveryTestId="coach-page-dashboard-recovery" {...props} />
}

export function CoachPlayersInteractiveDashboard(props) {
  return <DeferredCoachWorkspace Component={LazyCoachPlayersInteractiveDashboard} recoveryLabel="Coach players" recoveryTestId="coach-players-recovery" {...props} />
}
