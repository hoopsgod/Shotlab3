import { lazy, Suspense } from "react";
import WorkspaceRecoveryBoundary from "./WorkspaceRecoveryBoundary.jsx";

const LazyCoachDashboardHeader = lazy(() => import("./CoachDashboardHeader.jsx"));
const LazyDashboardSection = lazy(() => import("./CoachDashboardPrimitives.jsx").then((module) => ({ default: module.DashboardSection })));

function InlineFallback({ minHeight = 0 }) {
  return <span aria-hidden="true" style={{ display: "block", minHeight }} />;
}

function Deferred({ Component, label, recoveryTestId, fallbackHeight = 0, ...props }) {
  return (
    <WorkspaceRecoveryBoundary label={label} testId={recoveryTestId}>
      <Suspense fallback={<InlineFallback minHeight={fallbackHeight} />}>
        <Component {...props} />
      </Suspense>
    </WorkspaceRecoveryBoundary>
  );
}

export function CoachDashboardHeader(props) {
  return <Deferred Component={LazyCoachDashboardHeader} label="Coach identity" recoveryTestId="coach-dashboard-header-recovery" fallbackHeight={150} {...props} />;
}

export function DashboardSection(props) {
  return <Deferred Component={LazyDashboardSection} label="Dashboard section" recoveryTestId="dashboard-section-recovery" fallbackHeight={120} {...props} />;
}
