import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { assignmentDueDateFromOffset, normalizeAssignmentDueDate } from "./assignmentDeadline.js";
import { openExactPlayerFollowUp } from "./coachAssignmentOutcomeEnhancer.js";
import { loadTeamPlayerAssignments, savePlayerAssignment } from "./playerAssignmentService.js";

const STYLE_ID = "shotlab-coach-quick-assign-styles";
const HOST_ID = "shotlab-coach-quick-assign-host";
const HOST_TEST_ID = "coach-quick-assign-host";
const OPEN_EVENT = "shotlab:coach-quick-assign-open";
const QUICK_ASSIGN_MAX_LENGTH = 4000;
const RECENT_ASSIGNMENT_LIMIT = 4;

const styles = `
.mcQuickAssignPortalHost{position:fixed;inset:0;z-index:2147481000;pointer-events:none}
.mcQuickAssignPortalHost:empty{display:none}
.mcQuickAssignLayer{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));pointer-events:auto}
.mcQuickAssignBackdrop{position:absolute;inset:0;border:0;background:rgba(2,4,6,.76);backdrop-filter:blur(8px);cursor:pointer}
.mcQuickAssign{position:relative;box-sizing:border-box;width:min(560px,100%);max-height:calc(100dvh - 24px);overflow:auto;overscroll-behavior:contain;box-shadow:0 22px 80px rgba(0,0,0,.58)}
.mcQuickAssign::after{content:"";position:absolute;right:-58px;top:-68px;width:170px;height:170px;border-radius:50%;background:color-mix(in srgb,var(--mc,#c8ff1a) 8%,transparent);filter:blur(34px);pointer-events:none}
.mcQuickAssign>*{position:relative;z-index:1}
.mcQuickAssignHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.mcQuickAssignEyebrow,.mcQuickAssignField span,.mcQuickAssignRecentTitle,.mcQuickAssignDeadline>span{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}
.mcQuickAssignEyebrow{display:block;color:var(--text-3,#7d898f);font-size:8px;font-weight:800}
.mcQuickAssignHead h2{margin:4px 0 0;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;font-weight:400;line-height:1;letter-spacing:.035em}
.mcQuickAssignClose{min-width:44px;min-height:44px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.025);color:var(--text-2,#aab3b8);font:900 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
.mcQuickAssignCopy{margin:9px 0 0;color:var(--text-2,#aab3b8);font:600 11px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcQuickAssignRecent{display:grid;gap:7px;margin-top:12px}
.mcQuickAssignRecentTitle{color:var(--text-3,#7d898f);font-size:8px;font-weight:800}
.mcQuickAssignRecentList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
.mcQuickAssignRecent button{box-sizing:border-box;min-width:0;min-height:44px;padding:9px 10px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.03);color:var(--text-2,#aab3b8);font:700 11px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:left;cursor:pointer;overflow-wrap:anywhere}
.mcQuickAssignRecent button:hover,.mcQuickAssignRecent button:focus-visible{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 44%,transparent);color:var(--text-1,#f4f7f8)}
.mcQuickAssignRecent button:disabled{opacity:.55;cursor:wait}
.mcQuickAssignField{display:grid;gap:7px;margin-top:11px}
.mcQuickAssignField span,.mcQuickAssignDeadline>span{color:var(--text-3,#7d898f);font-size:8px;font-weight:800}
.mcQuickAssignField textarea{box-sizing:border-box;width:100%;min-height:96px;resize:vertical;padding:11px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0d1113;color:var(--text-1,#f4f7f8);font:600 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcQuickAssignField textarea:focus,.mcQuickAssignDeadline input:focus{outline:2px solid color-mix(in srgb,var(--mc,#c8ff1a) 65%,white);outline-offset:2px}
.mcQuickAssignField textarea:disabled{opacity:.72;resize:none}
.mcQuickAssignDeadline{display:grid;gap:7px;margin-top:11px}
.mcQuickAssignDeadline input{box-sizing:border-box;width:100%;min-height:44px;padding:0 11px;border:1px solid rgba(255,255,255,.12);border-radius:11px;background:#0d1113;color:var(--text-1,#f4f7f8);font:700 12px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color-scheme:dark}
.mcQuickAssignDeadlinePresets{display:flex;flex-wrap:wrap;gap:6px}
.mcQuickAssignDeadlinePresets button{min-height:44px;padding:0 10px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.03);color:var(--text-2,#aab3b8);font:900 9px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
.mcQuickAssignDeadlinePresets button.is-active{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 44%,transparent);color:var(--mc,#c8ff1a)}
.mcQuickAssignActions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin-top:10px}
.mcQuickAssignActions button{min-height:44px;padding:0 12px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.035);color:var(--text-1,#f4f7f8);font:900 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
.mcQuickAssignActions button.is-primary{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 44%,transparent);background:var(--mc,#c8ff1a);color:#080a08}
.mcQuickAssignActions button:disabled,.mcQuickAssignDeadlinePresets button:disabled,.mcQuickAssignDeadline input:disabled{opacity:.55;cursor:wait}
.mcQuickAssignStatus{min-height:18px;margin-top:9px;color:var(--text-2,#aab3b8);font:600 10px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcQuickAssignStatus.is-error{color:#ffb8a8}
.mcQuickAssign[data-delivery-state="delivered"]{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 42%,rgba(255,255,255,.08))}
.mcQuickAssign[data-delivery-state="local"],.mcQuickAssign[data-delivery-state="error"]{border-color:rgba(255,181,71,.34)}
@media(max-width:420px){.mcQuickAssignLayer{padding:8px;padding-bottom:max(8px,env(safe-area-inset-bottom))}.mcQuickAssign{max-height:calc(100dvh - 16px)}.mcQuickAssignRecentList,.mcQuickAssignActions{grid-template-columns:1fr}.mcQuickAssignHead h2{font-size:20px}}
@media(prefers-reduced-motion:reduce){.mcQuickAssignLayer,.mcQuickAssign{scroll-behavior:auto}}
`;

const clean = (value, max = QUICK_ASSIGN_MAX_LENGTH) => String(value ?? "").trim().slice(0, max);
const parse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};
const timestamp = (row) => clean(row?.updatedAt || row?.updated_at || row?.createdAt || row?.created_at, 120);

const focusField = (input) => {
  window.setTimeout(() => {
    if (input?.isConnected && !input.disabled) input.focus({ preventScroll: true });
  }, 0);
};

export function buildRecentAssignmentOptions(assignments = [], { limit = RECENT_ASSIGNMENT_LIMIT } = {}) {
  const boundedLimit = Math.max(0, Math.min(6, Number.isFinite(Number(limit)) ? Math.floor(Number(limit)) : RECENT_ASSIGNMENT_LIMIT));
  if (!boundedLimit) return [];
  const seen = new Set();
  const options = [];
  const ordered = [...(Array.isArray(assignments) ? assignments : [])]
    .sort((left, right) => timestamp(right).localeCompare(timestamp(left)));

  for (const row of ordered) {
    const text = clean(row?.assignmentText || row?.assignment_text);
    if (!text) continue;
    const key = text.replace(/\s+/g, " ").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(text);
    if (options.length >= boundedLimit) break;
  }
  return options;
}

export function classifyQuickAssignResult(result = {}) {
  const storageMode = clean(result.storageMode || result.storage_mode, 120);
  if (result.ok && storageMode === "team_remote") {
    return {
      state: "delivered",
      delivered: true,
      retryable: false,
      message: clean(result.message) || "Assignment delivered to the player.",
    };
  }
  if (result.ok) {
    return {
      state: "local",
      delivered: false,
      retryable: false,
      message: clean(result.message) || "Assignment saved locally. Player delivery was not verified.",
    };
  }
  return {
    state: "error",
    delivered: false,
    retryable: Boolean(result.localSaved),
    message: clean(result.message) || "Assignment could not be delivered.",
  };
}

function QuickAssignComposer({ row, onClose }) {
  const textareaRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deliveryState, setDeliveryState] = useState("idle");
  const [retryable, setRetryable] = useState(false);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [status, setStatus] = useState("Tap the field and enter the exact assignment the player should receive.");
  const [error, setError] = useState(false);

  useEffect(() => {
    setDraft("");
    setDueDate("");
    setSaving(false);
    setDeliveryState("idle");
    setRetryable(false);
    setStatus("Tap the field and enter the exact assignment the player should receive.");
    setError(false);
  }, [row.teamId, row.playerIdentity]);

  useEffect(() => {
    let active = true;
    setRecentAssignments([]);
    loadTeamPlayerAssignments({ teamId: row.teamId })
      .then((result) => {
        if (active) setRecentAssignments(buildRecentAssignmentOptions(result?.assignments || []));
      })
      .catch(() => {
        if (active) setRecentAssignments([]);
      });
    return () => { active = false; };
  }, [row.teamId]);

  const locked = deliveryState === "delivered" || deliveryState === "local";
  const applyRecentAssignment = (assignmentText) => {
    if (saving || locked) return;
    setDraft(assignmentText);
    setError(false);
    setStatus("Recent assignment loaded. Review it before delivery.");
    focusField(textareaRef.current);
  };

  const submit = async () => {
    const assignmentText = clean(draft);
    if (!assignmentText) {
      setError(true);
      setStatus("Add an assignment before delivering it.");
      focusField(textareaRef.current);
      return;
    }

    setSaving(true);
    setError(false);
    setStatus(deliveryState === "error" ? "Retrying assignment delivery…" : "Delivering assignment…");
    const result = await savePlayerAssignment({
      teamId: row.teamId,
      playerIdentity: row.playerIdentity,
      playerName: row.playerName,
      assignmentText,
      resultDetail: "",
      dueDate,
    });
    const outcome = classifyQuickAssignResult(result);
    setSaving(false);
    setDeliveryState(outcome.state);
    setRetryable(outcome.retryable);
    setError(outcome.state === "error");
    setStatus(outcome.message);
    if (result.assignment?.assignmentText) setDraft(result.assignment.assignmentText);
    if (result.assignment?.dueDate) setDueDate(result.assignment.dueDate);
  };

  const openPlayer = () => {
    const target = { email: row.playerIdentity, name: row.playerName };
    onClose();
    window.requestAnimationFrame(() => openExactPlayerFollowUp(target));
  };

  const deadlinePresets = [
    { label: "Tomorrow", testId: "coach-quick-assign-due-1", value: assignmentDueDateFromOffset(1) },
    { label: "3 days", testId: "coach-quick-assign-due-3", value: assignmentDueDateFromOffset(3) },
    { label: "7 days", testId: "coach-quick-assign-due-7", value: assignmentDueDateFromOffset(7) },
    { label: "No date", testId: "coach-quick-assign-due-clear", value: "" },
  ];

  return React.createElement(
    "section",
    {
      className: "mcSection mcQuickAssign",
      role: "dialog",
      "aria-modal": "true",
      "data-testid": "coach-quick-assign",
      "data-player-email": row.playerIdentity,
      "data-delivery-state": deliveryState,
      "data-recent-count": String(recentAssignments.length),
      "data-due-date": dueDate,
      "aria-labelledby": "mc-quick-assign-heading",
    },
    React.createElement(
      "div",
      { className: "mcQuickAssignHead" },
      React.createElement(
        "span",
        null,
        React.createElement("small", { className: "mcQuickAssignEyebrow" }, locked ? "Assignment recorded" : "Mission Control action"),
        React.createElement("h2", { id: "mc-quick-assign-heading" }, row.playerName || row.playerIdentity),
      ),
      React.createElement("button", { type: "button", className: "mcQuickAssignClose", onClick: onClose, "aria-label": "Close quick assign" }, "Close"),
    ),
    React.createElement("p", { className: "mcQuickAssignCopy" }, locked
      ? deliveryState === "delivered"
        ? "The assignment is now in the player’s ShotLab workflow."
        : "The assignment is stored in this session, but remote player delivery was not verified."
      : "This action sends only the assignment text and optional due date. It does not include or modify private coach notes."),
    !locked && recentAssignments.length
      ? React.createElement(
          "section",
          { className: "mcQuickAssignRecent", "data-testid": "coach-quick-assign-recent", "aria-label": "Recent assignments" },
          React.createElement("span", { className: "mcQuickAssignRecentTitle" }, "Recent assignments"),
          React.createElement(
            "div",
            { className: "mcQuickAssignRecentList" },
            ...recentAssignments.map((assignmentText, index) => React.createElement(
              "button",
              {
                key: `${index}:${assignmentText}`,
                type: "button",
                disabled: saving,
                onClick: () => applyRecentAssignment(assignmentText),
                "data-testid": `coach-quick-assign-recent-${index}`,
                "aria-label": `Use recent assignment: ${assignmentText}`,
              },
              assignmentText,
            )),
          ),
        )
      : null,
    React.createElement(
      "label",
      { className: "mcQuickAssignField" },
      React.createElement("span", null, "Assignment to deliver"),
      React.createElement("textarea", {
        ref: textareaRef,
        value: draft,
        maxLength: QUICK_ASSIGN_MAX_LENGTH,
        placeholder: "Example: Complete the form shooting ladder and record your makes.",
        onChange: (event) => setDraft(event.target.value),
        disabled: saving || locked || (deliveryState === "error" && retryable),
        "data-testid": "coach-quick-assign-input",
      }),
    ),
    !locked
      ? React.createElement(
          "section",
          { className: "mcQuickAssignDeadline", "data-testid": "coach-quick-assign-deadline", "aria-label": "Optional assignment due date" },
          React.createElement("span", null, "Optional due date"),
          React.createElement("input", {
            type: "date",
            min: assignmentDueDateFromOffset(0),
            value: dueDate,
            onChange: (event) => setDueDate(normalizeAssignmentDueDate(event.target.value)),
            disabled: saving,
            "data-testid": "coach-quick-assign-due-date",
            "aria-label": "Assignment due date",
          }),
          React.createElement(
            "div",
            { className: "mcQuickAssignDeadlinePresets", "aria-label": "Due date shortcuts" },
            ...deadlinePresets.map((preset) => React.createElement(
              "button",
              {
                key: preset.testId,
                type: "button",
                className: dueDate === preset.value ? "is-active" : "",
                disabled: saving,
                onClick: () => setDueDate(preset.value),
                "data-testid": preset.testId,
              },
              preset.label,
            )),
          ),
        )
      : null,
    React.createElement(
      "div",
      { className: "mcQuickAssignActions" },
      locked
        ? React.createElement("button", { type: "button", className: "is-primary", onClick: openPlayer }, "Open player")
        : React.createElement("button", { type: "button", className: "is-primary", onClick: submit, disabled: saving }, deliveryState === "error" && retryable ? "Retry delivery" : "Deliver assignment"),
      React.createElement("button", { type: "button", onClick: locked ? onClose : openPlayer, disabled: saving }, locked ? "Done" : "Open full player"),
    ),
    React.createElement("div", { className: `mcQuickAssignStatus ${error ? "is-error" : ""}`, role: "status", "aria-live": "polite" }, status),
  );
}

function QuickAssignPortal() {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const open = (event) => {
      const detail = event?.detail || {};
      if (!clean(detail.teamId, 180) || !clean(detail.playerIdentity, 320)) return;
      setSelected({
        teamId: clean(detail.teamId, 180),
        playerIdentity: clean(detail.playerIdentity, 320).toLowerCase(),
        playerName: clean(detail.playerName || detail.playerIdentity, 320),
      });
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  useEffect(() => {
    if (!selected) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  if (!selected) return null;
  return React.createElement(
    "div",
    { className: "mcQuickAssignLayer", "data-testid": "coach-quick-assign-layer" },
    React.createElement("button", { type: "button", className: "mcQuickAssignBackdrop", onClick: () => setSelected(null), "aria-label": "Close quick assign" }),
    React.createElement(QuickAssignComposer, {
      key: `${selected.teamId}:${selected.playerIdentity}`,
      row: selected,
      onClose: () => setSelected(null),
    }),
  );
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

function rowContext(row) {
  const panel = row?.closest?.('[data-testid="coach-assignment-accountability"]');
  const rawSession = parse(globalThis?.localStorage?.getItem?.("sl:session"), {});
  const session = Array.isArray(rawSession) ? rawSession[0] || {} : rawSession;
  return {
    teamId: clean(panel?.closest?.('[data-team-id]')?.getAttribute?.("data-team-id") || session?.teamId || session?.team_id, 180),
    playerIdentity: clean(row?.getAttribute?.("data-player-email"), 320).toLowerCase(),
    playerName: clean(row?.querySelector?.("strong")?.textContent, 320),
  };
}

function mountPortal() {
  if (!document.body || document.getElementById(HOST_ID)) return;
  const host = document.createElement("div");
  host.id = HOST_ID;
  host.className = "mcQuickAssignPortalHost";
  host.dataset.testid = HOST_TEST_ID;
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(React.createElement(QuickAssignPortal));
}

export function installCoachQuickAssignEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachQuickAssignEnhancer) return true;
  window.__shotlabCoachQuickAssignEnhancer = true;
  ensureStyles();

  document.addEventListener("click", (event) => {
    const row = event.target?.closest?.('[data-testid="coach-assignment-accountability"] .mcAssignmentAccountabilityRow[data-assignment-state="unassigned"]');
    if (!row) return;
    const context = rowContext(row);
    if (!context.teamId || !context.playerIdentity) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: context }));
  }, true);

  if (document.body) mountPortal();
  else window.addEventListener("DOMContentLoaded", mountPortal, { once: true });
  return true;
}

export { OPEN_EVENT as COACH_QUICK_ASSIGN_OPEN_EVENT };
