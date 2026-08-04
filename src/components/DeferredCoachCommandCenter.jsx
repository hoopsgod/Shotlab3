import { lazy, Suspense } from 'react'

const LazyCoachCommandCenter = lazy(() => import('./CoachCommandCenter.jsx'))

function CoachCommandCenterFallback() {
  return (
    <main
      aria-label="Loading Coach Mission Control"
      data-testid="coach-command-center-loading"
      style={{
        minHeight: '72vh',
        display: 'grid',
        alignContent: 'start',
        gap: 14,
        padding: '18px 16px 28px',
        borderRadius: 28,
        background: 'linear-gradient(180deg, #0b0d0f 0%, #111518 48%, #0b0d0f 100%)',
        color: 'var(--text-primary, #f5f7f8)',
        boxShadow: 'inset 0 1px rgba(255,255,255,.045), 0 24px 60px rgba(0,0,0,.22)',
      }}
    >
      <section
        style={{
          minHeight: 210,
          display: 'grid',
          alignContent: 'end',
          gap: 10,
          padding: 20,
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,.08)',
          background: 'radial-gradient(circle at 78% 12%, rgba(200,255,26,.15), transparent 36%), linear-gradient(145deg, #151a1d, #090b0c)',
        }}
      >
        <div style={{ width: 112, height: 10, borderRadius: 999, background: 'rgba(200,255,26,.48)' }} />
        <div style={{ width: '70%', maxWidth: 310, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.12)' }} />
        <div style={{ width: '46%', maxWidth: 220, height: 12, borderRadius: 999, background: 'rgba(255,255,255,.075)' }} />
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            style={{
              minHeight: 92,
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,.07)',
              background: 'rgba(255,255,255,.035)',
            }}
          />
        ))}
      </section>
      <section
        style={{
          minHeight: 190,
          borderRadius: 22,
          border: '1px solid rgba(255,255,255,.07)',
          background: 'linear-gradient(155deg, rgba(255,255,255,.045), rgba(255,255,255,.018))',
        }}
      />
      <span
        role="status"
        style={{
          justifySelf: 'center',
          color: 'rgba(239,244,246,.62)',
          font: '700 12px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
          letterSpacing: '.04em',
        }}
      >
        Preparing Coach Mission Control…
      </span>
    </main>
  )
}

export default function DeferredCoachCommandCenter(props) {
  return (
    <Suspense fallback={<CoachCommandCenterFallback />}>
      <LazyCoachCommandCenter {...props} />
    </Suspense>
  )
}
