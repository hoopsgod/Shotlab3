import { lazy, Suspense } from "react";
import PlayerInterfaceFallback from "./PlayerInterfaceFallback.jsx";

const loadPlayerOperationalWorkspace = () => import("./PlayerOperationalWorkspace.jsx");
const lazyNamed = (name) => lazy(() => loadPlayerOperationalWorkspace().then((module) => ({ default: module[name] })));

const LazyPlayerWorkspaceCommandBar = lazyNamed("PlayerWorkspaceCommandBar");
const LazyPlayerWorkspaceEmptyState = lazyNamed("PlayerWorkspaceEmptyState");
const LazyPlayerWorkspaceFilterRail = lazyNamed("PlayerWorkspaceFilterRail");

function DeferredPlayerInterface({ Component, label, fallbackTestId, variant = "compact", ...props }) {
  return (
    <Suspense fallback={<PlayerInterfaceFallback label={label} testId={fallbackTestId} variant={variant} />}>
      <Component {...props} />
    </Suspense>
  );
}

export function PlayerWorkspaceCommandBar(props) {
  return (
    <DeferredPlayerInterface
      Component={LazyPlayerWorkspaceCommandBar}
      label="workspace command bar"
      fallbackTestId="player-workspace-command-loading"
      variant="command"
      {...props}
    />
  );
}

export function PlayerWorkspaceEmptyState(props) {
  return (
    <DeferredPlayerInterface
      Component={LazyPlayerWorkspaceEmptyState}
      label="workspace guidance"
      fallbackTestId="player-workspace-empty-loading"
      {...props}
    />
  );
}

export function PlayerWorkspaceFilterRail(props) {
  return (
    <DeferredPlayerInterface
      Component={LazyPlayerWorkspaceFilterRail}
      label="workspace filters"
      fallbackTestId="player-workspace-filter-loading"
      {...props}
    />
  );
}
