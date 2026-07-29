import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { openExactPlayerFollowUp } from "./coachAssignmentOutcomeEnhancer.js";
import { loadCoachFollowUpQueue } from "./coachFollowUpQueue.js";

const STYLE_ID = "shotlab-coach-follow-up-queue-styles";
const HOST_TEST_ID = "coach-follow-up-queue-host";
const CHANGE_EVENT = "shotlab:coach-follow-ups-changed";

const styles = `
.mcFollowUpQueueHost{grid-column:1/-1;min-width:0}
.mcFollowUpQueue{position:relative;overflow:hidden}
.mcFollowUpQueueHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.mcFollowUpQueueHead small,.mcFollowUpQueueMeta,.mcFollowUpQueueRow small,.mcFollowUpQueueHistory summary{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}
.mcFollowUpQueueHead small{display:block;color:var(--text-3,#7d898f);font-size:9px;font-weight:800}
.mcFollowUpQueueHead h2{margin:4px 0 0;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:24px;font-weight:400;line-height:1;letter-spacing:.035em}
.mcFollowUpQueueCount{display:grid;place-items:center;min-width:54px;height:34px;padding:0 10px;border:1px solid rgba(255,181,71,.42);border-radius:999px;background:rgba(255,181,71,.10);color:#ffca76;font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
.mcFollowUpQueueCount.is-clear{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 38%,transparent);background:color-mix(in srgb,var(--mc,#c8ff1a) 8%,transparent);color:var(--mc,#c8ff1a)}
.mcFollowUpQueueMeta{margin-top:8px;color:var(--text-2,#aab3b8);font-size:10px;font-weight:700;line-height:1.45}
.mcFollowUpQueueRows{display:grid;gap:7px;margin-top:12px}
.mcFollowUpQueueRow{display:grid;grid-template-columns:10px minmax(0,1fr) auto;align-items:center;gap:9px;width:100%;min-width:0;min-height:44px;padding:9px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.014);color:inherit;text-align:left;cursor:pointer;touch-action:manipulation;transition:border-color 150ms ease,background 150ms ease,transform 150ms ease}
.mcFollowUpQueueRow:hover,.mcFollowUpQueueRow:focus-visible{border-color:color-mix(in srgb,var(--mc-secondary,#77d7ff) 38%,rgba(255,255,255,.08));background:color-mix(in srgb,var(--mc-secondary,#77d7ff) 5%,rgba(255,255,255,.015));outline:none;transform:translateY(-1px)}
.mcFollowUpQueueRow:active{transform:scale(.992)}
.mcFollowUpQueueDot{width:8px;height:8px;border-radius:50%;background:#ffb547;box-shadow:0 0 0 3px rgba(255,181,71,.09)}
.mcFollowUpQueueRow.is-completed .mcFollowUpQueueDot{background:var(--mc,#c8ff1a);box-shadow:0 0 0 3px color-mix(in srgb,var(--mc,#c8ff1a) 12%,transparent)}
.mcFollowUpQueueRow span{min-width:0}.mcFollowUpQueueRow strong{display:block;overflow:hidden;color:var(--text-1,#f4f7f8);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:12px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.mcFollowUpQueueRow small{display:block;margin-top:3px;overflow:hidden;color:var(--text-3,#7d898f);font-size:8px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.mcFollowUpQueueRow em{color:var(--text-2,#aab3b8);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:10px;font-style:normal;font-weight:700}
.mcFollowUpQueueEmpty{margin-top:12px;padding:12px;border:1px solid color-mix(in srgb,var(--mc,#c8ff1a) 22%,rgba(255,255,255,.06));border-radius:12px;background:color-mix(in srgb,var(--mc,#c8ff1a) 4%,rgba(255,255,255,.01));color:var(--text-2,#aab3b8);font:600 12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcFollowUpQueueHistory{margin-top:12px;border-top:1px solid rgba(255,255,255,.07);padding-top:10px}.mcFollowUpQueueHistory summary{min-height:32px;color:var(--text-2,#aab3b8);font-size:9px;font-weight:800;cursor:pointer}.mcFollowUpQueueHistory[open] summary{margin-bottom:7px}
.mcFollowUpQueueStatus{margin-top:9px;color:var(--text-3,#7d898f);font:600 9px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
@media(max-width:420px){.mcFollowUpQueueHead h2{font-size:21px}}
@media(prefers-reduced-motion:reduce){.mcFollowUpQueueRow{transition:none}.mcFollowUpQueueRow:hover,.mcFollowUpQueueRow:focus-visible,.mcFollowUpQueueRow:active{transform:none}}
`;

const clean = (value) => String(value ?? "").trim();
const formatWhen = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const notePreview = (record = {}) => clean(record.note) || "No private note added";

function FollowUpRow({ record, completed = false }) {
  return React.createElement(
    "button",
    {
      type: "button",
      className: `mcFollowUpQueueRow ${completed ? "is-completed" : "is-planned"}`,
      onClick: () => openExactPlayerFollowUp({ email: record.playerIdentity, name: record.playerName }),
      "aria-label": `Open ${record.playerName || record.playerIdentity} follow-up`,
      "data-player-email": record.playerIdentity,
    },
    React.createElement("i", { className: "mcFollowUpQueueDot", "aria-hidden": "true" }),
    React.createElement(
      "span",
      null,
      React.createElement("strong", null, record.playerName || record.playerIdentity),
      React.createElement("small", null, `${notePreview(record)} · ${completed ? "completed" : "updated"} ${formatWhen(completed ? record.completedAt || record.updatedAt : record.updatedAt)}`),
    ),
    React.createElement("em", { "aria-hidden": "true" }, completed ? "Review ›" : "Open ›"),
  );
}

function CoachFollowUpQueuePanel() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => loadCoachFollowUpQueue().then((next) => {
      if (!cancelled) setResult(next);
    });
    load();
    const handleChange = () => load();
    window.addEventListener(CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const queue = result?.queue;
  if (!queue?.hasRecords) return null;
  const visiblePlanned = queue.planned.slice(0, 4);
  const visibleCompleted = queue.completed.slice(0, 4);

  return React.createElement(
    "article",
    {
      className: "mcSection mcFollowUpQueue",
      "data-testid": "coach-follow-up-queue",
      "data-open-count": String(queue.openCount),
      "data-storage-mode": result.storageMode || "unknown",
      "aria-labelledby": "mc-follow-up-queue-heading",
    },
    React.createElement(
      "div",
      { className: "mcFollowUpQueueHead" },
      React.createElement("span", null,
        React.createElement("small", null, "Coach workflow"),
        React.createElement("h2", { id: "mc-follow-up-queue-heading" }, "Open follow-ups")),
      React.createElement("strong", { className: `mcFollowUpQueueCount ${queue.openCount === 0 ? "is-clear" : ""}` }, queue.openCount === 0 ? "CLEAR" : `${queue.openCount} OPEN`),
    ),
    React.createElement("div", { className: "mcFollowUpQueueMeta" }, `${queue.openCount} planned · ${queue.completedCount} completed record${queue.completedCount === 1 ? "" : "s"}`),
    queue.openCount > 0
      ? React.createElement("div", { className: "mcFollowUpQueueRows", "aria-label": "Open coach follow-ups" }, visiblePlanned.map((record) => React.createElement(FollowUpRow, { record, key: `${record.teamId}:${record.playerIdentity}` })))
      : React.createElement("div", { className: "mcFollowUpQueueEmpty" }, "No open coach follow-ups. Completed records remain available below for reference."),
    visibleCompleted.length > 0
      ? React.createElement(
        "details",
        { className: "mcFollowUpQueueHistory" },
        React.createElement("summary", null, `Completed history · ${queue.completedCount}`),
        React.createElement("div", { className: "mcFollowUpQueueRows", "aria-label": "Completed coach follow-ups" }, visibleCompleted.map((record) => React.createElement(FollowUpRow, { record, completed: true, key: `${record.teamId}:${record.playerIdentity}` }))),
      )
      : null,
    React.createElement("div", { className: "mcFollowUpQueueStatus" }, result.ok ? (result.storageMode === "team_remote" ? "Synced coach-only records" : "Demo or local records") : "Showing local records because team sync is unavailable"),
  );
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

export function installCoachFollowUpQueueEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachFollowUpQueueEnhancer) return true;
  window.__shotlabCoachFollowUpQueueEnhancer = true;
  ensureStyles();

  let host = null;
  let root = null;
  let target = null;
  let frame = null;

  const reconcile = () => {
    frame = null;
    const nextTarget = document.querySelector('[data-testid="coach-command-center-full"] .mcFocusGrid');
    if (nextTarget === target && host?.isConnected) return;
    root?.unmount?.();
    host?.remove?.();
    host = null;
    root = null;
    target = nextTarget;
    if (!target) return;
    host = document.createElement("div");
    host.className = "mcFollowUpQueueHost";
    host.dataset.testid = HOST_TEST_ID;
    target.appendChild(host);
    root = createRoot(host);
    root.render(React.createElement(CoachFollowUpQueuePanel));
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

export { CHANGE_EVENT as COACH_FOLLOW_UP_CHANGE_EVENT };
