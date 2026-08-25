const STYLE_ID = "shotlab-phase1-evidence-closure";
const STYLE_TEXT = `
@media (min-width:900px) and (max-width:1100px){
html,body,#root,.app-shell.performance-shell,.app-shell.performance-shell .shell-main,.app-shell.performance-shell .content-wrap,.app-shell.performance-shell .player-scroll-container,.app-shell.performance-shell .coach-scroll-container,.app-shell.performance-shell .pageShell,.app-shell.performance-shell .performance-workspace{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
.app-shell.performance-shell{width:100vw!important;max-width:100vw!important;grid-template-columns:minmax(190px,210px) minmax(0,1fr)!important;overflow-x:clip!important}
.app-shell.performance-shell .shell-main,.app-shell.performance-shell .content-wrap,.app-shell.performance-shell .player-scroll-container,.app-shell.performance-shell .coach-scroll-container{width:100%!important}
.app-shell.performance-shell [data-density="decision-first"],.app-shell.performance-shell>aside:has([data-density="decision-first"]),.app-shell.performance-shell>div:has(>[data-density="decision-first"]){display:none!important}
}
[data-testid="auth-workspace"] button,[data-testid="auth-workspace"] input,[data-testid="auth-workspace"] a{opacity:1!important;filter:none!important;mix-blend-mode:normal!important}
[data-testid="auth-workspace"] button[role="tab"]{color:#26323a!important;-webkit-text-fill-color:#26323a!important}
[data-testid="auth-workspace"] input::placeholder{color:#59636a!important;opacity:1!important}
[data-testid="auth-workspace"] .cta-primary{background:#c8ff1a!important;color:#0b0d10!important;-webkit-text-fill-color:#0b0d10!important}
[data-testid="auth-workspace"] .auth-demo-enter .btn-v:first-child{background:#f8f7f2!important;color:#26323a!important;-webkit-text-fill-color:#26323a!important}
[data-testid="auth-workspace"] .auth-demo-enter .btn-v:last-child{background:#0d171e!important;color:#f5f8f9!important;-webkit-text-fill-color:#f5f8f9!important}
[data-testid="auth-workspace"] a[href$="privacy"]{color:#46545d!important;-webkit-text-fill-color:#46545d!important}
[data-testid="coach-command-center-full"] .mcSessionSummary strong{color:#f5f8f9!important;-webkit-text-fill-color:#f5f8f9!important}
[data-testid="coach-command-center-full"] .mcSessionSummary small{color:#c5d0d6!important;-webkit-text-fill-color:#c5d0d6!important}
[data-testid="coach-command-center-full"] .mcHealthScore,[data-testid="coach-command-center-full"] [data-shotlab-response-row="true"] time{color:#405a00!important;-webkit-text-fill-color:#405a00!important}
[data-testid="coach-command-center-full"] .mcHealthFacts small{color:#4d5860!important;-webkit-text-fill-color:#4d5860!important}
[data-testid="coach-command-center-full"] .mcTeamHealth .mcTextLink{color:#43515a!important;-webkit-text-fill-color:#43515a!important}
[data-testid="coach-players-interactive-dashboard"] .teamIdentityTitleStage__action{color:#40556f!important;-webkit-text-fill-color:#40556f!important}
[data-testid="coach-players-filter-rail"] button[aria-pressed="true"]{color:#405718!important;-webkit-text-fill-color:#405718!important}
[data-testid="coach-players-insight-grid"] [data-visual-role="insight-card"]>div:first-child,[data-testid="coach-player-invite-dashboard-section"]>div:first-child>div:first-child>div:first-child{color:#4e647d!important;-webkit-text-fill-color:#4e647d!important}
[data-testid="coach-players-insight-grid"] [data-visual-role="insight-actions"] button{color:#40566c!important;-webkit-text-fill-color:#40566c!important}
#coach-roster-operations [data-phase1-roster-row="true"] .phase1RosterProfileAction{width:100%;min-height:34px;padding:0 10px;border:1px solid rgba(17,20,17,.16);border-radius:8px;background:#f5f6f2;color:#29302b;font:700 10px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;letter-spacing:.04em;white-space:nowrap;cursor:pointer;touch-action:manipulation}
#coach-roster-operations [data-phase1-roster-row="true"] .phase1RosterProfileAction:focus-visible{outline:3px solid rgba(95,118,0,.45);outline-offset:2px}
[data-testid="mobile-navigation-dock"] button span{color:#f0f5f3!important;-webkit-text-fill-color:#f0f5f3!important}
[data-player-workspace-filter-rail="true"] button[aria-pressed="true"] span{color:#3f5810!important;-webkit-text-fill-color:#3f5810!important}
[data-testid="player-progress-story"] [data-testid="player-progress-next-focus"]>div>span,[data-testid="player-progress-story"] [data-testid="player-progress-next-focus"] span:first-child{color:#536800!important;-webkit-text-fill-color:#536800!important}
details[data-testid="player-progress-full-profile"] [data-visual-role="disclosure-title"]{color:#26323a!important;-webkit-text-fill-color:#26323a!important}
details[data-testid="player-progress-full-profile"] [data-visual-role="disclosure-meta"]{color:#52616a!important;-webkit-text-fill-color:#52616a!important}
`;

const ROSTER_ROOT = "#coach-roster-operations";
const ROSTER_ROW = `${ROSTER_ROOT} > div[role="button"]`;
const QUEUED_INDEX = '[aria-label^="Queued action "]';

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function ensureStyles() {
  if (!document.head) return false;
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
  }
  if (document.head.lastElementChild !== style) document.head.appendChild(style);
  return true;
}

function ensureRosterProfileButton(row) {
  if (!(row instanceof HTMLElement)) return false;
  const nestedControls = row.querySelectorAll("button, a[href], input, select, textarea");
  if (!nestedControls.length) return false;

  row.removeAttribute("role");
  row.removeAttribute("tabindex");
  row.dataset.phase1RosterRow = "true";

  if (row.querySelector('[data-phase1-open-profile="true"]')) return true;

  const name = cleanText(row.querySelector("strong")?.textContent) || "player";
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.phase1OpenProfile = "true";
  button.className = "phase1RosterProfileAction";
  button.setAttribute("aria-label", `Open ${name} profile`);
  button.textContent = "PROFILE";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    row.click();
  });

  const content = row.lastElementChild;
  const actionColumn = content instanceof HTMLElement ? content.lastElementChild : null;
  if (actionColumn instanceof HTMLElement && actionColumn.querySelector("button")) actionColumn.appendChild(button);
  else row.appendChild(button);
  return true;
}

function normalizeQueuedActionMarkers(root = document) {
  let changed = false;
  for (const node of root.querySelectorAll?.(QUEUED_INDEX) || []) {
    if (!(node instanceof HTMLElement)) continue;
    node.removeAttribute("aria-label");
    node.setAttribute("aria-hidden", "true");
    changed = true;
  }
  return changed;
}

function normalizeRosterRows(root = document) {
  let changed = false;
  for (const row of root.querySelectorAll?.(ROSTER_ROW) || []) changed = ensureRosterProfileButton(row) || changed;
  return changed;
}

function applyPhase1EvidenceClosure(root = document) {
  ensureStyles();
  normalizeQueuedActionMarkers(root);
  normalizeRosterRows(root);
}

export function installPhase1EvidenceClosure() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabPhase1EvidenceClosureInstalled) return true;
  window.__shotlabPhase1EvidenceClosureInstalled = true;

  let frame = null;
  const schedule = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      applyPhase1EvidenceClosure(document);
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("focus", schedule);
  window.addEventListener("resize", schedule, { passive: true });
  schedule();
  return true;
}

installPhase1EvidenceClosure();
