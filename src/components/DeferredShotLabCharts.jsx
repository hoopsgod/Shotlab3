import { lazy, Suspense } from 'react'

const LazyShotLabCharts = lazy(() => import('./ShotLabCharts.jsx'))

function ProgressChartsFallback() {
  return (
    <section
      aria-label="Loading progress analytics"
      data-testid="progress-charts-loading"
      style={{
        minHeight: 360,
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
      Loading progress analytics…
    </section>
  )
}

export default function DeferredShotLabCharts(props) {
  return (
    <Suspense fallback={<ProgressChartsFallback />}>
      <LazyShotLabCharts {...props} />
    </Suspense>
  )
}
