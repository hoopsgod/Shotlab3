import { lazy, Suspense } from "react";

const LazyPlayerProgressStory = lazy(() => import("./PlayerProgressStory.jsx"));
const LazyPlayerCommitmentCenter = lazy(() => import("./PlayerCommitmentCenter.jsx"));
const LazyPlayerTrainingSessionHeader = lazy(() => import("./PlayerTrainingSessionHeader.jsx"));
const LazyPlayerSessionCloseout = lazy(() => import("./PlayerSessionCloseout.jsx"));
const LazyPlayerTrainingCompletion = lazy(() => import("./PlayerTrainingCompletion.jsx"));

function PlayerSurfaceFallback({ label = "Player workspace", minHeight = 96 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Preparing ${label}`}
      style={{
        minHeight,
        display: "grid",
        alignContent: "center",
        gap: 6,
        padding: "14px 16px",
        border: "1px solid rgba(255,255,255,.07)",
        borderRadius: 18,
        background: "linear-gradient(150deg, rgba(25,27,29,.90), rgba(9,10,11,.96))",
        color: "var(--text-1, #f5f7f8)",
        boxShadow: "inset 0 1px rgba(255,255,255,.035), 0 12px 30px rgba(0,0,0,.16)",
      }}
    >
      <span style={{ color: "var(--team-brand-primary, var(--accent))", fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>Player experience</span>
      <strong style={{ font: "700 14px/1.25 -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}>Preparing {label}</strong>
    </div>
  );
}

function DeferredSurface({ Component, label, minHeight, ...props }) {
  return (
    <Suspense fallback={<PlayerSurfaceFallback label={label} minHeight={minHeight} />}>
      <Component {...props} />
    </Suspense>
  );
}

export function PlayerProgressStory(props) {
  return <DeferredSurface Component={LazyPlayerProgressStory} label="development story" minHeight={260} {...props} />;
}

export function PlayerCommitmentCenter(props) {
  return <DeferredSurface Component={LazyPlayerCommitmentCenter} label="commitments" minHeight={180} {...props} />;
}

export function PlayerTrainingSessionHeader(props) {
  return <DeferredSurface Component={LazyPlayerTrainingSessionHeader} label="training session" minHeight={120} {...props} />;
}

export function PlayerSessionCloseout(props) {
  return <DeferredSurface Component={LazyPlayerSessionCloseout} label="session closeout" minHeight={180} {...props} />;
}

export function PlayerTrainingCompletion(props) {
  return <DeferredSurface Component={LazyPlayerTrainingCompletion} label="training completion" minHeight={180} {...props} />;
}
