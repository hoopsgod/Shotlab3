import { lazy, Suspense } from "react";
import PlayerInterfaceFallback from "./PlayerInterfaceFallback.jsx";

const LazyPlayerDailyCommandCenter = lazy(() => import("./PlayerDailyCommandCenter.jsx"));

export default function DeferredPlayerDailyCommandCenter(props) {
  return (
    <Suspense fallback={<PlayerInterfaceFallback label="Daily Command Center" testId="player-daily-command-center-loading" variant="daily" />}>
      <LazyPlayerDailyCommandCenter {...props} />
    </Suspense>
  );
}
