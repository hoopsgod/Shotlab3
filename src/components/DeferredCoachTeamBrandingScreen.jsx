import { lazy, Suspense } from 'react'
import CoachAdministrationFallback from './CoachAdministrationFallback.jsx'

const LazyCoachTeamBrandingScreen = lazy(() => import('../screens/CoachTeamBrandingScreen.jsx'))

export default function DeferredCoachTeamBrandingScreen(props) {
  return (
    <Suspense fallback={<CoachAdministrationFallback label="Team Branding" testId="coach-team-branding-loading" />}>
      <LazyCoachTeamBrandingScreen {...props} />
    </Suspense>
  )
}
