const STYLE_ID = "shotlab-home-experience-hierarchy";
const ROOT_ATTR = "data-shotlab-home-hierarchy";

export const HOME_EXPERIENCE_HIERARCHY_CSS = `
/* ShotLab home hierarchy: supporting layout only for Coach; the Coach identity,
   decision headline, metrics rail, and primary action are source-owned. */
body.mission-control-active .missionControl {
  max-width: 1320px;
  margin-inline: auto;
  padding-bottom: clamp(42px, 8vw, 88px);
}

body.mission-control-active .mcFocusGrid {
  grid-template-columns: minmax(0, 1.32fr) minmax(280px, .68fr);
  gap: clamp(18px, 2.4vw, 30px);
  margin-top: clamp(28px, 5vw, 54px);
}

body.mission-control-active .mcFocusGrid > .mcSection,
body.mission-control-active .mcFocusGrid > .mcTodayPlan {
  min-height: 100%;
  border-radius: 24px;
}

body.mission-control-active .mcLowerGrid {
  gap: 0;
  margin-top: clamp(28px, 5vw, 54px);
  padding-top: clamp(24px, 4vw, 38px);
  border-top: 1px solid rgba(21, 23, 25, .1);
}

body.mission-control-active .mcLowerGrid > .mcSection {
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
body.mission-control-active .mcLowerGrid > .mcSection + .mcSection {
  border-left: 1px solid rgba(21, 23, 25, .1) !important;
}

body.mission-control-active .mcSectionHead h2 {
  letter-spacing: -.018em;
}

[data-testid="player-daily-command-center"] {
  gap: clamp(20px, 4vw, 34px) !important;
  max-width: 980px;
  margin-inline: auto;
}

[data-testid="player-daily-command-center"] > :nth-child(n+4) {
  box-shadow: none !important;
}

[data-testid="player-daily-command-center"] [data-testid="player-daily-primary-action"] {
  min-height: 56px;
  padding-inline: 26px;
  border-radius: 16px;
  font-size: 15px;
  box-shadow: 0 16px 36px rgba(18, 20, 22, .2) !important;
}

[data-testid="player-daily-command-center"] [data-testid="player-coach-priority-signal"],
[data-testid="player-daily-command-center"] [data-testid="player-daily-momentum-signal"] {
  border-radius: 22px !important;
}

[data-testid="player-daily-command-center"] [data-testid="player-daily-momentum-signal"] {
  border: 0 !important;
  border-top: 1px solid rgba(21, 23, 25, .1) !important;
  border-radius: 0 !important;
  background: transparent !important;
  padding-top: clamp(22px, 4vw, 36px) !important;
}

[data-testid="player-daily-command-center"] [aria-label="Player momentum metrics"] {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 !important;
  border-block: 1px solid rgba(21, 23, 25, .1);
  background: transparent !important;
  border-radius: 0 !important;
}

[data-testid="player-daily-command-center"] [aria-label="Player momentum metrics"] > * {
  border: 0 !important;
  border-right: 1px solid rgba(21, 23, 25, .1) !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
[data-testid="player-daily-command-center"] [aria-label="Player momentum metrics"] > *:last-child { border-right: 0 !important; }

[data-testid="player-daily-command-center"] [data-testid="player-daily-task-queue"] {
  border-top: 1px solid rgba(21, 23, 25, .1);
}

@media (max-width: 760px) {
  body.mission-control-active .mcFocusGrid { grid-template-columns: 1fr; margin-top: 24px; }
  body.mission-control-active .mcFocusGrid > .mcTodayPlan {
    min-height: auto;
    padding-block: 12px;
  }
  body.mission-control-active .mcLowerGrid { grid-template-columns: 1fr; }
  body.mission-control-active .mcLowerGrid > .mcSection + .mcSection {
    border-left: 0 !important;
    border-top: 1px solid rgba(21, 23, 25, .1) !important;
  }
  [data-testid="player-daily-command-center"] [aria-label="Player momentum metrics"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  [${ROOT_ATTR}="v1"] *,
  body.mission-control-active .missionControl * { transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
`;

const markHierarchy = () => {
  if (typeof document === "undefined") return;
  const coach = document.querySelector('[data-testid="coach-command-center-full"]');
  const player = document.querySelector('[data-testid="player-daily-command-center"]');
  coach?.setAttribute("data-design-priority", "single-primary-objective");
  player?.setAttribute("data-design-priority", "single-primary-action");
  document.documentElement.setAttribute(ROOT_ATTR, "v1");
};

export function installHomeExperienceHierarchy() {
  if (typeof document === "undefined") return false;
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.dataset.designSystem = "home-hierarchy-v1";
    style.textContent = HOME_EXPERIENCE_HIERARCHY_CSS;
    document.head.appendChild(style);
  }
  markHierarchy();
  if (typeof MutationObserver !== "undefined" && !window.__shotlabHomeHierarchyObserver) {
    const observer = new MutationObserver(markHierarchy);
    observer.observe(document.body, { childList: true, subtree: true });
    window.__shotlabHomeHierarchyObserver = observer;
  }
  return true;
}
