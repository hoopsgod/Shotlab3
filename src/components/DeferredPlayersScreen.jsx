import { lazy, Suspense } from 'react'
import CoachAdministrationFallback from './CoachAdministrationFallback.jsx'

const LazyPlayersScreen = lazy(() => import('../screens/PlayersScreen.jsx'))

export default function DeferredPlayersScreen(props) {
  return (
    <Suspense fallback={<CoachAdministrationFallback label="Players workspace" testId="coach-players-screen-loading" />}>
      <LazyPlayersScreen {...props} />
    </Suspense>
  )
}
