import phase6AVisualCss from "../styles/Phase6AVisualSystem.css?inline";

export const COACH_HOME_HIERARCHY_STYLE_ID = "shotlab-coach-home-hierarchy-cleanup";
export const PHASE6A_VISUAL_STYLE_ID = "shotlab-phase6a-visual-authority";

export const COACH_HOME_HIERARCHY_CSS = `
body.mission-control-active [data-testid="coach-setup-checklist"] {
  display: none !important;
}
`;

function installPhase6AVisualAuthority() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  let style = document.getElementById(PHASE6A_VISUAL_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = PHASE6A_VISUAL_STYLE_ID;
    style.dataset.shotlabVisualSystem = "phase-6a";
    style.textContent = phase6AVisualCss;
    document.head.appendChild(style);
  }

  // The production build intentionally rewrites/reorders CSS. Re-append the
  // bounded Phase 6A style node on the next task so it remains the final
  // presentation authority without changing app logic or broadening scope.
  window.setTimeout(() => {
    if (style?.isConnected) document.head.appendChild(style);
  }, 0);

  return true;
}

export function installCoachHomeHierarchyEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  installPhase6AVisualAuthority();

  if (document.getElementById(COACH_HOME_HIERARCHY_STYLE_ID)) return true;

  const style = document.createElement("style");
  style.id = COACH_HOME_HIERARCHY_STYLE_ID;
  style.dataset.shotlabCoachHomeHierarchy = "true";
  style.textContent = COACH_HOME_HIERARCHY_CSS;
  document.head.appendChild(style);
  return true;
}
