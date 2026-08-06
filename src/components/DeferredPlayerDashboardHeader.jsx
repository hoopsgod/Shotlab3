import { lazy, Suspense } from "react";
import PlayerInterfaceFallback from "./PlayerInterfaceFallback.jsx";
import WorkspaceRecoveryBoundary from "./WorkspaceRecoveryBoundary.jsx";

const LazyPlayerDashboardHeader = lazy(() => import("./PlayerDashboardHeader.jsx"));

export default function DeferredPlayerDashboardHeader(props) {
  return (
    <WorkspaceRecoveryBoundary label="Player identity" testId="player-dashboard-header-recovery">
      <Suspense fallback={<PlayerInterfaceFallback label="player identity" testId="player-dashboard-header-loading" variant="header" />}>
        <LazyPlayerDashboardHeader {...props} />
      </Suspense>
    </WorkspaceRecoveryBoundary>
  );
}
