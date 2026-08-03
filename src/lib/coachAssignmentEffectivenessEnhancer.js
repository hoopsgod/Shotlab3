import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { openExactPlayerFollowUp } from "./coachAssignmentOutcomeEnhancer.js";
import { loadCoachAssignmentEffectiveness } from "./coachAssignmentEffectiveness.js";
import { PLAYER_ASSIGNMENT_CHANGE_EVENT } from "./playerAssignmentService.js";

const STYLE_ID = "shotlab-coach-assignment-effectiveness-styles";
const HOST_TEST_ID = "coach-assignment-effectiveness-host";
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const parse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };

const styles = `
.mcAssignmentEffectivenessHost{grid-column:1/-1;min-width:0}
.mcAssignmentEffectiveness{position:relative;overflow:hidden}
.mcAssignmentEffectiveness::after{content:"";position:absolute;right:-68px;top:-72px;width:184px;height:184px;border-radius:50%;background:color-mix(in srgb,var(--mc-secondary,#77d7ff) 8%,transparent);filter:blur(36px);pointer-events:none}
.mcAssignmentEffectiveness>*{position:relative;z-index:1}
.mcAssignmentEffectivenessHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.mcAssignmentEffectivenessHead small,.mcAssignmentEffectivenessMeta,.mcAssignmentEffectivenessFact small,.mcAssignmentEffectivenessRow small,.mcAssignmentEffectivenessStatus{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}
.mcAssignmentEffectivenessHead small{display:block;color:var(--text-3,#7d898f);font-size:9px;font-weight:800}
.mcAssignmentEffectivenessHead h2{margin:4px 0 0;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:24px;font-weight:400;line-height:1;letter-spacing:.035em}
.mcAssignmentEffectivenessBadge{display:grid;place-items:center;min-width:76px;height:34px;padding:0 11px;border:1px solid color-mix(in srgb,var(--mc-secondary,#77d7ff) 35%,rgba(255,255,255,.08));border-radius:999px;background:color-mix(in srgb,var(--mc-secondary,#77d7ff) 8%,rgba(255,255,255,.018));color:var(--mc-secondary,#77d7ff);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
.mcAssignmentEffectivenessMeta{margin-top:8px;color:var(--text-2,#aab3b8);font-size:10px;font-weight:700;line-height:1.45}
.mcAssignmentEffectivenessFacts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}
.mcAssignmentEffectivenessFact{min-width:0;padding:10px 8px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.014);text-align:center}
.mcAssignmentEffectivenessFact strong{display:block;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:21px;font-weight:400;line-height:1}
.mcAssignmentEffectivenessFact small{display:block;margin-top:4px;color:var(--text-3,#7d898f);font-size:7px;font-weight:800;line-height:1.2}
.mcAssignmentEffectivenessFact.is-on-time{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 23%,rgba(255,255,255,.06))}
.mcAssignmentEffectivenessFact.is-response{border-color:color-mix(in srgb,var(--mc-secondary,#77d7ff) 24%,rgba(255,255,255,.06))}
.mcAssignmentEffectivenessFact.is-completion{border-color:rgba(183,165,255,.22)}
.mcAssignmentEffectivenessRows{display:grid;gap:7px;margin-top:12px}
.mcAssignmentEffectivenessRow{display:grid;grid-template-columns:10px minmax(0,1fr) auto;align-items:center;gap:9px;width:100%;min-width:0;min-height:48px;padding:9px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(255,255,255,.013);color:inherit;text-align:left;cursor:pointer;touch-action:manipulation;transition:border-color 150ms ease,background 150ms ease,transform 150ms ease}
.mcAssignmentEffectivenessRow:hover,.mcAssignmentEffectivenessRow:focus-visible{border-color:color-mix(in srgb,var(--mc-secondary,#77d7ff) 38%,rgba(255,255,255,.08));background:color-mix(in srgb,var(--mc-secondary,#77d7ff) 5%,rgba(255,255,255,.015));outline:none;transform:translateY(-1px)}
.mcAssignmentEffectivenessRow:active{transform:scale(.992)}
.mcAssignmentEffectivenessDot{width:8px;height:8px;border-radius:50%;background:var(--mc,#c8ff1a);box-shadow:0 0 0 3px color-mix(in srgb,var(--mc,#c8ff1a) 12%,transparent)}
.mcAssignmentEffectivenessRow.needs-review .mcAssignmentEffectivenessDot{background:#ffb547;box-shadow:0 0 0 3px rgba(255,181,71,.10)}
.mcAssignmentEffectivenessRow span{min-width:0}.mcAssignmentEffectivenessRow strong{display:block;overflow:hidden;color:var(--text-1,#f4f7f8);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:12px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.mcAssignmentEffectivenessRow small{display:block;margin-top:3px;overflow:hidden;color:var(--text-3,#7d898f);font-size:8px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.mcAssignmentEffectivenessRow em{color:var(--text-2,#aab3b8);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:10px;font-style:normal;font-weight:700;white-space:nowrap}.mcAssignmentEffectivenessRow.needs-review em{color:#ffca76}
.mcAssignmentEffectivenessStatus{margin-top:10px;color:var(--text-3,#7d898f);font-size:8px;font-weight:700;line-height:1.5}
@media(max-width:420px){.mcAssignmentEffectivenessHead h2{font-size:21px}.mcAssignmentEffectivenessFacts{grid-template-columns:1fr 1fr}.mcAssignmentEffectivenessFact:last-child{grid-column:1/-1}.mcAssignmentEffectivenessRow{grid-template-columns:9px minmax(0,1fr) auto}}
@media(prefers-reduced-motion:reduce){.mcAssignmentEffectivenessRow{transition:none}.mcAssignmentEffectivenessRow:hover,.mcAssignmentEffectivenessRow:focus-visible,.mcAssignmentEffectivenessRow:active{transform:none}}
`;

function sessionTeamId(storage = globalThis?.localStorage) {
  const raw = parse(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] || {} : raw;
  return clean(session?.teamId || session?.team_id, 180);
}

export function formatEffectivenessDuration(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(ms / 3600000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
}

const formatWhen = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString([], { month: "short", day: "numeric" });
};

function Fact({ className = "", value, label }) {
  return React.createElement("div", { className: `mcAssignmentEffectivenessFact ${className}` },
    React.createElement("strong", null, value),
    React.createElement("small", null, label));
}

function PlayerRow({ row }) {
  const needsReview = row.lateCount > 0;
  const pace = formatEffectivenessDuration(row.medianCompletionMs);
  const when = formatWhen(row.lastCompletedAt);
  const detail = [
    `${row.cycles} cycle${row.cycles === 1 ? "" : "s"}`,
    needsReview ? `${row.lateCount} late` : row.deadlineCycles ? "all dated work on time" : "no deadline sample",
    pace !== "—" ? `median ${pace}` : "pace unavailable",
    when ? `last ${when}` : "",
  ].filter(Boolean).join(" · ");
  return React.createElement("button", {
    type: "button",
    className: `mcAssignmentEffectivenessRow ${needsReview ? "needs-review" : ""}`,
    onClick: () => openExactPlayerFollowUp({ email: row.playerIdentity, name: row.playerName }),
    "aria-label": `Open ${row.playerName || row.playerIdentity} assignment effectiveness`,
    "data-testid": "coach-assignment-effectiveness-player",
    "data-player-email": row.playerIdentity,
    "data-late-count": String(row.lateCount),
  },
  React.createElement("i", { className: "mcAssignmentEffectivenessDot", "aria-hidden": "true" }),
  React.createElement("span", null, React.createElement("strong", null, row.playerName || row.playerIdentity), React.createElement("small", null, detail)),
  React.createElement("em", { "aria-hidden": "true" }, needsReview ? "Review ›" : "Inspect ›"));
}

function CoachAssignmentEffectivenessPanel() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let cancelled = false;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      const next = await loadCoachAssignmentEffectiveness({ teamId: sessionTeamId() });
      loading = false;
      if (!cancelled) setResult(next);
    };
    load();
    window.addEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, load);
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, load);
      window.removeEventListener("storage", load);
      window.removeEventListener("focus", load);
    };
  }, []);

  const model = result?.model;
  if (!model?.hasEvidence) return null;
  const visiblePlayers = model.players.slice(0, 5);
  return React.createElement("article", {
    className: "mcSection mcAssignmentEffectiveness",
    "data-testid": "coach-assignment-effectiveness",
    "data-cycle-count": String(model.total),
    "data-player-count": String(model.playerCount),
    "data-deadline-count": String(model.deadlineCount),
    "data-on-time-rate": model.onTimeRate == null ? "unavailable" : String(model.onTimeRate),
    "data-attention-count": String(model.attentionCount),
    "data-storage-mode": result?.storageMode || "unknown",
    "aria-labelledby": "mc-assignment-effectiveness-heading",
  },
  React.createElement("div", { className: "mcAssignmentEffectivenessHead" },
    React.createElement("span", null, React.createElement("small", null, "Assignment intelligence"), React.createElement("h2", { id: "mc-assignment-effectiveness-heading" }, "Assignment effectiveness")),
    React.createElement("strong", { className: "mcAssignmentEffectivenessBadge" }, model.sampleLabel)),
  React.createElement("div", { className: "mcAssignmentEffectivenessMeta" }, `${model.total} completed cycle${model.total === 1 ? "" : "s"} · ${model.playerCount} player${model.playerCount === 1 ? "" : "s"} represented${model.attentionCount ? ` · ${model.attentionCount} need deadline review` : ""}`),
  React.createElement("div", { className: "mcAssignmentEffectivenessFacts", "aria-label": "Assignment effectiveness facts" },
    React.createElement(Fact, { className: "is-on-time", value: model.onTimeRate == null ? "—" : `${model.onTimeRate}%`, label: model.deadlineCount ? `On time · ${model.deadlineCount} dated` : "On time · no dates" }),
    React.createElement(Fact, { className: "is-response", value: formatEffectivenessDuration(model.medianResponseMs), label: `Median response · ${model.responseSampleCount}` }),
    React.createElement(Fact, { className: "is-completion", value: formatEffectivenessDuration(model.medianCompletionMs), label: `Median completion · ${model.completionSampleCount}` })),
  visiblePlayers.length ? React.createElement("div", { className: "mcAssignmentEffectivenessRows", "aria-label": "Player assignment cadence" }, ...visiblePlayers.map((row) => React.createElement(PlayerRow, { row, key: row.playerIdentity }))) : null,
  React.createElement("div", { className: "mcAssignmentEffectivenessStatus" }, result?.storageMode === "team_remote"
    ? "Server-synced completion timestamps · on-time uses due date versus player completion · private coach notes excluded"
    : "Local or demo completion evidence · metrics use only valid assignment lifecycle timestamps"));
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

export function installCoachAssignmentEffectivenessEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachAssignmentEffectivenessEnhancer) return true;
  window.__shotlabCoachAssignmentEffectivenessEnhancer = true;
  ensureStyles();

  let host = null;
  let root = null;
  let target = null;
  let frame = null;

  const reconcile = () => {
    frame = null;
    const nextTarget = document.querySelector('[data-testid="coach-command-center-full"] .mcFocusGrid');
    if (!nextTarget) {
      root?.unmount?.();
      host?.remove?.();
      root = null;
      host = null;
      target = null;
      return;
    }
    if (nextTarget !== target) {
      root?.unmount?.();
      host?.remove?.();
      target = nextTarget;
      host = document.createElement("div");
      host.className = "mcAssignmentEffectivenessHost";
      host.dataset.testid = HOST_TEST_ID;
      root = createRoot(host);
      root.render(React.createElement(CoachAssignmentEffectivenessPanel));
    }
    const accountabilityHost = target.querySelector('[data-testid="coach-assignment-accountability-host"]');
    if (accountabilityHost) {
      if (accountabilityHost.nextSibling !== host) target.insertBefore(host, accountabilityHost.nextSibling);
    } else if (!host.isConnected) target.appendChild(host);
  };

  const schedule = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(reconcile);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  schedule();
  return true;
}
