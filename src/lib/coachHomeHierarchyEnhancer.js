export const COACH_HOME_HIERARCHY_STYLE_ID = "shotlab-coach-home-hierarchy-cleanup";

export const COACH_HOME_HIERARCHY_CSS = `
body.mission-control-active [data-testid="coach-setup-checklist"] {
  display: none !important;
}
`;

export function installCoachHomeHierarchyEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (document.getElementById(COACH_HOME_HIERARCHY_STYLE_ID)) return true;

  const style = document.createElement("style");
  style.id = COACH_HOME_HIERARCHY_STYLE_ID;
  style.dataset.shotlabCoachHomeHierarchy = "true";
  style.textContent = COACH_HOME_HIERARCHY_CSS;
  document.head.appendChild(style);
  return true;
}
