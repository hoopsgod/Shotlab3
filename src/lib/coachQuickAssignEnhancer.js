import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { openExactPlayerFollowUp } from "./coachAssignmentOutcomeEnhancer.js";
import { savePlayerAssignment } from "./playerAssignmentService.js";

const STYLE_ID = "shotlab-coach-quick-assign-styles";
const HOST_TEST_ID = "coach-quick-assign-host";
const OPEN_EVENT = "shotlab:coach-quick-assign-open";
const QUICK_ASSIGN_MAX_LENGTH = 4000;

const styles = `
.mcQuickAssignHost{grid-column:1/-1;min-width:0}
.mcQuickAssign{position:relative;overflow:hidden}
.mcQuickAssign::after{content:"";position:absolute;right:-58px;top:-68px;width:170px;height:170px;border-radius:50%;background:color-mix(in srgb,var(--mc,#c8ff1a) 8%,transparent);filter:blur(34px);pointer-events:none}
.mcQuickAssign>*{position:relative;z-index:1}
.mcQuickAssignHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.mcQuickAssignEyebrow,.mcQuickAssignField span{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}
.mcQuickAssignEyebrow{display:block;color:var(--text-3,#7d898f);font-size:8px;font-weight:800}
.mcQuickAssignHead h2{margin:4px 0 0;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:22px;font-weight:400;line-height:1;letter-spacing:.035em}
.mcQuickAssignClose{min-width:44px;min-height:44px;border:1px solid rgba(255,255,255,.09);border-radius:11px;background:rgba(255,255,255,.025);color:var(--text-2,#aab3b8);font:900 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
.mcQuickAssignCopy{margin:9px 0 0;color:var(--text-2,#aab3b8);font:600 11px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcQuickAssignField{display:grid;gap:7px;margin-top:11px}
.mcQuickAssignField span{color:var(--text-3,#7d898f);font-size:8px;font-weight:800}
.mcQuickAssignField textarea{box-sizing:border-box;width:100%;min-height:96px;resize:vertical;padding:11px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0d1113;color:var(--text-1,#f4f7f8);font:600 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcQuickAssignField textarea:focus{outline:2px solid color-mix(in srgb,var(--mc,#c8ff1a) 65%,white);outline-offset:2px}
.mcQuickAssignField textarea:disabled{opacity:.72;resize:none}
.mcQuickAssignActions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;margin-top:10px}
.mcQuickAssignActions button{min-height:44px;padding:0 12px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.035);color:var(--text-1,#f4f7f8);font:900 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
.mcQuickAssignActions button.is-primary{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 44%,transparent);background:var(--mc,#c8ff1a);color:#080a08}
.mcQuickAssignActions button:disabled{opacity:.55;cursor:wait}
.mcQuickAssignStatus{min-height:18px;margin-top:9px;color:var(--text-2,#aab3b8);font:600 10px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcQuickAssignStatus.is-error{color:#ffb8a8}
.mcQuickAssign[data-delivery-state="delivered"]{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 42%,rgba(255,255,255,.08))}
.mcQuickAssign[data-delivery-state="local"],.mcQuickAssign[data-delivery-state="error"]{border-color:rgba(255,181,71,.34)}
@media(max-width:420px){.mcQuickAssignActions{grid-template-columns:1fr}.mcQuickAssignHead h2{font-size:20px}}
`;

const clean = (value) => String(value ?? "").trim();
const parse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

export function classifyQuickAssignResult(result = {}) {
  const storageMode = clean(result.storageMode || result.storage_mode);
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
  const [saving, setSaving] = useState(false);
  const [deliveryState, setDeliveryState] = useState("idle");
  const [retryable, setRetryable] = useState(false);
  const [status, setStatus] = useState("Enter the exact assignment the player should receive.");
  const [error, setError] = useState(false);

  useEffect(() => {
    setDraft("");
    setSaving(false);
    setDeliveryState("idle");
    setRetryable(false);
    setStatus("Enter the exact assignment the player should receive.");
    setError(false);

    let timer = null;
    const frame = window.requestAnimationFrame(() => {
      timer = window.setTimeout(() => textareaRef.current?.focus?.({ preventScroll: true }), 0);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (timer != null) window.clearTimeout(timer);
    };
  }, [row.teamId, row.playerIdentity]);

  const locked = deliveryState === "delivered" || deliveryState === "local";
  const submit = async () => {
    const assignmentText = clean(draft);
    if (!assignmentText) {
      setError(true);
      setStatus("Add an assignment before delivering it.");
      textareaRef.current?.focus?.();
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
    });
    const outcome = classifyQuickAssignResult(result);
    setSaving(false);
    setDeliveryState(outcome.state);
    setRetryable(outcome.retryable);
    setError(outcome.state === "error");
    setStatus(outcome.message);
    if (result.assignment?.assignmentText) setDraft(result.assignment.assignmentText);
  };

  const openPlayer = () => openExactPlayerFollowUp({
    email: row.playerIdentity,
    name: row.playerName,
  });

  return React.createElement(
    "section",
    {
      className: "mcSection mcQuickAssign",
      "data-testid": "coach-quick-assign",
      "data-player-email": row.playerIdentity,
      "data-delivery-state": deliveryState,
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
      : "This action sends only the assignment text. It does not include or modify private coach notes."),
    React.createElement(
      "label",
      { className: "mcQuickAssignField" },
      React.createElement("span", null, "Assignment to deliver"),
      React.createElement("textarea", {
        ref: textareaRef,
        autoFocus: true,
        value: draft,
        maxLength: QUICK_ASSIGN_MAX_LENGTH,
        placeholder: "Example: Complete the form shooting ladder and record your makes.",
        onChange: (event) => setDraft(event.target.value),
        disabled: saving || locked || (deliveryState === "error" && retryable),
        "data-testid": "coach-quick-assign-input",
      }),
    ),
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
      if (!clean(detail.teamId) || !clean(detail.playerIdentity)) return;
      setSelected({
        teamId: clean(detail.teamId),
        playerIdentity: clean(detail.playerIdentity).toLowerCase(),
        playerName: clean(detail.playerName || detail.playerIdentity),
      });
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  return selected
    ? React.createElement(QuickAssignComposer, {
        key: `${selected.teamId}:${selected.playerIdentity}`,
        row: selected,
        onClose: () => setSelected(null),
      })
    : null;
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
    teamId: clean(panel?.closest?.('[data-team-id]')?.getAttribute?.("data-team-id")
      || session?.teamId
      || session?.team_id),
    playerIdentity: clean(row?.getAttribute?.("data-player-email")).toLowerCase(),
    playerName: clean(row?.querySelector?.("strong")?.textContent),
  };
}

export function installCoachQuickAssignEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachQuickAssignEnhancer) return true;
  window.__shotlabCoachQuickAssignEnhancer = true;
  ensureStyles();

  document.addEventListener("mousedown", (event) => {
    const row = event.target?.closest?.('[data-testid="coach-assignment-accountability"] .mcAssignmentAccountabilityRow[data-assignment-state="unassigned"]');
    if (row) event.preventDefault();
  }, true);

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

  let host = null;
  let root = null;
  let target = null;
  let frame = null;

  const positionHost = () => {
    if (!target || !host) return;
    const accountabilityHost = target.querySelector('[data-testid="coach-assignment-accountability-host"]');
    const followUpHost = target.querySelector('[data-testid="coach-follow-up-queue-host"]');
    if (accountabilityHost) {
      const reference = accountabilityHost.nextSibling;
      if (reference !== host) target.insertBefore(host, reference);
    } else if (followUpHost && host.nextSibling !== followUpHost) {
      target.insertBefore(host, followUpHost);
    } else if (!host.isConnected) {
      target.appendChild(host);
    }
  };

  const reconcile = () => {
    frame = null;
    const nextTarget = document.querySelector('[data-testid="coach-command-center-full"] .mcFocusGrid');
    if (nextTarget === target && host?.isConnected) {
      positionHost();
      return;
    }
    root?.unmount?.();
    host?.remove?.();
    host = null;
    root = null;
    target = nextTarget;
    if (!target) return;
    host = document.createElement("div");
    host.className = "mcQuickAssignHost";
    host.dataset.testid = HOST_TEST_ID;
    target.appendChild(host);
    positionHost();
    root = createRoot(host);
    root.render(React.createElement(QuickAssignPortal));
  };

  const schedule = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(reconcile);
  };
  const observer = new MutationObserver(schedule);
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
  };
  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
  return true;
}

export { OPEN_EVENT as COACH_QUICK_ASSIGN_OPEN_EVENT };
