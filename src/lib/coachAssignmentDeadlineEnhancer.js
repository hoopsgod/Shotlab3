import { formatAssignmentDueDate, isAssignmentOverdue, normalizeAssignmentDueDate } from "./assignmentDeadline.js";
import {
  ASSIGNMENT_READ_STATES,
  loadTeamPlayerAssignments,
  PLAYER_ASSIGNMENT_CHANGE_EVENT,
} from "./playerAssignmentService.js";

const STYLE_ID = "shotlab-coach-assignment-deadline-styles";
const clean = (value, max = 320) => String(value ?? "").trim().slice(0, max);
const identity = (value) => clean(value).toLowerCase();
const parse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

const styles = `
.mcAssignmentAccountabilityRow.is-overdue{border-color:rgba(255,116,92,.46);background:rgba(255,116,92,.055)}
.mcAssignmentAccountabilityRow.is-overdue .mcAssignmentAccountabilityDot{background:#ff745c;box-shadow:0 0 0 3px rgba(255,116,92,.12)}
.mcAssignmentDeadlineTag{color:var(--text-2,#aab3b8);font-weight:800}
.mcAssignmentDeadlineTag.is-overdue{color:#ff9b87}
.mcAssignmentAccountabilityBadge.is-overdue{border-color:rgba(255,116,92,.46);background:rgba(255,116,92,.09);color:#ff9b87}
`;

function sessionTeamId(storage = globalThis?.localStorage) {
  const raw = parse(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] || {} : raw;
  return clean(session?.teamId || session?.team_id, 180);
}

export function buildAssignmentDeadlineMap(assignments = [], { now = new Date() } = {}) {
  const map = new Map();
  for (const row of Array.isArray(assignments) ? assignments : []) {
    const playerIdentity = identity(row?.playerIdentity || row?.player_identity);
    const dueDate = normalizeAssignmentDueDate(row?.dueDate || row?.due_date);
    if (!playerIdentity || !dueDate) continue;
    const state = identity(row?.state || "assigned");
    map.set(playerIdentity, {
      dueDate,
      state,
      overdue: isAssignmentOverdue({ dueDate, state, now }),
      label: formatAssignmentDueDate(dueDate),
    });
  }
  return map;
}

export function resolveAssignmentDeadlineRefresh(result = {}, currentDeadlines = new Map(), options = {}) {
  const readState = result?.readState || (result?.ok ? ASSIGNMENT_READ_STATES.EMPTY : ASSIGNMENT_READ_STATES.FAILURE);
  if (readState === ASSIGNMENT_READ_STATES.FAILURE || readState === ASSIGNMENT_READ_STATES.DENIED) {
    return { deadlines: currentDeadlines, readState };
  }
  return {
    deadlines: buildAssignmentDeadlineMap(result?.assignments || [], options),
    readState,
  };
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

function decoratePanel(deadlines, readState) {
  const panel = document.querySelector('[data-testid="coach-assignment-accountability"]');
  if (!panel) return;
  panel.dataset.assignmentReadState = readState;
  const actionRegion = panel.querySelector('[aria-label="Players needing assignment action"]');
  const overdueRows = [];

  for (const row of panel.querySelectorAll('.mcAssignmentAccountabilityRow[data-player-email]')) {
    row.classList.remove("is-overdue");
    delete row.dataset.assignmentOverdue;
    delete row.dataset.assignmentDueDate;
    row.querySelector(".mcAssignmentDeadlineTag")?.remove();
    const deadline = deadlines.get(identity(row.dataset.playerEmail));
    if (!deadline) continue;
    row.dataset.assignmentDueDate = deadline.dueDate;
    row.dataset.assignmentOverdue = String(deadline.overdue);
    row.classList.toggle("is-overdue", deadline.overdue);
    const detail = row.querySelector("small");
    if (detail) {
      const tag = document.createElement("b");
      tag.className = `mcAssignmentDeadlineTag ${deadline.overdue ? "is-overdue" : ""}`;
      tag.textContent = deadline.overdue ? ` · OVERDUE ${deadline.label}` : ` · Due ${deadline.label}`;
      detail.appendChild(tag);
    }
    if (deadline.overdue && actionRegion?.contains(row)) overdueRows.push({ row, dueDate: deadline.dueDate });
  }

  overdueRows.sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  if (actionRegion && overdueRows.length) {
    const current = [...actionRegion.children];
    const overdueSet = new Set(overdueRows.map((entry) => entry.row));
    const desired = [...overdueRows.map((entry) => entry.row), ...current.filter((row) => !overdueSet.has(row))];
    if (desired.some((row, index) => current[index] !== row)) desired.forEach((row) => actionRegion.appendChild(row));
  }

  const overdueCount = overdueRows.length;
  panel.dataset.overdueCount = String(overdueCount);
  const badge = panel.querySelector(".mcAssignmentAccountabilityBadge");
  if (badge) {
    if (!badge.classList.contains("is-overdue")) badge.dataset.deadlineBaseText = badge.textContent || "";
    badge.classList.toggle("is-overdue", overdueCount > 0);
    badge.textContent = overdueCount > 0 ? `${overdueCount} OVERDUE` : badge.dataset.deadlineBaseText;
  }
  const meta = panel.querySelector(".mcAssignmentAccountabilityMeta");
  if (meta) {
    if (meta.dataset.deadlineBaseText == null) meta.dataset.deadlineBaseText = meta.textContent || "";
    const stateSuffix = readState === ASSIGNMENT_READ_STATES.DEGRADED || readState === ASSIGNMENT_READ_STATES.FAILURE
      ? " · sync delayed"
      : readState === ASSIGNMENT_READ_STATES.DENIED
        ? " · assignment data unavailable"
        : "";
    meta.dataset.deadlineDecorated = overdueCount > 0 || stateSuffix ? "true" : "";
    meta.textContent = overdueCount > 0
      ? `${meta.dataset.deadlineBaseText} · ${overdueCount} overdue${stateSuffix}`
      : `${meta.dataset.deadlineBaseText}${stateSuffix}`;
  }
}

export function installCoachAssignmentDeadlineEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachAssignmentDeadlineEnhancer) return true;
  window.__shotlabCoachAssignmentDeadlineEnhancer = true;
  ensureStyles();

  let deadlines = new Map();
  let readState = ASSIGNMENT_READ_STATES.EMPTY;
  let loading = false;
  let frame = null;
  let observer = null;
  const observe = () => {
    if (!observer || !document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
  };
  const render = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      observer?.disconnect();
      decoratePanel(deadlines, readState);
      observe();
    });
  };
  const refresh = async () => {
    if (loading) return;
    const teamId = sessionTeamId();
    if (!teamId) {
      deadlines = new Map();
      readState = ASSIGNMENT_READ_STATES.EMPTY;
      render();
      return;
    }
    loading = true;
    try {
      const result = await loadTeamPlayerAssignments({ teamId });
      const resolved = resolveAssignmentDeadlineRefresh(result, deadlines);
      deadlines = resolved.deadlines;
      readState = resolved.readState;
    } catch {
      readState = ASSIGNMENT_READ_STATES.FAILURE;
    } finally {
      loading = false;
      render();
    }
  };

  observer = new MutationObserver(render);
  const start = () => {
    observe();
    void refresh();
  };
  window.addEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, refresh);
  window.addEventListener("storage", refresh);
  window.addEventListener("focus", refresh);
  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
  return true;
}
