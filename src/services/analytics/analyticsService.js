import {
  initAnalytics,
  trackBackendEvent,
  flushAnalyticsQueue,
} from "../../lib/analytics";

export { initAnalytics, trackBackendEvent, flushAnalyticsQueue };

// Backward-compatible aliases to keep this refactor merge-safe.
export const initializeAnalytics = initAnalytics;
export const trackAnalyticsBackendEvent = trackBackendEvent;
