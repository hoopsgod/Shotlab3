import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadCoachFollowUp, saveCoachFollowUp } from "./coachFollowUpService.js";
import {
  COACH_FOLLOW_UP_CONTEXT_KEY,
  buildNextAssignmentSuggestion,
  getCoachResponseContext,
  parseCoachResponseNote,
  serializeCoachResponseNote,
} from "./coachPlayerResponseLoop.js";

const STYLE_ID = "shotlab-coach-follow-up-styles";
const HOST_TEST_ID = "coach-follow-up-ledger-host";
const CONTEXT_KEY = COACH_FOLLOW_UP_CONTEXT_KEY;

const styles = `
.coachFollowUpLedger{margin:16px 0 0;padding:16px;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015));color:#f4f7f8}
.coachFollowUpHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.coachFollowUpEyebrow{font:800 9px/1.1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7d898f}.coachFollowUpTitle{margin:5px 0 0;font:400 22px/1 'Bebas Neue',Impact,sans-serif;letter-spacing:.035em}.coachFollowUpBadge{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border:1px solid rgba(255,181,71,.38);border-radius:999px;background:rgba(255,181,71,.09);color:#ffca76;font:900 9px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.1em;text-transform:uppercase}.coachFollowUpBadge.is-completed{border-color:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 38%,transparent);background:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 9%,transparent);color:var(--team-brand-primary,#c8ff1a)}
.coachResponseEvidence{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;margin-top:12px;padding:12px;border:1px solid color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 24%,rgba(255,255,255,.08));border-radius:13px;background:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 6%,rgba(255,255,255,.016))}.coachResponseEvidence small{display:block;color:#7d898f;font:800 8px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.11em;text-transform:uppercase}.coachResponseEvidence strong{display:block;margin-top:5px;color:#f4f7f8;font:800 13px/1.25 'Barlow Condensed','Arial Narrow',sans-serif}.coachResponseEvidence time{color:var(--team-brand-primary,#c8ff1a);font:900 9px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase;white-space:nowrap}
.coachFollowUpCopy{margin:10px 0 0;color:#aab3b8;font:600 12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.coachFollowUpWarning{margin:8px 0 0;color:#7d898f;font:600 10px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.coachFollowUpField{display:grid;gap:7px;margin-top:13px}.coachFollowUpField span{font:800 9px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.09em;text-transform:uppercase;color:#8d989d}.coachFollowUpField textarea{width:100%;min-height:84px;resize:vertical;padding:11px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0d1113;color:#f4f7f8;font:600 13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-sizing:border-box}.coachFollowUpField textarea:focus{outline:2px solid color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 65%,white);outline-offset:2px}.coachFollowUpField.is-assignment textarea{min-height:96px;border-color:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 22%,rgba(255,255,255,.12))}.coachAssignmentSave{min-height:44px;margin-top:9px;padding:0 13px;border:1px solid color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 42%,transparent);border-radius:11px;background:var(--team-brand-primary,#c8ff1a);color:#080a08;font:900 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.coachAssignmentSave:disabled{opacity:.55;cursor:wait}
.coachFollowUpActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.coachFollowUpActions button{min-height:44px;padding:0 12px;border-radius:11px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.045);color:#f4f7f8;font:900 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.07em;text-transform:uppercase;cursor:pointer}.coachFollowUpActions button:first-child{border-color:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 40%,transparent);background:color-mix(in srgb,var(--team-brand-primary,#c8ff1a) 10%,rgba(255,255,255,.02));color:var(--team-brand-primary,#c8ff1a)}.coachFollowUpActions button:disabled{opacity:.55;cursor:wait}.coachFollowUpStatus{min-height:18px;margin-top:9px;color:#9aa5aa;font:600 10px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.coachFollowUpStatus.is-error{color:#ff9b9b}.coachFollowUpMeta{margin-top:7px;color:#6f7b80;font:700 9px/1.35 'Barlow Condensed','Arial Narrow',sans-serif;letter-spacing:.06em;text-transform:uppercase}
@media(max-width:420px){.coachFollowUpActions{grid-template-columns:1fr}.coachFollowUpTitle{font-size:20px}.coachResponseEvidence{grid-template-columns:1fr}.coachResponseEvidence time{white-space:normal}}
@media(prefers-reduced-motion:reduce){.coachFollowUpActions button,.coachAssignmentSave{transition:none}}
`;

const clean = (value) => String(value ?? "").trim();
const normalize = (value) => clean(value).toLowerCase();
const parse = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};

function resolveContext(playerIdentity = "", playerName = "") {
  const storage = globalThis?.localStorage;
  const players = parse(storage?.getItem?.("sl:players"), []);
  const sessionRaw = parse(storage?.getItem?.("sl:session"), {});
  const session = Array.isArray(sessionRaw) ? sessionRaw[0] : sessionRaw;
  const requester = normalize(session?.email || session?.userEmail || session?.user_id);
  const actor = (Array.isArray(players) ? players : []).find((player) => normalize(player?.email) === requester);
  const targetIdentity = normalize(playerIdentity);
  const targetName = normalize(playerName);
  const target = (Array.isArray(players) ? players : []).find((player) => (
    targetIdentity && [player?.email, player?.player_email, player?.playerId, player?.player_id, player?.id].map(normalize).includes(targetIdentity)
  )) || (Array.isArray(players) ? players : []).filter((player) => normalize(player?.name || player?.displayName) === targetName).at(0);
  const targetIdentities = [target?.email, target?.player_email, target?.playerId, target?.player_id, target?.id].map(normalize).filter(Boolean);
  const canonicalTargetIdentity = targetIdentities[0] || targetIdentity;
  return {
    teamId: clean(target?.teamId || target?.team_id || session?.teamId || session?.team_id || actor?.teamId || actor?.team_id),
    playerIdentity: targetIdentities.includes(targetIdentity) ? targetIdentity : canonicalTargetIdentity,
    playerName: clean(playerName || target?.name || target?.displayName || target?.email || "Player"),
  };
}

function inferContextFromDrawer(drawer) {
  const explicit = globalThis?.[CONTEXT_KEY];
  if (explicit?.playerIdentity) return resolveContext(explicit.playerIdentity, explicit.playerName);
  const searchValue = clean(document.querySelector('[data-testid="coach-players-filter-rail"] input[type="search"]')?.value);
  const playerName = clean(drawer?.querySelector?.('[role="dialog"]')?.getAttribute?.("aria-label"));
  return resolveContext(searchValue, playerName);
}

function neutralizeLegacyNudges() {
  const buttons = document.querySelectorAll('#coach-roster-operations button');
  for (const button of buttons) {
    const label = clean(button.textContent).replace(/^✓\s*/, "").toUpperCase();
    if (label !== "NUDGE") continue;
    button.hidden = true;
    button.disabled = true;
    button.dataset.shotlabLegacyNudgeRetired = "true";
    button.setAttribute("aria-hidden", "true");
  }
}

const stateLabel = (state) => state === "completed" ? "Completed" : state === "planned" ? "Planned" : "Not recorded";
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

function CoachFollowUpPanel({ context }) {
  const responseContext = useMemo(() => getCoachResponseContext({
    playerIdentity: context.playerIdentity,
    playerName: context.playerName,
  }), [context.playerIdentity, context.playerName]);
  const [record, setRecord] = useState(null);
  const [assignment, setAssignment] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("Loading follow-up record…");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCoachFollowUp(context).then((result) => {
      if (cancelled) return;
      const parsedNote = parseCoachResponseNote(result.record?.note || "");
      setRecord(result.record || null);
      setAssignment(parsedNote.assignment || (responseContext ? buildNextAssignmentSuggestion(responseContext) : ""));
      setNote(parsedNote.privateNote);
      setError(!result.ok && Boolean(result.error));
      setStatus(result.record ? "Existing follow-up record loaded." : responseContext ? "Result loaded. Confirm the next assignment before recording it." : "No follow-up has been recorded.");
    });
    return () => { cancelled = true; };
  }, [context.teamId, context.playerIdentity, responseContext?.openedAt]);

  const save = async (nextState, { requireAssignment = false } = {}) => {
    if (requireAssignment && !clean(assignment)) {
      setError(true);
      setStatus("Add a next assignment before recording it.");
      return;
    }
    setSaving(true);
    setError(false);
    setStatus("Saving…");
    const result = await saveCoachFollowUp({
      ...context,
      state: nextState,
      note: serializeCoachResponseNote({ assignment, privateNote: note }),
    });
    setSaving(false);
    setRecord(result.record || record);
    const parsedNote = parseCoachResponseNote(result.record?.note ?? serializeCoachResponseNote({ assignment, privateNote: note }));
    setAssignment(parsedNote.assignment);
    setNote(parsedNote.privateNote);
    setError(!result.ok);
    setStatus(result.message || (result.ok ? "Follow-up record saved." : "Follow-up could not be synced."));
  };

  const state = record?.state === "dismissed" ? "" : record?.state || "";
  const primaryState = state === "planned" ? "completed" : "planned";
  const primaryLabel = state === "planned" ? "Mark follow-up complete" : state === "completed" ? "Reopen follow-up" : "Mark for follow-up";

  return React.createElement(
    "section",
    { className: "coachFollowUpLedger", "data-testid": "coach-follow-up-ledger", "data-follow-up-state": state || "none", "aria-label": `Coach follow-up for ${context.playerName}` },
    React.createElement("div", { className: "coachFollowUpHead" },
      React.createElement("span", null,
        React.createElement("div", { className: "coachFollowUpEyebrow" }, responseContext ? "Live result response" : "Coach workflow"),
        React.createElement("h2", { className: "coachFollowUpTitle" }, responseContext ? "Set the next action" : "Follow-up record")),
      React.createElement("strong", { className: `coachFollowUpBadge ${state === "completed" ? "is-completed" : ""}` }, stateLabel(state))),
    responseContext ? React.createElement("div", { className: "coachResponseEvidence", "data-testid": "coach-result-response-context" },
      React.createElement("span", null,
        React.createElement("small", null, "Latest player result"),
        React.createElement("strong", null, responseContext.resultDetail || "Training result recorded")),
      React.createElement("time", null, responseContext.resultMeta || "Recent")) : null,
    React.createElement("p", { className: "coachFollowUpCopy" }, state === "completed"
      ? "You confirmed that this follow-up was completed outside ShotLab."
      : state === "planned"
        ? "This player is on your follow-up list. Keep the next assignment and private context together."
        : responseContext
          ? "Review the result, adjust the suggested next assignment, and record the decision before leaving the player."
          : "Create a private follow-up task for this player."),
    React.createElement("p", { className: "coachFollowUpWarning" }, "ShotLab does not send a message or notify the player when this record changes."),
    React.createElement("label", { className: "coachFollowUpField is-assignment" },
      React.createElement("span", null, "Next assignment to deliver"),
      React.createElement("textarea", { value: assignment, maxLength: 2000, placeholder: "Example: Repeat the form shooting block and match today’s makes with balanced footwork.", onChange: (event) => setAssignment(event.target.value), disabled: saving, "data-testid": "coach-next-assignment-input" })),
    React.createElement("button", { type: "button", className: "coachAssignmentSave", onClick: () => save("planned", { requireAssignment: true }), disabled: saving }, "Record next assignment"),
    React.createElement("label", { className: "coachFollowUpField" },
      React.createElement("span", null, "Private coach note"),
      React.createElement("textarea", { value: note, maxLength: 2000, placeholder: "Example: Check in after practice about completing the priority drill.", onChange: (event) => setNote(event.target.value), disabled: saving })),
    React.createElement("div", { className: "coachFollowUpActions" },
      React.createElement("button", { type: "button", onClick: () => save(primaryState), disabled: saving }, primaryLabel),
      React.createElement("button", { type: "button", onClick: () => save("dismissed"), disabled: saving || !state }, "Clear record")),
    React.createElement("div", { className: `coachFollowUpStatus ${error ? "is-error" : ""}`, role: "status" }, status),
    record?.updatedAt ? React.createElement("div", { className: "coachFollowUpMeta" }, `Updated ${formatDate(record.updatedAt)}${record.updatedBy ? ` · ${record.updatedBy}` : ""}`) : null,
  );
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

export function installCoachFollowUpEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachFollowUpEnhancer) return true;
  window.__shotlabCoachFollowUpEnhancer = true;
  ensureStyles();

  document.addEventListener("click", (event) => {
    const row = event.target?.closest?.(".mcAssignmentOutcomeRow[data-player-email]");
    if (!row) return;
    window[CONTEXT_KEY] = {
      playerIdentity: clean(row.getAttribute("data-player-email")),
      playerName: clean(row.querySelector("strong")?.textContent),
    };
  }, true);

  let host = null;
  let root = null;
  let drawer = null;
  let mountedKey = "";
  let frame = null;

  const reconcile = () => {
    frame = null;
    neutralizeLegacyNudges();
    const nextDrawer = document.querySelector('[data-testid="coach-player-intelligence-drawer"]');
    if (!nextDrawer) {
      root?.unmount?.();
      host?.remove?.();
      host = null;
      root = null;
      drawer = null;
      mountedKey = "";
      return;
    }
    const context = inferContextFromDrawer(nextDrawer);
    const nextKey = `${context.teamId}::${context.playerIdentity}`;
    if (!context.teamId || !context.playerIdentity) return;
    if (nextDrawer === drawer && host?.isConnected && nextKey === mountedKey) return;

    root?.unmount?.();
    host?.remove?.();
    drawer = nextDrawer;
    mountedKey = nextKey;
    const dialog = drawer.querySelector('[role="dialog"]');
    if (!dialog) return;
    host = document.createElement("div");
    host.dataset.testid = HOST_TEST_ID;
    dialog.appendChild(host);
    root = createRoot(host);
    root.render(React.createElement(CoachFollowUpPanel, { context }));
  };

  const schedule = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(reconcile);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("storage", schedule);
  schedule();
  return true;
}
