import { useEffect } from "react";
import { initAnalytics, trackBackendEvent } from "../../services/analytics/analyticsService";

export default function useAppAnalytics({ ready, user, view, trackEvent }) {
  useEffect(() => {
    initAnalytics();
    trackBackendEvent("app_loaded", { path: window.location.pathname });
  }, []);

  useEffect(() => {
    if (ready && user && ["coach", "player"].includes(view)) {
      trackEvent("screen_view", { screen: view, role: user.role || "player" });
    }
  }, [ready, user, view, trackEvent]);

  useEffect(() => {
    const onErr = (e) => trackEvent("app_error", { kind: "error", message: e?.message || "unknown" });
    const onRej = (e) =>
      trackEvent("app_error", { kind: "unhandledrejection", message: e?.reason?.message || String(e?.reason || "unknown") });

    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, [trackEvent]);
}
