import React from "react";
import { createRoot } from "react-dom/client";
import { useCoachAssignmentOutcomes } from "./coachAssignmentOutcomes.js";

const STYLE_ID = "shotlab-coach-assignment-outcome-styles";
const HOST_TEST_ID = "coach-assignment-outcome-host";

const styles = `
.mcAssignmentOutcomePortalHost{grid-column:1/-1;min-width:0}
.mcAssignmentOutcome{position:relative;overflow:hidden}
.mcAssignmentOutcome::after{content:"";position:absolute;right:-44px;top:-52px;width:150px;height:150px;border-radius:50%;background:color-mix(in srgb,var(--mc,#c8ff1a) 9%,transparent);filter:blur(28px);pointer-events:none}
.mcAssignmentOutcome.is-stale{border-color:rgba(255,181,71,.34);background:linear-gradient(145deg,rgba(255,181,71,.055),rgba(255,255,255,.014))}
.mcAssignmentOutcome.is-stale::after{background:rgba(255,181,71,.10)}
.mcAssignmentOutcome>*{position:relative;z-index:1}
.mcAssignmentOutcomeHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.mcAssignmentOutcomeHead small,.mcAssignmentOutcomeMeta,.mcAssignmentOutcomeFreshness,.mcAssignmentOutcomeRow small,.mcAssignmentOutcomeFacts small{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}
.mcAssignmentOutcomeHead small{display:block;color:var(--text-3,#7d898f);font-size:9px;font-weight:800}
.mcAssignmentOutcomeHead h2{margin:4px 0 0;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:24px;font-weight:400;line-height:1;letter-spacing:.035em}
.mcAssignmentOutcomeRate{display:grid;place-items:center;width:58px;height:58px;flex:0 0 auto;border:1px solid color-mix(in srgb,var(--mc,#c8ff1a) 34%,rgba(255,255,255,.08));border-radius:18px;background:color-mix(in srgb,var(--mc,#c8ff1a) 7%,rgba(255,255,255,.018));color:var(--mc,#c8ff1a);font-family:'Bebas Neue',Impact,sans-serif;font-size:24px;line-height:1}
.mcAssignmentOutcomeStaleBadge{display:grid;place-items:center;min-width:58px;height:34px;padding:0 10px;flex:0 0 auto;border:1px solid rgba(255,181,71,.45);border-radius:999px;background:rgba(255,181,71,.10);color:#ffca76;font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:10px;font-weight:900;letter-spacing:.12em}
.mcAssignmentOutcomeMeta{margin-top:8px;color:var(--text-2,#aab3b8);font-size:10px;font-weight:700}
.mcAssignmentOutcomeFreshness{margin-top:7px;color:var(--text-3,#7d898f);font-size:9px;font-weight:700;line-height:1.45}
.mcAssignmentOutcomeStaleCopy{margin:10px 0 0;color:var(--text-2,#aab3b8);font:600 12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcAssignmentOutcomeTrack{height:7px;margin-top:12px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.07)}
.mcAssignmentOutcomeTrack span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--mc,#c8ff1a),var(--mc-secondary,#77d7ff));transition:width 220ms ease}
.mcAssignmentOutcomeFacts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:12px;overflow:hidden;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.014)}
.mcAssignmentOutcomeFacts div{min-width:0;padding:10px 8px;text-align:center;border-right:1px solid rgba(255,255,255,.07)}
.mcAssignmentOutcomeFacts div:last-child{border-right:0}.mcAssignmentOutcomeFacts strong{display:block;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:20px;font-weight:400}.mcAssignmentOutcomeFacts small{display:block;margin-top:3px;color:var(--text-3,#7d898f);font-size:8px;font-weight:800}
.mcAssignmentOutcomeRows{display:grid;gap:7px;margin-top:12px}.mcAssignmentOutcomeRow{display:grid;grid-template-columns:10px minmax(0,1fr) auto;align-items:center;gap:9px;min-width:0;padding:8px 9px;border:1px solid rgba(255,255,255,.065);border-radius:12px;background:rgba(255,255,255,.012)}
.mcAssignmentOutcomeDot{width:8px;height:8px;border-radius:50%;background:#ffb547;box-shadow:0 0 0 3px rgba(255,181,71,.09)}.mcAssignmentOutcomeRow.is-active-other .mcAssignmentOutcomeDot{background:var(--mc-secondary,#77d7ff);box-shadow:0 0 0 3px color-mix(in srgb,var(--mc-secondary,#77d7ff) 12%,transparent)}.mcAssignmentOutcomeRow.is-completed .mcAssignmentOutcomeDot{background:var(--mc,#c8ff1a);box-shadow:0 0 0 3px color-mix(in srgb,var(--mc,#c8ff1a) 12%,transparent)}
.mcAssignmentOutcomeRow span{min-width:0}.mcAssignmentOutcomeRow strong{display:block;overflow:hidden;color:var(--text-1,#f4f7f8);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:12px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.mcAssignmentOutcomeRow small{display:block;margin-top:2px;color:var(--text-3,#7d898f);font-size:8px;font-weight:700}.mcAssignmentOutcomeRow em{color:var(--text-2,#aab3b8);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:10px;font-style:normal;font-weight:700}
.mcAssignmentOutcome .mcTextLink{margin-top:11px}.mcAssignmentOutcomeRefresh{width:100%;min-height:44px;margin-top:14px;border:1px solid rgba(255,181,71,.42);border-radius:12px;background:rgba(255,181,71,.12);color:#ffd18a;font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
@media(max-width:420px){.mcAssignmentOutcomeHead h2{font-size:21px}.mcAssignmentOutcomeRate{width:52px;height:52px;border-radius:16px;font-size:22px}.mcAssignmentOutcomeFacts small{font-size:7px}}
@media(prefers-reduced-motion:reduce){.mcAssignmentOutcomeTrack span{transition:none}}
`;

const statusCopy = (row = {}) => {
  if (row.status === "completed") return row.attempts > 1 ? `${row.attempts} completions this week` : "Priority completed this week";
  if (row.status === "active-other") return "Active this week · priority still open";
  return "No matching completion this week";
};

const statusLabel = (row = {}) => row.status === "completed" ? "Done" : row.status === "active-other" ? "Other work" : "Open";

function openPlayerWorkspace() {
  const root = document.querySelector('[data-testid="coach-command-center-full"]');
  const buttons = [...(root?.querySelectorAll?.("button") || [])];
  const target = buttons.find((button) => String(button.textContent || "").trim() === "Players");
  target?.click?.();
}

function openTeamFocusEditor() {
  const root = document.querySelector('[data-testid="coach-command-center-full"]');
  const buttons = [...(root?.querySelectorAll?.("button") || [])];
  const target = buttons.find((button) => String(button.textContent || "").trim() === "Set Team Focus");
  target?.click?.();
}

function freshnessCopy(model = {}) {
  if (model.freshness === "current") return model.ageDays === 0 ? "Published today" : `Published ${model.ageDays} day${model.ageDays === 1 ? "" : "s"} ago`;
  if (model.freshness === "unknown") return "Freshness not verified · republish to start timestamp tracking";
  return "";
}

function CoachAssignmentOutcomePanel() {
  const model = useCoachAssignmentOutcomes();
  if (!model?.trackable || !model.total) return null;

  if (model.stale) {
    return React.createElement(
      "article",
      { className: "mcSection mcAssignmentOutcome is-stale", "aria-labelledby": "mc-assignment-outcome-heading", "data-testid": "coach-assignment-outcome", "data-freshness": "stale" },
      React.createElement("div", { className: "mcAssignmentOutcomeHead" },
        React.createElement("span", null,
          React.createElement("small", null, "Assignment needs refresh"),
          React.createElement("h2", { id: "mc-assignment-outcome-heading" }, model.priorityDrill)),
        React.createElement("strong", { className: "mcAssignmentOutcomeStaleBadge" }, "STALE")),
      React.createElement("div", { className: "mcAssignmentOutcomeMeta" }, `Last published ${model.ageDays} day${model.ageDays === 1 ? "" : "s"} ago`),
      React.createElement("p", { className: "mcAssignmentOutcomeStaleCopy" }, "Republish the team focus before using this week’s completion data. ShotLab is withholding the completion percentage so old guidance is not presented as current."),
      React.createElement("button", { type: "button", className: "mcAssignmentOutcomeRefresh", onClick: openTeamFocusEditor }, "Refresh team focus"),
    );
  }

  const visibleRows = model.rows.slice(0, 3);
  return React.createElement(
    "article",
    { className: "mcSection mcAssignmentOutcome", "aria-labelledby": "mc-assignment-outcome-heading", "data-testid": "coach-assignment-outcome", "data-freshness": model.freshness || "unknown" },
    React.createElement("div", { className: "mcAssignmentOutcomeHead" },
      React.createElement("span", null,
        React.createElement("small", null, "Current assignment"),
        React.createElement("h2", { id: "mc-assignment-outcome-heading" }, model.priorityDrill)),
      React.createElement("strong", { className: "mcAssignmentOutcomeRate", "aria-label": `${model.completionRate}% assignment completion` }, `${model.completionRate}%`)),
    React.createElement("div", { className: "mcAssignmentOutcomeMeta" }, `${model.completedCount} of ${model.total} completed this week`),
    React.createElement("div", { className: "mcAssignmentOutcomeFreshness" }, freshnessCopy(model)),
    React.createElement("div", { className: "mcAssignmentOutcomeTrack", "aria-hidden": "true" }, React.createElement("span", { style: { width: `${model.completionRate}%` } })),
    React.createElement("div", { className: "mcAssignmentOutcomeFacts", "aria-label": "Assignment response summary" },
      React.createElement("div", null, React.createElement("strong", null, model.completedCount), React.createElement("small", null, "Completed")),
      React.createElement("div", null, React.createElement("strong", null, model.activeOtherCount), React.createElement("small", null, "Other work")),
      React.createElement("div", null, React.createElement("strong", null, model.notStartedCount), React.createElement("small", null, "Not started"))),
    React.createElement("div", { className: "mcAssignmentOutcomeRows" }, visibleRows.map((row) => React.createElement(
      "div",
      { className: `mcAssignmentOutcomeRow is-${row.status}`, key: row.key },
      React.createElement("i", { className: "mcAssignmentOutcomeDot", "aria-hidden": "true" }),
      React.createElement("span", null, React.createElement("strong", null, row.name), React.createElement("small", null, statusCopy(row))),
      React.createElement("em", null, statusLabel(row))))),
    React.createElement("button", { type: "button", className: "mcTextLink", onClick: openPlayerWorkspace }, "Review player workspace →"));
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

export function installCoachAssignmentOutcomeEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachAssignmentOutcomeEnhancer) return true;
  window.__shotlabCoachAssignmentOutcomeEnhancer = true;
  ensureStyles();

  let host = null;
  let root = null;
  let target = null;
  let frame = null;

  const reconcile = () => {
    frame = null;
    const nextTarget = document.querySelector('[data-testid="coach-command-center-full"] .mcFocusGrid');
    if (nextTarget === target && host?.isConnected) return;
    if (root) root.unmount();
    host?.remove?.();
    host = null;
    root = null;
    target = nextTarget;
    if (!target) return;
    host = document.createElement("div");
    host.className = "mcAssignmentOutcomePortalHost";
    host.dataset.testid = HOST_TEST_ID;
    target.appendChild(host);
    root = createRoot(host);
    root.render(React.createElement(CoachAssignmentOutcomePanel));
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
