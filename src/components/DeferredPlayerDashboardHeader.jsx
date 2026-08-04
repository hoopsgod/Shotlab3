import { lazy, Suspense } from "react";
import PlayerInterfaceFallback from "./PlayerInterfaceFallback.jsx";

const LazyPlayerDashboardHeader = lazy(() => import("./PlayerDashboardHeader.jsx"));

export default function DeferredPlayerDashboardHeader(props) {
  return (
    <Suspense fallback={<PlayerInterfaceFallback label="player identity" testId="player-dashboard-header-loading" variant="header" />}>
      <LazyPlayerDashboardHeader {...props} />
    </Suspense>
  );
}
