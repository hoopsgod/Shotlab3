import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { openExactPlayerFollowUp } from "./coachAssignmentOutcomeEnhancer.js";
import { loadCoachAssignmentEffectiveness } from "./coachAssignmentEffectiveness.js";
import { PLAYER_ASSIGNMENT_CHANGE_EVENT } from "./playerAssignmentService.js";

const STYLE_ID = "shotlab-coach-assignment-action-prompts-styles";
const HOST_TEST_ID = "coach-assignment-action-prompts-host";
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const parse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const DAY_MS = 24 * 60 * 60 * 1000;

const styles = `
.mcAssignmentActionPromptsHost{grid-column:1/-1;min-width:0}
.mcAssignmentActionPrompts{position:relative;overflow:hidden}
.mcAssignmentActionPromptsHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.mcAssignmentActionPromptsHead small,.mcAssignmentActionPromptsMeta,.mcAssignmentActionPrompt small,.mcAssignmentActionPrompt em{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}
.mcAssignmentActionPromptsHead small{display:block;color:var(--text-3,#7d898f);font-size:9px;font-weight:800}
.mcAssignmentActionPromptsHead h2{margin:4px 0 0;color:var(--text-1,#f4f7f8);font-family:'Bebas Neue',Impact,sans-serif;font-size:24px;font-weight:400;line-height:1;letter-spacing:.035em}
.mcAssignmentActionPromptsBadge{display:grid;place-items:center;min-width:74px;height:34px;padding:0 11px;border:1px solid rgba(255,181,71,.28);border-radius:999px;background:rgba(255,181,71,.06);color:#ffca76;font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:9px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
.mcAssignmentActionPromptsMeta{margin-top:8px;color:var(--text-2,#aab3b8);font-size:10px;font-weight:700;line-height:1.45}
.mcAssignmentActionPromptList{display:grid;gap:8px;margin-top:12px}
.mcAssignmentActionPrompt{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;min-height:56px;padding:10px;border:1px solid rgba(255,255,255,.075);border-radius:12px;background:rgba(255,255,255,.014)}
.mcAssignmentActionPrompt strong{display:block;color:var(--text-1,#f4f7f8);font-family:'Barlow Condensed','Arial Narrow',sans-serif;font-size:13px;font-weight:800}
.mcAssignmentActionPrompt p{margin:3px 0 0;color:var(--text-2,#aab3b8);font:600 11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.mcAssignmentActionPrompt small{display:block;margin-top:4px;color:var(--text-3,#7d898f);font-size:8px;font-weight:700;line-height:1.35}
.mcAssignmentActionPrompt button{min-width:84px;min-height:44px;padding:0 11px;border:1px solid color-mix(in srgb,var(--mc-secondary,#77d7ff) 35%,rgba(255,255,255,.08));border-radius:11px;background:color-mix(in srgb,var(--mc-secondary,#77d7ff) 7%,rgba(255,255,255,.02));color:var(--text-1,#f4f7f8);font:900 9px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}
.mcAssignmentActionPrompt button:hover,.mcAssignmentActionPrompt button:focus-visible{border-color:color-mix(in srgb,var(--mc-secondary,#77d7ff) 58%,rgba(255,255,255,.08));outline:none}
.mcAssignmentActionPrompt em{display:block;margin-top:10px;color:var(--text-3,#7d898f);font-size:8px;font-style:normal;font-weight:700;line-height:1.45}
@media(max-width:420px){.mcAssignmentActionPromptsHead h2{font-size:21px}.mcAssignmentActionPrompt{grid-template-columns:1fr}.mcAssignmentActionPrompt button{width:100%}}
`;

function sessionTeamId(storage = globalThis?.localStorage) {
  const raw = parse(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] || {} : raw;
  return clean(session?.teamId || session?.team_id, 180);
}

export function buildAssignmentActionPrompts(model = {}) {
  if (!model?.hasEvidence || !Array.isArray(model.players)) return [];
  const teamMedian = Number.isFinite(model.medianCompletionMs) ? model.medianCompletionMs : null;
  const prompts = [];

  for (const row of model.players) {
    const name = clean(row.playerName || row.playerIdentity, 320);
    if (!row.playerIdentity) continue;
    if (row.lateCount > 0) {
      prompts.push({
        id: `${row.playerIdentity}:deadline`,
        priority: 3,
        playerIdentity: row.playerIdentity,
        playerName: name,
        title: "Review deadline fit",
        detail: `${name} has ${row.lateCount} late completed assignment${row.lateCount === 1 ? "" : "s"}. Check whether the deadline, workload, or follow-through expectation needs adjustment.`,
        evidence: `${row.lateCount} late · ${row.cycles} completed cycle${row.cycles === 1 ? "" : "s"}`,
      });
      continue;
    }
    if (Number.isFinite(row.medianResponseMs) && row.medianResponseMs >= DAY_MS) {
      prompts.push({
        id: `${row.playerIdentity}:response`,
        priority: 2,
        playerIdentity: row.playerIdentity,
        playerName: name,
        title: "Clarify acknowledgment expectation",
        detail: `${name}'s median acknowledgment time is at least one day. Confirm that notifications and response expectations are clear.`,
        evidence: `${row.cycles} completed cycle${row.cycles === 1 ? "" : "s"} · response pattern only`,
      });
      continue;
    }
    if (teamMedian && Number.isFinite(row.medianCompletionMs) && row.medianCompletionMs > teamMedian * 1.5 && row.cycles >= 2) {
      prompts.push({
        id: `${row.playerIdentity}:scope`,
        priority: 1,
        playerIdentity: row.playerIdentity,
        playerName: name,
        title: "Review assignment scope",
        detail: `${name}'s completion pace is materially slower than the current team median. Check whether the assignment is too broad or support is missing.`,
        evidence: `${row.cycles} completed cycles · comparison is directional, not a grade`,
      });
    }
  }

  return prompts
    .sort((left, right) => right.priority - left.priority || left.playerName.localeCompare(right.playerName))
    .slice(0, 3);
}

function CoachAssignmentActionPromptsPanel() {
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

  const prompts = buildAssignmentActionPrompts(result?.model);
  if (!prompts.length) return null;
  return React.createElement("article", {
    className: "mcSection mcAssignmentActionPrompts",
    "data-testid": "coach-assignment-action-prompts",
    "data-prompt-count": String(prompts.length),
    "data-storage-mode": result?.storageMode || "unknown",
    "aria-labelledby": "mc-assignment-action-prompts-heading",
  },
  React.createElement("div", { className: "mcAssignmentActionPromptsHead" },
    React.createElement("span", null,
      React.createElement("small", null, "Coach decision support"),
      React.createElement("h2", { id: "mc-assignment-action-prompts-heading" }, "Next coaching reviews")),
    React.createElement("strong", { className: "mcAssignmentActionPromptsBadge" }, `${prompts.length} prompt${prompts.length === 1 ? "" : "s"}`)),
  React.createElement("div", { className: "mcAssignmentActionPromptsMeta" }, "Evidence-backed review prompts only. ShotLab does not automatically grade players or send assignments."),
  React.createElement("div", { className: "mcAssignmentActionPromptList" }, ...prompts.map((prompt) => React.createElement("section", {
    className: "mcAssignmentActionPrompt",
    key: prompt.id,
    "data-testid": "coach-assignment-action-prompt",
    "data-player-email": prompt.playerIdentity,
    "data-prompt-type": prompt.id.split(":").pop(),
  },
  React.createElement("span", null,
    React.createElement("strong", null, `${prompt.title} · ${prompt.playerName}`),
    React.createElement("p", null, prompt.detail),
    React.createElement("small", null, prompt.evidence)),
  React.createElement("button", {
    type: "button",
    onClick: () => openExactPlayerFollowUp({ email: prompt.playerIdentity, name: prompt.playerName }),
    "aria-label": `Review ${prompt.playerName}`,
  }, "Review player")))),
  React.createElement("em", null, result?.storageMode === "team_remote"
    ? "Uses server-synced completion evidence · private coach notes excluded"
    : "Uses local or demo completion evidence · verify context before acting"));
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

export function installCoachAssignmentActionPromptsEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachAssignmentActionPromptsEnhancer) return true;
  window.__shotlabCoachAssignmentActionPromptsEnhancer = true;
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
      host.className = "mcAssignmentActionPromptsHost";
      host.dataset.testid = HOST_TEST_ID;
      root = createRoot(host);
      root.render(React.createElement(CoachAssignmentActionPromptsPanel));
    }
    const effectivenessHost = target.querySelector('[data-testid="coach-assignment-effectiveness-host"]');
    if (effectivenessHost) {
      if (effectivenessHost.nextSibling !== host) target.insertBefore(host, effectivenessHost.nextSibling);
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
