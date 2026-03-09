import {
  initAnalytics,
  trackBackendEvent,
  flushAnalyticsQueue,
} from "../../lib/analytics";

export { initAnalytics, trackBackendEvent, flushAnalyticsQueue };

// Generic alias for future non-backend specific call sites.
export const trackEvent = trackBackendEvent;
