import { assignmentDueDateFromOffset, normalizeAssignmentDueDate } from "./assignmentDeadline.js";
import { PLAYER_ASSIGNMENT_CHANGE_EVENT, savePlayerAssignmentLocal } from "./playerAssignmentService.js";

const STYLE_ID = "shotlab-coach-quick-assign-deadline-styles";
const SECTION_TEST_ID = "coach-quick-assign-deadline";
const clean = (value, max = 320) => String(value ?? "").trim().slice(0, max);
const identity = (value) => clean(value).toLowerCase();
const parse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

const styles = `
.mcQuickAssignDeadlineBridge{display:grid;gap:7px;margin-top:11px}
.mcQuickAssignDeadlineBridge>span{color:var(--text-3,#7d898f);font:800 8px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.08em;text-transform:uppercase}
.mcQuickAssignDeadlineBridge input{box-sizing:border-box;width:100%;min-height:44px;padding:0 11px;border:1px solid rgba(255,255,255,.12);border-radius:11px;background:#0d1113;color:var(--text-1,#f4f7f8);font:700 12px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color-scheme:dark}
.mcQuickAssignDeadlineBridge input:focus{outline:2px solid color-mix(in srgb,var(--mc,#c8ff1a) 65%,white);outline-offset:2px}
.mcQuickAssignDeadlinePresets{display:flex;flex-wrap:wrap;gap:6px}
.mcQuickAssignDeadlinePresets button{min-height:44px;padding:0 10px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.03);color:var(--text-2,#aab3b8);font:900 9px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
.mcQuickAssignDeadlinePresets button.is-active{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 44%,transparent);color:var(--mc,#c8ff1a)}
.mcQuickAssignDeadlineBridge[hidden]{display:none}
`;

let activeDelivery = null;
let rehydratingLocal = false;

function sessionContext(storage = globalThis?.localStorage) {
  const raw = parse(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] || {} : raw;
  return {
    teamId: clean(session?.teamId || session?.team_id, 180),
    requester: identity(session?.email || session?.userEmail || session?.user_id),
  };
}

export function applyQuickAssignDueDate(payload = {}, { teamId = "", playerIdentity = "", dueDate = "" } = {}) {
  const normalized = normalizeAssignmentDueDate(dueDate);
  const assignment = payload?.assignment || {};
  const payloadTeam = clean(payload?.team_id || payload?.teamId, 180);
  const payloadPlayer = identity(assignment?.player_identity || assignment?.playerIdentity);
  if (clean(payload?.action, 32).toLowerCase() !== "assign") return payload;
  if (!normalized || payloadTeam !== clean(teamId, 180) || payloadPlayer !== identity(playerIdentity)) return payload;
  return { ...payload, assignment: { ...assignment, due_date: normalized } };
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

function refreshPresetState(section) {
  const value = normalizeAssignmentDueDate(section.querySelector("input")?.value);
  section.closest('[data-testid="coach-quick-assign"]')?.setAttribute("data-due-date", value);
  for (const button of section.querySelectorAll("button[data-due-value]")) {
    button.classList.toggle("is-active", button.dataset.dueValue === value);
  }
}

function injectDeadlineControls(dialog) {
  if (!dialog) return;
  let section = dialog.querySelector(`[data-testid="${SECTION_TEST_ID}"]`);
  const locked = ["delivered", "local"].includes(dialog.dataset.deliveryState);
  if (section) {
    section.hidden = locked;
    return;
  }
  const actions = dialog.querySelector(".mcQuickAssignActions");
  if (!actions) return;

  section = document.createElement("section");
  section.className = "mcQuickAssignDeadlineBridge";
  section.dataset.testid = SECTION_TEST_ID;
  section.innerHTML = `<span>Optional due date</span><input type="date" data-testid="coach-quick-assign-due-date" aria-label="Assignment due date"><div class="mcQuickAssignDeadlinePresets" aria-label="Due date shortcuts"></div>`;
  const input = section.querySelector("input");
  input.min = assignmentDueDateFromOffset(0);
  input.addEventListener("change", () => {
    input.value = normalizeAssignmentDueDate(input.value);
    refreshPresetState(section);
  });

  const presets = section.querySelector(".mcQuickAssignDeadlinePresets");
  for (const [days, label] of [[1, "Tomorrow"], [3, "3 days"], [7, "7 days"], [null, "No date"]]) {
    const value = days == null ? "" : assignmentDueDateFromOffset(days);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.dueValue = value;
    button.dataset.testid = days == null ? "coach-quick-assign-due-clear" : `coach-quick-assign-due-${days}`;
    button.addEventListener("click", () => {
      input.value = value;
      refreshPresetState(section);
    });
    presets.appendChild(button);
  }
  section.hidden = locked;
  actions.before(section);
  refreshPresetState(section);
}

function installFetchBridge() {
  if (window.__shotlabQuickAssignDeadlineFetchBridge) return;
  window.__shotlabQuickAssignDeadlineFetchBridge = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const method = String(init?.method || input?.method || "GET").toUpperCase();
    if (activeDelivery && activeDelivery.expiresAt > Date.now() && method === "POST" && /\/v1\/player-assignments(?:\?|$)/.test(url) && typeof init?.body === "string") {
      const body = parse(init.body, null);
      if (body) {
        const next = applyQuickAssignDueDate(body, activeDelivery);
        if (next !== body) {
          activeDelivery.transported = true;
          init = { ...init, body: JSON.stringify(next) };
        }
      }
    }
    return originalFetch(input, init);
  };
}

function captureDelivery(event) {
  const button = event.target?.closest?.('[data-testid="coach-quick-assign"] button');
  const dialog = button?.closest?.('[data-testid="coach-quick-assign"]');
  if (!button || !dialog) return;
  const label = clean(button.textContent, 80).toLowerCase();
  if (label === "close" || label === "done" || label === "open full player" || label === "open player") {
    activeDelivery = null;
    return;
  }
  if (label !== "deliver assignment" && label !== "retry delivery") return;
  const dueDate = normalizeAssignmentDueDate(dialog.querySelector('[data-testid="coach-quick-assign-due-date"]')?.value);
  if (!dueDate) {
    activeDelivery = null;
    return;
  }
  const context = sessionContext();
  activeDelivery = {
    teamId: context.teamId,
    playerIdentity: identity(dialog.dataset.playerEmail),
    dueDate,
    transported: false,
    expiresAt: Date.now() + 15_000,
  };
  window.setTimeout(() => {
    if (activeDelivery?.expiresAt <= Date.now()) activeDelivery = null;
  }, 15_100);
}

function preserveLocalDeadline(event) {
  if (rehydratingLocal || !activeDelivery || activeDelivery.expiresAt <= Date.now()) return;
  const assignment = event?.detail;
  if (!assignment?.assignmentText) return;
  if (clean(assignment.teamId || assignment.team_id, 180) !== activeDelivery.teamId) return;
  if (identity(assignment.playerIdentity || assignment.player_identity) !== activeDelivery.playerIdentity) return;
  const existingDueDate = normalizeAssignmentDueDate(assignment.dueDate || assignment.due_date);
  if (!existingDueDate) {
    rehydratingLocal = true;
    savePlayerAssignmentLocal({ ...assignment, dueDate: activeDelivery.dueDate });
    rehydratingLocal = false;
    return;
  }
  if (activeDelivery.transported && existingDueDate === activeDelivery.dueDate) activeDelivery = null;
}

export function installCoachQuickAssignDeadlineEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachQuickAssignDeadlineEnhancer) return true;
  window.__shotlabCoachQuickAssignDeadlineEnhancer = true;
  ensureStyles();
  installFetchBridge();
  document.addEventListener("click", captureDelivery, true);
  window.addEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, preserveLocalDeadline);

  let frame = null;
  const reconcile = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      injectDeadlineControls(document.querySelector('[data-testid="coach-quick-assign"]'));
    });
  };
  const observer = new MutationObserver(reconcile);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-delivery-state"] });
    reconcile();
  };
  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
  return true;
}
