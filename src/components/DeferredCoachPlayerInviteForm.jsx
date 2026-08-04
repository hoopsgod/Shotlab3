import { lazy, Suspense } from 'react'
import CoachAdministrationFallback from './CoachAdministrationFallback.jsx'

const LazyCoachPlayerInviteForm = lazy(() => import('./CoachPlayerInviteForm.jsx'))

export default function DeferredCoachPlayerInviteForm(props) {
  return (
    <Suspense fallback={<CoachAdministrationFallback label="Player invitation" testId="coach-player-invite-loading" compact />}>
      <LazyCoachPlayerInviteForm {...props} />
    </Suspense>
  )
}
