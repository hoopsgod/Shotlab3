import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { assignmentDueDateFromOffset, normalizeAssignmentDueDate } from "./assignmentDeadline.js";
import { openExactPlayerFollowUp } from "./coachAssignmentOutcomeEnhancer.js";
import { saveNextPlayerAssignment } from "./playerAssignmentHistoryService.js";

const STYLE_ID = "shotlab-coach-assignment-intervention-styles";
const PORTAL_ID = "shotlab-coach-assignment-intervention-portal";
const OPEN_EVENT = "shotlab:coach-assignment-intervention-open";
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const parse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };

const styles = `
.mcInterventionPortal{position:fixed;inset:0;z-index:2147481200;pointer-events:none}.mcInterventionPortal:empty{display:none}
.mcInterventionLayer{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));pointer-events:auto}
.mcInterventionBackdrop{position:absolute;inset:0;border:0;background:rgba(2,4,6,.8);backdrop-filter:blur(9px)}
.mcInterventionSheet{position:relative;box-sizing:border-box;width:min(580px,100%);max-height:calc(100dvh - 24px);overflow:auto;padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:linear-gradient(155deg,rgba(27,30,32,.99),rgba(8,10,11,.99));box-shadow:0 24px 84px rgba(0,0,0,.64)}
.mcInterventionHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.mcInterventionEyebrow,.mcInterventionEvidence small,.mcInterventionSuggestions>span,.mcInterventionField span,.mcInterventionDue>span{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}
.mcInterventionEyebrow{display:block;color:var(--text-3,#7d898f);font-size:8px;font-weight:800}.mcInterventionHead h2{margin:4px 0 0;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:23px;font-weight:400;letter-spacing:.035em}
.mcInterventionClose{min-width:44px;min-height:44px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.025);color:var(--text-2,#aab3b8);font:900 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;cursor:pointer}
.mcInterventionCopy{margin:10px 0 0;color:var(--text-2,#aab3b8);font:600 12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcInterventionEvidence{margin-top:11px;padding:11px;border:1px solid rgba(255,181,71,.22);border-radius:12px;background:rgba(255,181,71,.045)}.mcInterventionEvidence strong{display:block;color:#ffd08a;font:800 12px/1.35 'Barlow Condensed','Arial Narrow',sans-serif}.mcInterventionEvidence p{margin:4px 0 0;color:var(--text-2,#aab3b8);font:600 11px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.mcInterventionEvidence small{display:block;margin-top:5px;color:var(--text-3,#7d898f);font-size:8px;font-weight:700}
.mcInterventionSuggestions,.mcInterventionField,.mcInterventionDue{display:grid;gap:7px;margin-top:12px}.mcInterventionSuggestions>span,.mcInterventionField span,.mcInterventionDue>span{color:var(--text-3,#7d898f);font-size:8px;font-weight:800}
.mcInterventionSuggestionList{display:grid;grid-template-columns:1fr 1fr;gap:7px}.mcInterventionSuggestionList button{min-height:44px;padding:9px 10px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.03);color:var(--text-2,#aab3b8);font:700 11px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:left;cursor:pointer}.mcInterventionSuggestionList button:hover,.mcInterventionSuggestionList button:focus-visible{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 42%,transparent);color:var(--text-1,#f4f7f8);outline:none}
.mcInterventionField textarea,.mcInterventionDue input{box-sizing:border-box;width:100%;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0d1113;color:var(--text-1,#f4f7f8)}.mcInterventionField textarea{min-height:108px;padding:11px 12px;resize:vertical;font:600 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.mcInterventionDue input{min-height:44px;padding:0 11px;color-scheme:dark}
.mcInterventionPresets{display:flex;flex-wrap:wrap;gap:6px}.mcInterventionPresets button,.mcInterventionActions button{min-height:44px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.03);color:var(--text-2,#aab3b8);font:900 9px/1 'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.07em;cursor:pointer}.mcInterventionPresets button{padding:0 10px}.mcInterventionPresets button.is-active{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 44%,transparent);color:var(--mc,#c8ff1a)}
.mcInterventionActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.mcInterventionActions button.is-primary{background:var(--mc,#c8ff1a);color:#080a08;border-color:color-mix(in srgb,var(--mc,#c8ff1a) 56%,transparent)}.mcInterventionActions button:disabled,.mcInterventionPresets button:disabled,.mcInterventionDue input:disabled,.mcInterventionField textarea:disabled,.mcInterventionSuggestionList button:disabled{opacity:.55;cursor:wait}
.mcInterventionStatus{min-height:20px;margin-top:9px;color:var(--text-2,#aab3b8);font:600 10px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.mcInterventionStatus.is-error{color:#ffb8a8}
@media(max-width:420px){.mcInterventionLayer{padding:8px;padding-bottom:max(8px,env(safe-area-inset-bottom))}.mcInterventionSheet{max-height:calc(100dvh - 16px)}.mcInterventionSuggestionList,.mcInterventionActions{grid-template-columns:1fr}}
`;

export function interventionSuggestions(type = "") {
  if (type === "deadline") return [
    "Complete one focused shooting block and record the result.",
    "Complete the assignment in two shorter sessions and log both sessions.",
  ];
  if (type === "response") return [
    "Acknowledge this assignment today, then complete the listed workout.",
    "Confirm receipt and message your coach if the assignment is unclear.",
  ];
  return [
    "Complete one reduced-volume version of the previous assignment and record the result.",
    "Complete the first half of the workout, then check in before continuing.",
  ];
}

function sessionTeamId() {
  const raw = parse(globalThis?.localStorage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] || {} : raw;
  return clean(session?.teamId || session?.team_id, 180);
}

function InterventionSheet({ row, onClose }) {
  const suggestions = interventionSuggestions(row.promptType);
  const [draft, setDraft] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("Review the evidence, then choose or write the exact assignment. Nothing is sent until you confirm delivery.");

  const submit = async () => {
    const assignmentText = clean(draft);
    if (!assignmentText) {
      setError(true);
      setStatus("Choose or write an assignment before delivery.");
      return;
    }
    setSaving(true);
    setError(false);
    setStatus("Preserving the completed assignment and delivering the coach-approved next step…");
    const result = await saveNextPlayerAssignment({
      teamId: row.teamId,
      playerIdentity: row.playerIdentity,
      playerName: row.playerName,
      assignmentText,
      dueDate,
    });
    setSaving(false);
    setLocked(Boolean(result.ok));
    setError(!result.ok);
    setStatus(result.message || (result.ok ? "Coach-approved assignment delivered." : "Assignment could not be delivered."));
  };

  const openPlayer = () => {
    onClose();
    window.requestAnimationFrame(() => openExactPlayerFollowUp({ email: row.playerIdentity, name: row.playerName }));
  };
  const presets = [
    { label: "Tomorrow", value: assignmentDueDateFromOffset(1) },
    { label: "3 days", value: assignmentDueDateFromOffset(3) },
    { label: "7 days", value: assignmentDueDateFromOffset(7) },
    { label: "No date", value: "" },
  ];

  return React.createElement("section", {
    className: "mcInterventionSheet",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "mc-intervention-title",
    "data-testid": "coach-assignment-intervention",
    "data-player-email": row.playerIdentity,
    "data-prompt-type": row.promptType,
    "data-state": locked ? "delivered" : error ? "error" : "editing",
  },
  React.createElement("div", { className: "mcInterventionHead" },
    React.createElement("span", null, React.createElement("small", { className: "mcInterventionEyebrow" }, "Coach-approved intervention"), React.createElement("h2", { id: "mc-intervention-title" }, row.playerName || row.playerIdentity)),
    React.createElement("button", { type: "button", className: "mcInterventionClose", onClick: onClose, "aria-label": "Close intervention workflow" }, "Close")),
  React.createElement("p", { className: "mcInterventionCopy" }, locked ? "The player now has one new active assignment. The prior completion remains preserved in history." : "ShotLab provides context and editable starting points. The coach remains responsible for the final assignment and deadline."),
  React.createElement("section", { className: "mcInterventionEvidence", "data-testid": "coach-assignment-intervention-evidence" },
    React.createElement("strong", null, row.title || "Review assignment pattern"),
    React.createElement("p", null, row.detail || "Review the player context before deciding on a next assignment."),
    React.createElement("small", null, row.evidence || "Directional evidence only · not a player grade")),
  !locked ? React.createElement("section", { className: "mcInterventionSuggestions", "aria-label": "Editable assignment starting points" },
    React.createElement("span", null, "Editable starting points"),
    React.createElement("div", { className: "mcInterventionSuggestionList" }, ...suggestions.map((text, index) => React.createElement("button", { type: "button", key: text, disabled: saving, onClick: () => { setDraft(text); setError(false); setStatus("Starting point loaded. Edit it as needed, then confirm delivery."); }, "data-testid": `coach-intervention-suggestion-${index}` }, text)))) : null,
  React.createElement("label", { className: "mcInterventionField" }, React.createElement("span", null, "Coach-approved assignment"), React.createElement("textarea", { value: draft, maxLength: 4000, disabled: saving || locked, onChange: (event) => setDraft(event.target.value), placeholder: "Write the exact assignment the player should receive.", "data-testid": "coach-intervention-input" })),
  !locked ? React.createElement("section", { className: "mcInterventionDue", "aria-label": "Optional intervention due date" },
    React.createElement("span", null, "Optional due date"),
    React.createElement("input", { type: "date", min: assignmentDueDateFromOffset(0), value: dueDate, disabled: saving, onChange: (event) => setDueDate(normalizeAssignmentDueDate(event.target.value)), "data-testid": "coach-intervention-due-date" }),
    React.createElement("div", { className: "mcInterventionPresets" }, ...presets.map((preset) => React.createElement("button", { type: "button", key: preset.label, className: dueDate === preset.value ? "is-active" : "", disabled: saving, onClick: () => setDueDate(preset.value) }, preset.label)))) : null,
  React.createElement("div", { className: "mcInterventionActions" },
    locked ? React.createElement("button", { type: "button", className: "is-primary", onClick: onClose }, "Done") : React.createElement("button", { type: "button", className: "is-primary", disabled: saving, onClick: submit, "data-testid": "coach-intervention-submit" }, saving ? "Delivering…" : error ? "Retry delivery" : "Confirm and deliver"),
    React.createElement("button", { type: "button", disabled: saving, onClick: locked ? openPlayer : openPlayer }, locked ? "Open player" : "Review full player")),
  React.createElement("div", { className: `mcInterventionStatus ${error ? "is-error" : ""}`, role: "status", "aria-live": "polite" }, status));
}

function Portal() {
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const open = (event) => {
      const detail = event?.detail || {};
      if (!detail.teamId || !detail.playerIdentity) return;
      setSelected(detail);
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
  return React.createElement("div", { className: "mcInterventionLayer", "data-testid": "coach-assignment-intervention-layer" },
    React.createElement("button", { type: "button", className: "mcInterventionBackdrop", onClick: () => setSelected(null), "aria-label": "Close intervention workflow" }),
    React.createElement(InterventionSheet, { row: selected, onClose: () => setSelected(null) }));
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
  host.className = "mcInterventionPortal";
  document.body.appendChild(host);
  createRoot(host).render(React.createElement(Portal));
}

export function installCoachAssignmentInterventionEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachAssignmentInterventionEnhancer) return true;
  window.__shotlabCoachAssignmentInterventionEnhancer = true;
  ensureStyles();
  mountPortal();
  document.addEventListener("click", (event) => {
    const button = event.target?.closest?.('[data-testid="coach-assignment-action-prompt"] button');
    const prompt = button?.closest?.('[data-testid="coach-assignment-action-prompt"]');
    if (!button || !prompt) return;
    const teamId = sessionTeamId();
    const playerIdentity = clean(prompt.getAttribute("data-player-email"), 320).toLowerCase();
    if (!teamId || !playerIdentity) return;
    const copy = prompt.querySelector("span");
    const heading = clean(copy?.querySelector("strong")?.textContent, 500);
    const separator = heading.lastIndexOf(" · ");
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: {
      teamId,
      playerIdentity,
      playerName: separator >= 0 ? clean(heading.slice(separator + 3), 320) : playerIdentity,
      promptType: clean(prompt.getAttribute("data-prompt-type"), 80),
      title: separator >= 0 ? clean(heading.slice(0, separator), 320) : "Review assignment pattern",
      detail: clean(copy?.querySelector("p")?.textContent, 1000),
      evidence: clean(copy?.querySelector("small")?.textContent, 500),
    } }));
  }, true);
  return true;
}

export { OPEN_EVENT as COACH_ASSIGNMENT_INTERVENTION_OPEN_EVENT };
