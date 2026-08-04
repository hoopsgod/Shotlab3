import { lazy, Suspense } from 'react'

const loadCoachPhase2 = () => import('./CoachDashboardPhase2.jsx')
const lazyNamed = (name) => lazy(() => loadCoachPhase2().then((module) => ({ default: module[name] })))

const LazyCoachActivityIntelligencePanel = lazyNamed('CoachActivityIntelligencePanel')
const LazyCoachDrillsOperationalPanel = lazyNamed('CoachDrillsOperationalPanel')
const LazyCoachEventIntelligenceDrawer = lazyNamed('CoachEventIntelligenceDrawer')
const LazyCoachLeaderboardOperationalPanel = lazyNamed('CoachLeaderboardOperationalPanel')
const LazyCoachPlayerIntelligenceDrawer = lazyNamed('CoachPlayerIntelligenceDrawer')
const LazyCoachSeasonComparisonPanel = lazyNamed('CoachSeasonComparisonPanel')
const LazyCoachStrengthOperationalPanel = lazyNamed('CoachStrengthOperationalPanel')

function CoachIntelligenceFallback() {
  return (
    <section
      aria-label="Loading coach intelligence"
      data-testid="coach-intelligence-loading"
      style={{
        minHeight: 240,
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
      Loading coach intelligence…
    </section>
  )
}

function DeferredCoachIntelligence({ Component, testId, ...props }) {
  return (
    <div data-testid={testId}>
      <Suspense fallback={<CoachIntelligenceFallback />}>
        <Component {...props} />
      </Suspense>
    </div>
  )
}

export function CoachActivityIntelligencePanel(props) {
  return <DeferredCoachIntelligence Component={LazyCoachActivityIntelligencePanel} testId="deferred-coach-activity-intelligence" {...props} />
}

export function CoachDrillsOperationalPanel(props) {
  return <DeferredCoachIntelligence Component={LazyCoachDrillsOperationalPanel} testId="deferred-coach-drills-intelligence" {...props} />
}

export function CoachEventIntelligenceDrawer(props) {
  return <DeferredCoachIntelligence Component={LazyCoachEventIntelligenceDrawer} testId="deferred-coach-event-intelligence" {...props} />
}

export function CoachLeaderboardOperationalPanel(props) {
  return <DeferredCoachIntelligence Component={LazyCoachLeaderboardOperationalPanel} testId="deferred-coach-leaderboard-intelligence" {...props} />
}

export function CoachPlayerIntelligenceDrawer(props) {
  return <DeferredCoachIntelligence Component={LazyCoachPlayerIntelligenceDrawer} testId="deferred-coach-player-intelligence" {...props} />
}

export function CoachSeasonComparisonPanel(props) {
  return <DeferredCoachIntelligence Component={LazyCoachSeasonComparisonPanel} testId="deferred-coach-season-intelligence" {...props} />
}

export function CoachStrengthOperationalPanel(props) {
  return <DeferredCoachIntelligence Component={LazyCoachStrengthOperationalPanel} testId="deferred-coach-strength-intelligence" {...props} />
}
