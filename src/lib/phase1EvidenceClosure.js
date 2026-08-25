const STYLE_ID = "shotlab-phase1-evidence-closure";
const ROSTER_ROOT = "#coach-roster-operations";
const ROSTER_ROW = `${ROSTER_ROOT} > div[role="button"]`;
const QUEUED_INDEX = '[aria-label^="Queued action "]';

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function ensureStyles() {
  if (!document.head) return false;
  const style = document.getElementById(STYLE_ID);
  if (!style) return false;
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