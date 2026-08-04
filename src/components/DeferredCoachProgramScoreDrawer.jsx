import { lazy, Suspense } from 'react'
import CoachAdministrationFallback from './CoachAdministrationFallback.jsx'

const LazyCoachProgramScoreDrawer = lazy(() => import('./CoachProgramScoreDrawer.jsx'))

export default function DeferredCoachProgramScoreDrawer(props) {
  return (
    <Suspense fallback={<CoachAdministrationFallback label="Program score entry" testId="coach-program-score-loading" compact />}>
      <LazyCoachProgramScoreDrawer {...props} />
    </Suspense>
  )
}
