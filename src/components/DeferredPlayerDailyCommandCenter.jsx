import { lazy, Suspense } from "react";
import PlayerInterfaceFallback from "./PlayerInterfaceFallback.jsx";
import WorkspaceRecoveryBoundary from "./WorkspaceRecoveryBoundary.jsx";

const LazyPlayerDailyCommandCenter = lazy(() => import("./PlayerDailyCommandCenter.jsx"));

export default function DeferredPlayerDailyCommandCenter(props) {
  return (
    <WorkspaceRecoveryBoundary label="Player daily plan" testId="player-daily-command-center-recovery">
      <Suspense fallback={<PlayerInterfaceFallback label="Daily Command Center" testId="player-daily-command-center-loading" variant="daily" />}>
        <LazyPlayerDailyCommandCenter {...props} />
      </Suspense>
    </WorkspaceRecoveryBoundary>
  );
}
