import { lazy, Suspense } from "react";
import PlayerInterfaceFallback from "./PlayerInterfaceFallback.jsx";
import WorkspaceRecoveryBoundary from "./WorkspaceRecoveryBoundary.jsx";

const loadPlayerOperationalWorkspace = () => import("./PlayerOperationalWorkspace.jsx");
const lazyNamed = (name) => lazy(() => loadPlayerOperationalWorkspace().then((module) => ({ default: module[name] })));

const LazyPlayerWorkspaceCommandBar = lazyNamed("PlayerWorkspaceCommandBar");
const LazyPlayerWorkspaceEmptyState = lazyNamed("PlayerWorkspaceEmptyState");
const LazyPlayerWorkspaceFilterRail = lazyNamed("PlayerWorkspaceFilterRail");

function DeferredPlayerInterface({ Component, label, fallbackTestId, recoveryTestId, variant = "compact", ...props }) {
  return (
    <WorkspaceRecoveryBoundary label={label} testId={recoveryTestId}>
      <Suspense fallback={<PlayerInterfaceFallback label={label} testId={fallbackTestId} variant={variant} />}>
        <Component {...props} />
      </Suspense>
    </WorkspaceRecoveryBoundary>
  );
}

export function PlayerWorkspaceCommandBar(props) {
  return (
    <DeferredPlayerInterface
      Component={LazyPlayerWorkspaceCommandBar}
      label="Player workspace command bar"
      fallbackTestId="player-workspace-command-loading"
      recoveryTestId="player-workspace-command-recovery"
      variant="command"
      {...props}
    />
  );
}

export function PlayerWorkspaceEmptyState(props) {
  return (
    <DeferredPlayerInterface
      Component={LazyPlayerWorkspaceEmptyState}
      label="Player workspace guidance"
      fallbackTestId="player-workspace-empty-loading"
      recoveryTestId="player-workspace-empty-recovery"
      {...props}
    />
  );
}

export function PlayerWorkspaceFilterRail(props) {
  return (
    <DeferredPlayerInterface
      Component={LazyPlayerWorkspaceFilterRail}
      label="Player workspace filters"
      fallbackTestId="player-workspace-filter-loading"
      recoveryTestId="player-workspace-filter-recovery"
      {...props}
    />
  );
}
