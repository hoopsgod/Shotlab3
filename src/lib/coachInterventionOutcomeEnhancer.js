import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadCoachAssignmentEffectiveness } from "./coachAssignmentEffectiveness.js";
import { PLAYER_ASSIGNMENT_CHANGE_EVENT } from "./playerAssignmentService.js";

const STORAGE_KEY = "sl:coach-intervention-baselines:v1";
const STYLE_ID = "shotlab-coach-intervention-outcome-styles";
const HOST_TEST_ID = "coach-intervention-outcomes-host";
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const parse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

function sessionTeamId(storage = globalThis?.localStorage) {
  const raw = parse(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] || {} : raw;
  return clean(session?.teamId || session?.team_id, 180);
}

export function buildInterventionOutcome({ baseline = {}, player = {} } = {}) {
  const baselineCycles = Math.max(0, Number(baseline.cycles) || 0);
  const currentCycles = Math.max(0, Number(player.cycles) || 0);
  const postCycles = Math.max(0, currentCycles - baselineCycles);
  if (!postCycles) return { status: "awaiting", postCycles: 0, sampleLabel: "Awaiting evidence", changes: [] };
  const changes = [];
  const beforeLate = Math.max(0, Number(baseline.lateCount) || 0);
  const afterLate = Math.max(0, Number(player.lateCount) || 0) - beforeLate;
  if (postCycles > 0) changes.push({ id: "deadline", label: "Post-intervention late completions", value: Math.max(0, afterLate), direction: afterLate <= 0 ? "favorable" : "needs-review" });
  const beforeResponse = finite(baseline.medianResponseMs);
  const afterResponse = finite(player.medianResponseMs);
  if (beforeResponse != null && afterResponse != null) changes.push({ id: "response", label: "Median acknowledgment", value: afterResponse - beforeResponse, direction: afterResponse < beforeResponse ? "favorable" : afterResponse > beforeResponse ? "needs-review" : "neutral" });
  const beforeCompletion = finite(baseline.medianCompletionMs);
  const afterCompletion = finite(player.medianCompletionMs);
  if (beforeCompletion != null && afterCompletion != null) changes.push({ id: "completion", label: "Median completion pace", value: afterCompletion - beforeCompletion, direction: afterCompletion < beforeCompletion ? "favorable" : afterCompletion > beforeCompletion ? "needs-review" : "neutral" });
  return { status: "observed", postCycles, sampleLabel: postCycles >= 3 ? "Developing signal" : "Early signal", changes };
}

export function recordInterventionBaseline({ teamId, player, promptType = "", storage = globalThis?.localStorage, now = new Date().toISOString() } = {}) {
  if (!teamId || !player?.playerIdentity || !storage?.setItem) return false;
  const all = parse(storage.getItem(STORAGE_KEY), []);
  const next = [...(Array.isArray(all) ? all : []).filter((row) => !(row.teamId === teamId && row.playerIdentity === player.playerIdentity)), {
    teamId,
    playerIdentity: player.playerIdentity,
    playerName: player.playerName,
    promptType: clean(promptType, 80),
    recordedAt: now,
    cycles: player.cycles,
    lateCount: player.lateCount,
    medianResponseMs: player.medianResponseMs,
    medianCompletionMs: player.medianCompletionMs,
  }];
  storage.setItem(STORAGE_KEY, JSON.stringify(next.slice(-30)));
  window.dispatchEvent(new CustomEvent("shotlab:coach-intervention-baseline-change"));
  return true;
}

const formatDelta = (change) => {
  if (change.id === "deadline") return String(change.value);
  const hours = Math.round(Math.abs(change.value) / 3600000);
  if (!hours) return "No material change";
  return `${change.value < 0 ? "−" : "+"}${hours}h`;
};

const styles = `.mcInterventionOutcomeHost{grid-column:1/-1;min-width:0}.mcInterventionOutcomes h2{margin:4px 0 0;font:400 24px/1 'Bebas Neue',Impact,sans-serif;color:var(--text-1,#f4f7f8)}.mcInterventionOutcomes small,.mcInterventionOutcomesMeta{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}.mcInterventionOutcomesMeta{margin-top:8px;color:var(--text-2,#aab3b8);font-size:10px}.mcInterventionOutcomeRows{display:grid;gap:8px;margin-top:12px}.mcInterventionOutcomeRow{padding:11px;border:1px solid rgba(255,255,255,.075);border-radius:12px;background:rgba(255,255,255,.014)}.mcInterventionOutcomeRow strong{display:block;color:var(--text-1,#f4f7f8);font:800 13px/1.3 'Barlow Condensed','Arial Narrow',sans-serif}.mcInterventionOutcomeFacts{display:flex;flex-wrap:wrap;gap:7px;margin-top:7px}.mcInterventionOutcomeFact{padding:7px 9px;border:1px solid rgba(255,255,255,.07);border-radius:10px;color:var(--text-2,#aab3b8);font:700 10px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.mcInterventionOutcomeFact.favorable{border-color:rgba(200,255,26,.25)}.mcInterventionOutcomeFact.needs-review{border-color:rgba(255,181,71,.28)}.mcInterventionOutcomeNote{margin-top:9px;color:var(--text-3,#7d898f);font:600 9px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}`;

function Panel() {
  const [state, setState] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const teamId = sessionTeamId();
      const result = await loadCoachAssignmentEffectiveness({ teamId });
      const baselines = parse(localStorage.getItem(STORAGE_KEY), []).filter((row) => row.teamId === teamId);
      if (!cancelled) setState({ result, baselines });
    };
    load();
    const events = [PLAYER_ASSIGNMENT_CHANGE_EVENT, "storage", "focus", "shotlab:coach-intervention-baseline-change"];
    events.forEach((name) => window.addEventListener(name, load));
    return () => { cancelled = true; events.forEach((name) => window.removeEventListener(name, load)); };
  }, []);
  const players = state?.result?.model?.players || [];
  const rows = (state?.baselines || []).map((baseline) => {
    const player = players.find((row) => row.playerIdentity === baseline.playerIdentity);
    return player ? { baseline, player, outcome: buildInterventionOutcome({ baseline, player }) } : null;
  }).filter(Boolean).slice(-5).reverse();
  if (!rows.length) return null;
  return React.createElement("article", { className: "mcSection mcInterventionOutcomes", "data-testid": "coach-intervention-outcomes" },
    React.createElement("small", null, "Coach intervention follow-through"),
    React.createElement("h2", null, "Observed outcomes"),
    React.createElement("div", { className: "mcInterventionOutcomesMeta" }, "Device-local baselines compare later completed cycles. Changes are associations, not proof that an intervention caused the result."),
    React.createElement("div", { className: "mcInterventionOutcomeRows" }, ...rows.map(({ baseline, outcome }) => React.createElement("section", { className: "mcInterventionOutcomeRow", key: `${baseline.teamId}:${baseline.playerIdentity}` },
      React.createElement("strong", null, `${baseline.playerName || baseline.playerIdentity} · ${outcome.sampleLabel}`),
      outcome.status === "awaiting" ? React.createElement("div", { className: "mcInterventionOutcomeNote" }, "Waiting for a completed assignment after the coach-approved intervention.") : React.createElement("div", { className: "mcInterventionOutcomeFacts" }, ...outcome.changes.map((change) => React.createElement("span", { className: `mcInterventionOutcomeFact ${change.direction}`, key: change.id }, `${change.label}: ${formatDelta(change)}`))),
      React.createElement("div", { className: "mcInterventionOutcomeNote" }, `${outcome.postCycles} post-intervention completed cycle${outcome.postCycles === 1 ? "" : "s"} · baseline stored on this device · private coach notes excluded`)))));
}

function ensureStyles() { if (!document.getElementById(STYLE_ID)) { const style = document.createElement("style"); style.id = STYLE_ID; style.textContent = styles; document.head.appendChild(style); } }

export function installCoachInterventionOutcomeEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachInterventionOutcomeEnhancer) return true;
  window.__shotlabCoachInterventionOutcomeEnhancer = true;
  ensureStyles();
  let host, root, frame;
  const captureDelivered = async () => {
    const sheet = document.querySelector('[data-testid="coach-assignment-intervention"][data-state="delivered"]');
    if (!sheet || sheet.dataset.outcomeCaptured === "true") return;
    sheet.dataset.outcomeCaptured = "true";
    const teamId = sessionTeamId();
    const playerIdentity = clean(sheet.getAttribute("data-player-email"), 320).toLowerCase();
    const result = await loadCoachAssignmentEffectiveness({ teamId });
    const player = result?.model?.players?.find((row) => row.playerIdentity === playerIdentity);
    if (player) recordInterventionBaseline({ teamId, player, promptType: sheet.getAttribute("data-prompt-type") });
  };
  const reconcile = () => {
    frame = null;
    captureDelivered();
    const target = document.querySelector('[data-testid="coach-command-center-full"] .mcFocusGrid');
    if (!target) { root?.unmount?.(); host?.remove?.(); host = root = null; return; }
    if (!host?.isConnected) { host = document.createElement("div"); host.className = "mcInterventionOutcomeHost"; host.dataset.testid = HOST_TEST_ID; target.appendChild(host); root = createRoot(host); root.render(React.createElement(Panel)); }
  };
  const schedule = () => { if (frame == null) frame = window.requestAnimationFrame(reconcile); };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
  schedule();
  return true;
}

export const __testUtils = { STORAGE_KEY };
