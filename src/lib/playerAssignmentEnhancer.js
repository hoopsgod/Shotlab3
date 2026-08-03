const HOST_TEST_ID = "player-coach-assignment-host";

export function installPlayerAssignmentEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabPlayerAssignmentEnhancer) return true;
  window.__shotlabPlayerAssignmentEnhancer = true;

  void Promise.all([
    import("react"),
    import("react-dom/client"),
    import("../components/PlayerCoachAssignmentCard.jsx"),
  ]).then(([reactModule, reactDomModule, cardModule]) => {
    const React = reactModule.default || reactModule;
    const { createRoot } = reactDomModule;
    const PlayerCoachAssignmentCard = cardModule.default;
    let host = null;
    let root = null;
    let target = null;
    let frame = null;

    const placeHost = (nextTarget, nextHost) => {
      const primaryAction = nextTarget.querySelector('[data-testid="player-daily-primary-action"]');
      const genericHero = primaryAction?.closest?.("div");
      if (genericHero?.parentElement === nextTarget) {
        nextHost.dataset.assignmentPlacement = "before-generic-primary";
        nextTarget.insertBefore(nextHost, genericHero);
        return;
      }
      const coachSignal = nextTarget.querySelector('[data-testid="player-coach-priority-signal"]');
      nextHost.dataset.assignmentPlacement = coachSignal ? "before-coach-signal" : "command-center-end";
      if (coachSignal) nextTarget.insertBefore(nextHost, coachSignal);
      else nextTarget.appendChild(nextHost);
    };

    const reconcile = () => {
      frame = null;
      const nextTarget = document.querySelector('[data-testid="player-daily-command-center"]');
      if (!nextTarget) {
        root?.unmount?.();
        host?.remove?.();
        root = null;
        host = null;
        target = null;
        return;
      }
      if (nextTarget === target && host?.isConnected) return;
      root?.unmount?.();
      host?.remove?.();
      target = nextTarget;
      host = document.createElement("div");
      host.dataset.testid = HOST_TEST_ID;
      placeHost(nextTarget, host);
      root = createRoot(host);
      root.render(React.createElement(PlayerCoachAssignmentCard));
    };

    const schedule = () => {
      if (frame != null) return;
      frame = window.requestAnimationFrame(reconcile);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("storage", schedule);
    schedule();
  }).catch((error) => {
    window.__shotlabPlayerAssignmentEnhancer = false;
    console.error("player_assignment_enhancer_load_failed", { message: String(error?.message || "unknown") });
  });

  return true;
}
