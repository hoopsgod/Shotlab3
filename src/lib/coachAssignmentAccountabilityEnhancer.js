import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { openExactPlayerFollowUp } from "./coachAssignmentOutcomeEnhancer.js";
import { loadCoachAssignmentAccountability } from "./coachAssignmentAccountability.js";
import { PLAYER_ASSIGNMENT_CHANGE_EVENT } from "./playerAssignmentService.js";

const STYLE_ID = "shotlab-coach-assignment-accountability-styles";
const HOST_TEST_ID = "coach-assignment-accountability-host";

const styles = `
.mcAssignmentAccountabilityHost{grid-column:1/-1;min-width:0}
.mcAssignmentAccountability{position:relative;overflow:hidden}
.mcAssignmentAccountability::after{content:"";position:absolute;right:-72px;top:-74px;width:190px;height:190px;border-radius:50%;background:color-mix(in srgb,var(--mc-secondary,#77d7ff) 8%,transparent);filter:blur(38px);pointer-events:none}
.mcAssignmentAccountability>*{position:relative;z-index:1}
.mcAssignmentAccountabilityHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.mcAssignmentAccountabilityHead small,.mcAssignmentAccountabilityMeta,.mcAssignmentStateFact small,.mcAssignmentAccountabilityRow small,.mcAssignmentAccountabilityHistory summary,.mcAssignmentAccountabilityStatus{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}
.mcAssignmentAccountabilityHead small{display:block;color:var(--text-3,#7d898f);font-size:9px;font-weight:800}
.mcAssignmentAccountabilityHead h2{margin:4px 0 0;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:24px;font-weight:400;line-height:1;letter-spacing:.035em}
.mcAssignmentAccountabilityBadge{display:grid;place-items:center;min-width:62px;height:34px;padding:0 11px;border:1px solid rgba(255,181,71,.42);border-radius:999px;background:rgba(255,181,71,.09);color:#ffca76;font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
.mcAssignmentAccountabilityBadge.is-clear{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 34%,transparent);background:color-mix(in srgb,var(--mc,#c8ff1a) 7%,transparent);color:var(--mc,#c8ff1a)}
.mcAssignmentAccountabilityMeta{margin-top:8px;color:var(--text-2,#aab3b8);font-size:10px;font-weight:700;line-height:1.45}
.mcAssignmentStateFacts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}
.mcAssignmentStateFact{min-width:0;padding:9px 8px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.014);text-align:center}
.mcAssignmentStateFact strong{display:block;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:20px;font-weight:400;line-height:1}
.mcAssignmentStateFact small{display:block;margin-top:4px;color:var(--text-3,#7d898f);font-size:7px;font-weight:800;line-height:1.2}
.mcAssignmentStateFact.is-assigned{border-color:rgba(255,181,71,.20)}
.mcAssignmentStateFact.is-acknowledged{border-color:rgba(183,165,255,.20)}
.mcAssignmentStateFact.is-started{border-color:color-mix(in srgb,var(--mc-secondary,#77d7ff) 22%,rgba(255,255,255,.06))}
.mcAssignmentStateFact.is-completed{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 22%,rgba(255,255,255,.06))}
.mcAssignmentAccountabilityRows{display:grid;gap:7px;margin-top:12px}
.mcAssignmentAccountabilityRow{display:grid;grid-template-columns:10px minmax(0,1fr) auto;align-items:center;gap:9px;width:100%;min-width:0;min-height:46px;padding:9px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.013);color:inherit;text-align:left;cursor:pointer;touch-action:manipulation;transition:border-color 150ms ease,background 150ms ease,transform 150ms ease}
.mcAssignmentAccountabilityRow:hover,.mcAssignmentAccountabilityRow:focus-visible{border-color:color-mix(in srgb,var(--mc-secondary,#77d7ff) 38%,rgba(255,255,255,.08));background:color-mix(in srgb,var(--mc-secondary,#77d7ff) 5%,rgba(255,255,255,.015));outline:none;transform:translateY(-1px)}
.mcAssignmentAccountabilityRow:active{transform:scale(.992)}
.mcAssignmentAccountabilityDot{width:8px;height:8px;border-radius:50%;background:#6f7b80;box-shadow:0 0 0 3px rgba(255,255,255,.045)}
.mcAssignmentAccountabilityRow.is-assigned .mcAssignmentAccountabilityDot{background:#ffb547;box-shadow:0 0 0 3px rgba(255,181,71,.09)}
.mcAssignmentAccountabilityRow.is-acknowledged .mcAssignmentAccountabilityDot{background:#b7a5ff;box-shadow:0 0 0 3px rgba(183,165,255,.09)}
.mcAssignmentAccountabilityRow.is-started .mcAssignmentAccountabilityDot{background:var(--mc-secondary,#77d7ff);box-shadow:0 0 0 3px color-mix(in srgb,var(--mc-secondary,#77d7ff) 12%,transparent)}
.mcAssignmentAccountabilityRow.is-completed .mcAssignmentAccountabilityDot{background:var(--mc,#c8ff1a);box-shadow:0 0 0 3px color-mix(in srgb,var(--mc,#c8ff1a) 12%,transparent)}
.mcAssignmentAccountabilityRow span{min-width:0}.mcAssignmentAccountabilityRow strong{display:block;overflow:hidden;color:var(--text-1,#f4f7f8);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:12px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.mcAssignmentAccountabilityRow small{display:block;margin-top:3px;overflow:hidden;color:var(--text-3,#7d898f);font-size:8px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.mcAssignmentAccountabilityRow em{color:var(--text-2,#aab3b8);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:10px;font-style:normal;font-weight:700;white-space:nowrap}
.mcAssignmentAccountabilityEmpty{margin-top:12px;padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.012);color:var(--text-2,#aab3b8);font:600 12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcAssignmentAccountabilityMore{margin:9px 0 0;color:var(--text-3,#7d898f);font:700 9px/1.4 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase}
.mcAssignmentAccountabilityHistory{margin-top:12px;border-top:1px solid rgba(255,255,255,.07);padding-top:10px}.mcAssignmentAccountabilityHistory summary{min-height:32px;color:var(--text-2,#aab3b8);font-size:9px;font-weight:800;cursor:pointer}.mcAssignmentAccountabilityHistory[open] summary{margin-bottom:7px}
.mcAssignmentAccountabilityStatus{margin-top:9px;color:var(--text-3,#7d898f);font-size:8px;font-weight:700;line-height:1.45}
@media(max-width:420px){.mcAssignmentAccountabilityHead h2{font-size:21px}.mcAssignmentStateFacts{grid-template-columns:repeat(2,minmax(0,1fr))}.mcAssignmentStateFact:last-child{grid-column:1/-1}.mcAssignmentAccountabilityRow{grid-template-columns:9px minmax(0,1fr) auto}}
@media(prefers-reduced-motion:reduce){.mcAssignmentAccountabilityRow{transition:none}.mcAssignmentAccountabilityRow:hover,.mcAssignmentAccountabilityRow:focus-visible,.mcAssignmentAccountabilityRow:active{transform:none}}
`;

const STATE_LABELS = {
  unassigned: "Unassigned",
  assigned: "Awaiting acknowledgment",
  acknowledged: "Acknowledged · not started",
  started: "Started · completion pending",
  completed: "Player completed",
};

const formatWhen = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

function AssignmentRow({ row }) {
  const when = formatWhen(row.completedAt || row.updatedAt);
  const status = STATE_LABELS[row.state] || STATE_LABELS.unassigned;
  return React.createElement(
    "button",
    {
      type: "button",
      className: `mcAssignmentAccountabilityRow is-${row.state}`,
      onClick: () => openExactPlayerFollowUp({ email: row.playerIdentity, name: row.playerName }),
      "aria-label": `Open ${row.playerName || row.playerIdentity} assignment accountability`,
      "data-player-email": row.playerIdentity,
      "data-assignment-state": row.state,
    },
    React.createElement("i", { className: "mcAssignmentAccountabilityDot", "aria-hidden": "true" }),
    React.createElement(
      "span",
      null,
      React.createElement("strong", null, row.playerName || row.playerIdentity),
      React.createElement("small", null, `${status}${when ? ` · ${when}` : ""}`),
    ),
    React.createElement("em", { "aria-hidden": "true" }, row.state === "unassigned" ? "Assign ›" : "Review ›"),
  );
}

function StateFact({ state, count }) {
  return React.createElement(
    "div",
    { className: `mcAssignmentStateFact is-${state}`, "data-assignment-state": state },
    React.createElement("strong", null, String(count)),
    React.createElement("small", null, state === "unassigned" ? "No assignment" : state),
  );
}

function CoachAssignmentAccountabilityPanel() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      const next = await loadCoachAssignmentAccountability();
      loading = false;
      if (!cancelled) setResult(next);
    };
    const handleChange = () => load();
    load();
    window.addEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    window.addEventListener("focus", handleChange);
    return () => {
      cancelled = true;
      window.removeEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
      window.removeEventListener("focus", handleChange);
    };
  }, []);

  const model = result?.model;
  if (!model) return null;
  const visibleActionRows = model.actionRows.slice(0, 6);
  const visibleCompletedRows = model.completedRows.slice(0, 6);
  const badgeLabel = !model.hasRoster ? "NO ROSTER" : model.actionCount === 0 ? "CLEAR" : `${model.actionCount} ACTION${model.actionCount === 1 ? "" : "S"}`;

  return React.createElement(
    "article",
    {
      className: "mcSection mcAssignmentAccountability",
      "data-testid": "coach-assignment-accountability",
      "data-total-count": String(model.total),
      "data-unassigned-count": String(model.counts.unassigned),
      "data-assigned-count": String(model.counts.assigned),
      "data-acknowledged-count": String(model.counts.acknowledged),
      "data-started-count": String(model.counts.started),
      "data-completed-count": String(model.counts.completed),
      "data-storage-mode": result.storageMode || "unknown",
      "aria-labelledby": "mc-assignment-accountability-heading",
    },
    React.createElement(
      "div",
      { className: "mcAssignmentAccountabilityHead" },
      React.createElement("span", null,
        React.createElement("small", null, "Player response"),
        React.createElement("h2", { id: "mc-assignment-accountability-heading" }, "Assignment accountability")),
      React.createElement("strong", { className: `mcAssignmentAccountabilityBadge ${model.actionCount === 0 && model.hasRoster ? "is-clear" : ""}` }, badgeLabel),
    ),
    React.createElement("div", { className: "mcAssignmentAccountabilityMeta" }, model.hasRoster
      ? `${model.delivered}/${model.total} assigned · ${model.responseRate}% responded · ${model.completionRate}% completed`
      : "Connect a player to begin tracking assignment response."),
    React.createElement(
      "div",
      { className: "mcAssignmentStateFacts", "aria-label": "Assignment state totals" },
      React.createElement(StateFact, { state: "unassigned", count: model.counts.unassigned }),
      React.createElement(StateFact, { state: "assigned", count: model.counts.assigned }),
      React.createElement(StateFact, { state: "acknowledged", count: model.counts.acknowledged }),
      React.createElement(StateFact, { state: "started", count: model.counts.started }),
      React.createElement(StateFact, { state: "completed", count: model.counts.completed }),
    ),
    visibleActionRows.length
      ? React.createElement("div", { className: "mcAssignmentAccountabilityRows", "aria-label": "Players needing assignment action" }, visibleActionRows.map((row) => React.createElement(AssignmentRow, { row, key: `${row.teamId}:${row.playerIdentity}` })))
      : React.createElement("div", { className: "mcAssignmentAccountabilityEmpty" }, model.hasRoster ? "Every delivered assignment is complete. Reopen a player when the next training decision is ready." : "No active players are available for assignment tracking."),
    model.actionRows.length > visibleActionRows.length
      ? React.createElement("p", { className: "mcAssignmentAccountabilityMore" }, `${model.actionRows.length - visibleActionRows.length} more player${model.actionRows.length - visibleActionRows.length === 1 ? "" : "s"} need review in Players`)
      : null,
    visibleCompletedRows.length
      ? React.createElement(
        "details",
        { className: "mcAssignmentAccountabilityHistory" },
        React.createElement("summary", null, `Completed assignments · ${model.counts.completed}`),
        React.createElement("div", { className: "mcAssignmentAccountabilityRows", "aria-label": "Completed player assignments" }, visibleCompletedRows.map((row) => React.createElement(AssignmentRow, { row, key: `${row.teamId}:${row.playerIdentity}` }))),
      )
      : null,
    React.createElement("div", { className: "mcAssignmentAccountabilityStatus" }, result.ok
      ? result.storageMode === "team_remote"
        ? "Synced player-safe assignment status · private coach notes excluded"
        : "Demo or local assignment status · no remote delivery claim"
      : "Showing local assignment status because team sync is unavailable"),
  );
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

export function installCoachAssignmentAccountabilityEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachAssignmentAccountabilityEnhancer) return true;
  window.__shotlabCoachAssignmentAccountabilityEnhancer = true;
  ensureStyles();

  let host = null;
  let root = null;
  let target = null;
  let frame = null;

  const positionHost = () => {
    if (!target || !host) return;
    const followUpHost = target.querySelector('[data-testid="coach-follow-up-queue-host"]');
    if (followUpHost && host.nextSibling !== followUpHost) target.insertBefore(host, followUpHost);
    else if (!followUpHost && !host.isConnected) target.appendChild(host);
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
    host.className = "mcAssignmentAccountabilityHost";
    host.dataset.testid = HOST_TEST_ID;
    const followUpHost = target.querySelector('[data-testid="coach-follow-up-queue-host"]');
    if (followUpHost) target.insertBefore(host, followUpHost);
    else target.appendChild(host);
    root = createRoot(host);
    root.render(React.createElement(CoachAssignmentAccountabilityPanel));
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
