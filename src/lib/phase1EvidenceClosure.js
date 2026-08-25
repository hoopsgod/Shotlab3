const STYLE_ID = "shotlab-phase1-evidence-closure";
const ROSTER_ROOT = "#coach-roster-operations";
const ROSTER_ROW = `${ROSTER_ROOT} > .fade-up > div[role="button"], ${ROSTER_ROOT} > div[role="button"]`;
const QUEUED_INDEX = '[aria-label^="Queued action "]';
const FINAL_A11Y_MARKER = "/* phase1-final-a11y */";
const FINAL_A11Y_CSS = `${FINAL_A11Y_MARKER}
[data-testid="auth-workspace"]>.fade-up,[data-testid="auth-workspace"] .auth-card-enter{animation:none!important;transition:none!important;opacity:1!important;transform:none!important;filter:none!important}
[data-testid="auth-workspace"] button,[data-testid="auth-workspace"] input,[data-testid="auth-workspace"] a{opacity:1!important;filter:none!important}
[data-testid="auth-workspace"] input::placeholder{color:#465159!important;opacity:1!important}
[data-testid="auth-workspace"] a[href$="privacy"]{color:#35434c!important;-webkit-text-fill-color:#35434c!important}
[data-testid="coach-command-center-full"] .mcHealthFacts small{color:#24313a!important;-webkit-text-fill-color:#24313a!important;opacity:1!important}
[data-testid="coach-players-interactive-dashboard"] .teamIdentityTitleStage__action--primary{color:#f8fbf6!important;-webkit-text-fill-color:#f8fbf6!important}`;

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function ensureStyles() {
  if (!document.head) return false;
  const style = document.getElementById(STYLE_ID);
  if (!style) return false;
  if (!style.textContent.includes(FINAL_A11Y_MARKER)) style.textContent += `\n${FINAL_A11Y_CSS}\n`;
  if (document.head.lastElementChild !== style) document.head.appendChild(style);
  return true;
}

function resolveRosterPlayerName(row) {
  if (!(row instanceof HTMLElement)) return "";
  const content = row.children?.[1];
  const details = content instanceof HTMLElement ? content.children?.[1] : null;
  const identityName = details instanceof HTMLElement ? cleanText(details.querySelector("span")?.textContent) : "";
  return identityName
    || cleanText(row.querySelector('[data-player-name]')?.getAttribute("data-player-name"))
    || cleanText(row.querySelector("strong")?.textContent)
    || cleanText(row.querySelector("span")?.textContent);
}

function ensureRosterProfileButton(row) {
  if (!(row instanceof HTMLElement)) return false;
  const nestedControls = row.querySelectorAll("button, a[href], input, select, textarea");
  if (!nestedControls.length) return false;

  const name = resolveRosterPlayerName(row) || "player";
  row.classList.add("phase1RosterRow");
  row.removeAttribute("role");
  row.removeAttribute("tabindex");
  row.dataset.phase1RosterRow = "true";
  row.dataset.phase1RosterPlayerName = name;

  const existingButton = row.querySelector('[data-phase1-open-profile="true"]');
  if (existingButton instanceof HTMLButtonElement) {
    existingButton.setAttribute("aria-label", `Open ${name} profile`);
    return true;
  }

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
