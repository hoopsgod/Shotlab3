import React from "react";
import { createRoot } from "react-dom/client";
import PlayerCoachAssignmentCard from "../components/PlayerCoachAssignmentCard.jsx";

const HOST_TEST_ID = "player-coach-assignment-host";

export function installPlayerAssignmentEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabPlayerAssignmentEnhancer) return true;
  window.__shotlabPlayerAssignmentEnhancer = true;

  let host = null;
  let root = null;
  let target = null;
  let frame = null;

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
    const coachSignal = nextTarget.querySelector('[data-testid="player-coach-priority-signal"]');
    if (coachSignal) nextTarget.insertBefore(host, coachSignal);
    else nextTarget.appendChild(host);
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
  return true;
}
