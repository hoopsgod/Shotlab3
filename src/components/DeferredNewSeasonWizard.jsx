import { lazy, Suspense } from 'react'
import CoachAdministrationFallback from './CoachAdministrationFallback.jsx'

const LazyNewSeasonWizard = lazy(() => import('./NewSeasonWizard.jsx'))

export default function DeferredNewSeasonWizard(props) {
  return (
    <Suspense fallback={<CoachAdministrationFallback label="New Season" testId="new-season-wizard-loading" />}>
      <LazyNewSeasonWizard {...props} />
    </Suspense>
  )
}
