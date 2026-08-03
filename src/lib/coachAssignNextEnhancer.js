import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { assignmentDueDateFromOffset, normalizeAssignmentDueDate } from "./assignmentDeadline.js";
import { PLAYER_ASSIGNMENT_CHANGE_EVENT } from "./playerAssignmentService.js";
import { loadCoachAssignmentHistory, saveNextPlayerAssignment } from "./playerAssignmentHistoryService.js";

const STYLE_ID = "shotlab-coach-assign-next-styles";
const PORTAL_ID = "shotlab-coach-assign-next-portal";
const HISTORY_HOST_TEST_ID = "coach-assignment-history-host";
const OPEN_EVENT = "shotlab:coach-assign-next-open";

const styles = `
.mcAssignNextPortal{position:fixed;inset:0;z-index:2147481100;pointer-events:none}.mcAssignNextPortal:empty{display:none}
.mcAssignNextLayer{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));pointer-events:auto}
.mcAssignNextBackdrop{position:absolute;inset:0;border:0;background:rgba(2,4,6,.78);backdrop-filter:blur(8px)}
.mcAssignNextSheet{position:relative;box-sizing:border-box;width:min(560px,100%);max-height:calc(100dvh - 24px);overflow:auto;padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:linear-gradient(155deg,rgba(26,29,31,.98),rgba(8,10,11,.99));box-shadow:0 24px 84px rgba(0,0,0,.62)}
.mcAssignNextHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.mcAssignNextHead small,.mcAssignNextField span,.mcAssignNextDue>span,.mcAssignmentHistory summary,.mcAssignmentHistoryRow small{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}
.mcAssignNextHead small{display:block;color:var(--text-3,#7d898f);font-size:8px;font-weight:800}.mcAssignNextHead h2{margin:4px 0 0;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:23px;font-weight:400;letter-spacing:.035em}
.mcAssignNextClose{min-width:44px;min-height:44px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.025);color:var(--text-2,#aab3b8);font:900 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;cursor:pointer}
.mcAssignNextCopy{margin:10px 0 0;color:var(--text-2,#aab3b8);font:600 12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcAssignNextPrevious{margin-top:11px;padding:11px;border:1px solid color-mix(in srgb,var(--mc,#c8ff1a) 16%,rgba(255,255,255,.07));border-radius:12px;background:color-mix(in srgb,var(--mc,#c8ff1a) 4%,rgba(255,255,255,.018));color:var(--text-2,#aab3b8);font:600 11px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcAssignNextField,.mcAssignNextDue{display:grid;gap:7px;margin-top:12px}.mcAssignNextField span,.mcAssignNextDue>span{color:var(--text-3,#7d898f);font-size:8px;font-weight:800}.mcAssignNextField textarea,.mcAssignNextDue input{box-sizing:border-box;width:100%;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0d1113;color:var(--text-1,#f4f7f8)}
.mcAssignNextField textarea{min-height:104px;padding:11px 12px;resize:vertical;font:600 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.mcAssignNextDue input{min-height:44px;padding:0 11px;color-scheme:dark}
.mcAssignNextPresets{display:flex;flex-wrap:wrap;gap:6px}.mcAssignNextPresets button,.mcAssignNextActions button{min-height:44px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.03);color:var(--text-2,#aab3b8);font:900 9px/1 'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.07em;cursor:pointer}.mcAssignNextPresets button{padding:0 10px}.mcAssignNextPresets button.is-active{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 44%,transparent);color:var(--mc,#c8ff1a)}
.mcAssignNextActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.mcAssignNextActions button.is-primary{background:var(--mc,#c8ff1a);color:#080a08;border-color:color-mix(in srgb,var(--mc,#c8ff1a) 56%,transparent)}.mcAssignNextActions button:disabled,.mcAssignNextPresets button:disabled,.mcAssignNextDue input:disabled,.mcAssignNextField textarea:disabled{opacity:.55;cursor:wait}
.mcAssignNextStatus{min-height:20px;margin-top:9px;color:var(--text-2,#aab3b8);font:600 10px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.mcAssignNextStatus.is-error{color:#ffb8a8}
.mcAssignmentHistoryHost{margin-top:12px}.mcAssignmentHistory{border-top:1px solid rgba(255,255,255,.07);padding-top:10px}.mcAssignmentHistory summary{min-height:34px;color:var(--text-2,#aab3b8);font-size:9px;font-weight:800;cursor:pointer}.mcAssignmentHistoryRows{display:grid;gap:7px}.mcAssignmentHistoryRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.014)}.mcAssignmentHistoryRow strong{display:block;color:var(--text-1,#f4f7f8);font:800 12px/1.3 'Barlow Condensed','Arial Narrow',sans-serif}.mcAssignmentHistoryRow small{display:block;margin-top:3px;color:var(--text-3,#7d898f);font-size:8px;font-weight:700}.mcAssignmentHistoryRow em{max-width:210px;color:var(--text-2,#aab3b8);font:600 10px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:right;overflow-wrap:anywhere}.mcAssignmentHistoryStatus{margin-top:7px;color:var(--text-3,#7d898f);font:600 9px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
@media(max-width:420px){.mcAssignNextLayer{padding:8px;padding-bottom:max(8px,env(safe-area-inset-bottom))}.mcAssignNextSheet{max-height:calc(100dvh - 16px)}.mcAssignNextActions{grid-template-columns:1fr}.mcAssignmentHistoryRow{grid-template-columns:1fr}.mcAssignmentHistoryRow em{max-width:none;text-align:left}}
`;

const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const parse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const sessionTeamId = () => {
  const raw = parse(globalThis?.localStorage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] || {} : raw;
  return clean(session?.teamId || session?.team_id, 180);
};
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

function AssignNextSheet({ row, onClose }) {
  const [draft, setDraft] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState("Create the next assignment. The completed assignment will remain in history.");
  const [error, setError] = useState(false);

  const submit = async () => {
    const text = clean(draft);
    if (!text) {
      setError(true);
      setStatus("Add the next assignment before delivering it.");
      return;
    }
    setSaving(true);
    setError(false);
    setStatus("Preserving the completed assignment and delivering the next one…");
    const result = await saveNextPlayerAssignment({
      teamId: row.teamId,
      playerIdentity: row.playerIdentity,
      playerName: row.playerName,
      assignmentText: text,
      dueDate,
    });
    setSaving(false);
    setError(!result.ok);
    setLocked(Boolean(result.ok));
    setStatus(result.message || (result.ok ? "Next assignment delivered." : "Next assignment could not be delivered."));
  };

  const presets = [
    { label: "Tomorrow", value: assignmentDueDateFromOffset(1) },
    { label: "3 days", value: assignmentDueDateFromOffset(3) },
    { label: "7 days", value: assignmentDueDateFromOffset(7) },
    { label: "No date", value: "" },
  ];

  return React.createElement(
    "section",
    { className: "mcAssignNextSheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "mc-assign-next-title", "data-testid": "coach-assign-next", "data-player-email": row.playerIdentity, "data-state": locked ? "delivered" : error ? "error" : "editing" },
    React.createElement("div", { className: "mcAssignNextHead" },
      React.createElement("span", null, React.createElement("small", null, "Completed assignment · next decision"), React.createElement("h2", { id: "mc-assign-next-title" }, row.playerName || row.playerIdentity)),
      React.createElement("button", { type: "button", className: "mcAssignNextClose", onClick: onClose, "aria-label": "Close assign next" }, "Close")),
    React.createElement("p", { className: "mcAssignNextCopy" }, locked ? "The player now has one new active assignment. The previous completion remains read-only in history." : "Assigning next never overwrites active work and never includes private coach notes."),
    row.assignmentText ? React.createElement("div", { className: "mcAssignNextPrevious", "data-testid": "coach-assign-next-previous" }, `Completed: ${row.assignmentText}`) : null,
    React.createElement("label", { className: "mcAssignNextField" }, React.createElement("span", null, "Next assignment"), React.createElement("textarea", { value: draft, maxLength: 4000, disabled: saving || locked, onChange: (event) => setDraft(event.target.value), placeholder: "Example: Complete the five-spot ladder and record each spot.", "data-testid": "coach-assign-next-input" })),
    !locked ? React.createElement("section", { className: "mcAssignNextDue", "aria-label": "Optional next assignment due date" },
      React.createElement("span", null, "Optional due date"),
      React.createElement("input", { type: "date", min: assignmentDueDateFromOffset(0), value: dueDate, disabled: saving, onChange: (event) => setDueDate(normalizeAssignmentDueDate(event.target.value)), "data-testid": "coach-assign-next-due-date" }),
      React.createElement("div", { className: "mcAssignNextPresets" }, ...presets.map((preset) => React.createElement("button", { type: "button", key: preset.label, className: dueDate === preset.value ? "is-active" : "", disabled: saving, onClick: () => setDueDate(preset.value) }, preset.label)))) : null,
    React.createElement("div", { className: "mcAssignNextActions" },
      locked ? React.createElement("button", { type: "button", className: "is-primary", onClick: onClose }, "Done") : React.createElement("button", { type: "button", className: "is-primary", disabled: saving, onClick: submit, "data-testid": "coach-assign-next-submit" }, saving ? "Delivering…" : error ? "Retry delivery" : "Deliver next assignment"),
      !locked ? React.createElement("button", { type: "button", disabled: saving, onClick: onClose }, "Cancel") : null),
    React.createElement("div", { className: `mcAssignNextStatus ${error ? "is-error" : ""}`, role: "status", "aria-live": "polite" }, status),
  );
}

function AssignNextPortal() {
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const open = (event) => {
      const row = event?.detail || {};
      if (row.teamId && row.playerIdentity) setSelected(row);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);
  useEffect(() => {
    if (!selected) return undefined;
    const escape = (event) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [selected]);
  if (!selected) return null;
  return React.createElement("div", { className: "mcAssignNextLayer", "data-testid": "coach-assign-next-layer" },
    React.createElement("button", { type: "button", className: "mcAssignNextBackdrop", onClick: () => setSelected(null), "aria-label": "Close assign next" }),
    React.createElement(AssignNextSheet, { row: selected, onClose: () => setSelected(null) }));
}

function AssignmentHistoryPanel() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => loadCoachAssignmentHistory({ teamId: sessionTeamId() }).then((next) => { if (!cancelled) setResult(next); });
    load();
    window.addEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, []);
  const history = Array.isArray(result?.history) ? result.history : [];
  if (!history.length) return null;
  return React.createElement("details", { className: "mcAssignmentHistory", "data-testid": "coach-assignment-history", "data-history-count": String(history.length) },
    React.createElement("summary", null, `Preserved assignment history · ${history.length}`),
    React.createElement("div", { className: "mcAssignmentHistoryRows", "aria-label": "Preserved completed assignments" }, ...history.slice(0, 8).map((row) => React.createElement("div", { className: "mcAssignmentHistoryRow", key: `${row.teamId}:${row.playerIdentity}:${row.createdAt}`, "data-assignment-history": "true", "data-player-email": row.playerIdentity },
      React.createElement("span", null, React.createElement("strong", null, row.playerName || row.playerIdentity), React.createElement("small", null, `Completed ${formatDate(row.completedAt) || "previously"}`)),
      React.createElement("em", null, row.assignmentText)))),
    React.createElement("div", { className: "mcAssignmentHistoryStatus" }, result?.storageMode === "team_remote" ? "Server-preserved completion history · private coach notes excluded" : "Local or demo completion history"));
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

function mountPortal() {
  if (!document.body || document.getElementById(PORTAL_ID)) return;
  const host = document.createElement("div");
  host.id = PORTAL_ID;
  host.className = "mcAssignNextPortal";
  document.body.appendChild(host);
  createRoot(host).render(React.createElement(AssignNextPortal));
}

export function installCoachAssignNextEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachAssignNextEnhancer) return true;
  window.__shotlabCoachAssignNextEnhancer = true;
  ensureStyles();
  mountPortal();

  let historyHost = null;
  let historyRoot = null;
  let frame = null;
  const reconcile = () => {
    frame = null;
    const panel = document.querySelector('[data-testid="coach-assignment-accountability"]');
    document.querySelectorAll('[data-testid="coach-assignment-accountability"] .mcAssignmentAccountabilityRow[data-assignment-state="completed"]:not([data-assignment-history="true"])').forEach((row) => {
      const action = row.querySelector("em");
      if (action) action.textContent = "Assign next ›";
      const name = clean(row.querySelector("strong")?.textContent, 320);
      row.setAttribute("aria-label", `Assign the next coach assignment to ${name || "player"}`);
    });
    if (!panel) {
      historyRoot?.unmount?.();
      historyHost?.remove?.();
      historyRoot = null;
      historyHost = null;
      return;
    }
    if (!historyHost?.isConnected) {
      historyHost = document.createElement("div");
      historyHost.className = "mcAssignmentHistoryHost";
      historyHost.dataset.testid = HISTORY_HOST_TEST_ID;
      panel.appendChild(historyHost);
      historyRoot = createRoot(historyHost);
      historyRoot.render(React.createElement(AssignmentHistoryPanel));
    }
  };
  const schedule = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(reconcile);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  schedule();

  document.addEventListener("click", (event) => {
    const row = event.target?.closest?.('[data-testid="coach-assignment-accountability"] .mcAssignmentAccountabilityRow[data-assignment-state="completed"]:not([data-assignment-history="true"])');
    if (!row) return;
    const teamId = sessionTeamId();
    const playerIdentity = clean(row.getAttribute("data-player-email"), 320).toLowerCase();
    if (!teamId || !playerIdentity) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: {
      teamId,
      playerIdentity,
      playerName: clean(row.querySelector("strong")?.textContent || playerIdentity, 320),
      assignmentText: clean(row.closest("details")?.querySelector(`[data-player-email="${CSS.escape(playerIdentity)}"] small`)?.textContent || "", 4000),
    } }));
  }, true);

  return true;
}

export { OPEN_EVENT as COACH_ASSIGN_NEXT_OPEN_EVENT };
