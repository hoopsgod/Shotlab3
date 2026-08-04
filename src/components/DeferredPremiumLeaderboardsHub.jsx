import { lazy, Suspense } from 'react'

const LazyPremiumLeaderboardsHub = lazy(() => import('./PremiumLeaderboardsHub.jsx'))

function LeaderboardsFallback() {
  return (
    <section
      aria-label="Loading leaderboard analytics"
      data-testid="leaderboards-loading"
      style={{
        minHeight: 320,
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
      Loading leaderboard analytics…
    </section>
  )
}

export default function DeferredPremiumLeaderboardsHub(props) {
  return (
    <div data-testid="deferred-leaderboards-workspace">
      <Suspense fallback={<LeaderboardsFallback />}>
        <LazyPremiumLeaderboardsHub {...props} />
      </Suspense>
    </div>
  )
}
