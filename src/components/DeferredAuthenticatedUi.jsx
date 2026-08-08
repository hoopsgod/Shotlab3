import { lazy, Suspense } from "react";
import WorkspaceRecoveryBoundary from "./WorkspaceRecoveryBoundary.jsx";

const lazyDefault = (loader) => lazy(loader);
const lazyNamed = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));

const LazyMobileNavigation = lazyDefault(() => import("./MobileNavigation.jsx"));
const LazyCoachDashboardHeader = lazyDefault(() => import("./CoachDashboardHeader.jsx"));
const LazyCompactLeaderboardPreviewCard = lazyDefault(() => import("./CompactLeaderboardPreviewCard.jsx"));
const LazySemanticStatus = lazyDefault(() => import("./SemanticStatus.jsx"));
const LazyOperationalInsightRail = lazyDefault(() => import("./OperationalInsightRail.jsx"));

const loadHierarchy = () => import("./VisualHierarchy.jsx");
const LazyDominantObjectiveCard = lazyNamed(loadHierarchy, "DominantObjectiveCard");
const LazyMetricStrip = lazyNamed(loadHierarchy, "MetricStrip");
const LazyProgressiveDisclosure = lazyNamed(loadHierarchy, "ProgressiveDisclosure");
const LazyQuietSection = lazyNamed(loadHierarchy, "QuietSection");

const loadCoachPrimitives = () => import("./CoachDashboardPrimitives.jsx");
const LazyDashboardSection = lazyNamed(loadCoachPrimitives, "DashboardSection");

function InlineFallback({ minHeight = 0, testId }) {
  return <span aria-hidden="true" data-testid={testId} style={{ display: "block", minHeight }} />;
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

export function MobileNavigation(props) {
  return <Deferred Component={LazyMobileNavigation} label="Navigation" recoveryTestId="mobile-navigation-recovery" fallbackHeight={76} {...props} />;
}

export function CoachDashboardHeader(props) {
  return <Deferred Component={LazyCoachDashboardHeader} label="Coach identity" recoveryTestId="coach-dashboard-header-recovery" fallbackHeight={150} {...props} />;
}

export function CompactLeaderboardPreviewCard(props) {
  return <Deferred Component={LazyCompactLeaderboardPreviewCard} label="Leaderboard preview" recoveryTestId="leaderboard-preview-recovery" fallbackHeight={120} {...props} />;
}

export function SemanticStatus(props) {
  return <Suspense fallback={null}><LazySemanticStatus {...props} /></Suspense>;
}

export function OperationalInsightRail(props) {
  return <Deferred Component={LazyOperationalInsightRail} label="Decision support" recoveryTestId="operational-insight-recovery" fallbackHeight={180} {...props} />;
}

export function DominantObjectiveCard(props) {
  return <Deferred Component={LazyDominantObjectiveCard} label="Primary objective" recoveryTestId="dominant-objective-recovery" fallbackHeight={180} {...props} />;
}

export function MetricStrip(props) {
  return <Deferred Component={LazyMetricStrip} label="Performance metrics" recoveryTestId="metric-strip-recovery" fallbackHeight={72} {...props} />;
}

export function ProgressiveDisclosure(props) {
  return <Deferred Component={LazyProgressiveDisclosure} label="Details" recoveryTestId="progressive-disclosure-recovery" {...props} />;
}

export function QuietSection(props) {
  return <Deferred Component={LazyQuietSection} label="Supporting section" recoveryTestId="quiet-section-recovery" {...props} />;
}

export function DashboardSection(props) {
  return <Deferred Component={LazyDashboardSection} label="Dashboard section" recoveryTestId="dashboard-section-recovery" fallbackHeight={120} {...props} />;
}
