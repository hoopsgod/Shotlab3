export default function CoachAdministrationFallback({
  label = 'Coach workspace',
  testId = 'coach-administration-loading',
  compact = false,
}) {
  return (
    <section
      aria-label={`Loading ${label}`}
      data-testid={testId}
      style={{
        minHeight: compact ? 96 : 180,
        display: 'grid',
        alignContent: 'start',
        gap: 12,
        padding: compact ? '14px' : '18px',
        borderRadius: 22,
        border: '1px solid rgba(255,255,255,.08)',
        background: 'linear-gradient(155deg, rgba(255,255,255,.045), rgba(8,10,11,.92))',
        boxShadow: 'inset 0 1px rgba(255,255,255,.035), 0 18px 44px rgba(0,0,0,.18)',
      }}
    >
      <div style={{ width: 96, height: 9, borderRadius: 999, background: 'rgba(200,255,26,.38)' }} />
      <div style={{ width: compact ? '52%' : '68%', maxWidth: 320, height: compact ? 22 : 30, borderRadius: 10, background: 'rgba(255,255,255,.11)' }} />
      <div style={{ width: compact ? '72%' : '86%', maxWidth: 440, height: 11, borderRadius: 999, background: 'rgba(255,255,255,.065)' }} />
      {!compact && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 4 }}>
          {[0, 1].map((item) => (
            <div key={item} style={{ minHeight: 72, borderRadius: 16, background: 'rgba(255,255,255,.035)' }} />
          ))}
        </div>
      )}
      <span role="status" style={{ color: 'rgba(239,244,246,.58)', font: '700 11px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif', letterSpacing: '.04em' }}>
        Preparing {label}…
      </span>
    </section>
  )
}
