import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadCoachCoreLoopPlayer, saveCoachCoreLoopAction } from "./coachFollowUpService.js";
import { loadPlayerAssignment, savePlayerAssignment } from "./playerAssignmentService.js";
import {
  COACH_FOLLOW_UP_CONTEXT_KEY,
  buildNextAssignmentSuggestion,
  buildCoachResponseContext,
  getCoachResponseContext,
  parseCoachResponseNote,
  serializeCoachResponseNote,
  setCoachResponseContext,
} from "./coachPlayerResponseLoop.js";
import { openExactPlayerFollowUp } from "./coachAssignmentOutcomeEnhancer.js";

import "./coachFollowUpEnhancer.css";
// Touch-target contract is defined in coachFollowUpEnhancer.css: min-height:44px

const HOST_TEST_ID = "coach-follow-up-ledger-host";
const CONTEXT_KEY = COACH_FOLLOW_UP_CONTEXT_KEY;

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

const LIVE_ROW_SELECTOR = '[data-testid="coach-live-activity"] .mcTimeline > div';

function liveResult(row) {
  const playerName = clean(row?.querySelector?.("strong")?.textContent);
  const detail = clean(row?.querySelector?.("small")?.textContent);
  const meta = clean(row?.querySelector?.("time")?.textContent);
  const actionable = Boolean(playerName && detail)
    && !/^(team|athletes? active|player activity)$/i.test(playerName)
    && /(home shots?|shooting|drill score|score|strength|s&c|makes?|logged|completed)/i.test(detail);
  return { actionable, playerName, detail, meta };
}

function wireLiveRows() {
  for (const row of document.querySelectorAll(LIVE_ROW_SELECTOR)) {
    const result = liveResult(row);
    if (!result.actionable) {
      row.removeAttribute("data-shotlab-response-row");
      row.removeAttribute("role");
      row.removeAttribute("tabindex");
      row.removeAttribute("aria-label");
      continue;
    }
    row.dataset.shotlabResponseRow = "true";
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-label", `Review ${result.playerName} result and record next assignment`);
  }
}

function openLiveRow(row) {
  const result = liveResult(row);
  if (!result.actionable) return false;
  setCoachResponseContext(buildCoachResponseContext({
    playerIdentity: result.playerName,
    playerName: result.playerName,
    detail: result.detail,
    meta: result.meta,
  }));
  return openExactPlayerFollowUp({ searchIdentity: result.playerName, name: result.playerName });
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
const deliveryLabel = (state) => state === "completed" ? "Player completed" : state === "started" ? "Player started" : state === "acknowledged" ? "Player acknowledged" : state === "assigned" ? "Delivered" : "Not delivered";
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
  const [delivery, setDelivery] = useState(null);
  const [assignment, setAssignment] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("Loading follow-up record…");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadCoachCoreLoopPlayer(context),
      loadPlayerAssignment(context),
    ]).then(([result, deliveryResult]) => {
      if (cancelled) return;
      const parsedNote = parseCoachResponseNote(result.record?.note || "");
      const confirmedDelivery = deliveryResult.ok ? deliveryResult.assignment || null : null;
      setRecord(result.record || null);
      setDelivery(confirmedDelivery);
      setAssignment(deliveryResult.assignment?.assignmentText || parsedNote.assignment || (responseContext ? buildNextAssignmentSuggestion(responseContext) : ""));
      setNote(parsedNote.privateNote);
      const followUpFailed = !result.ok && Boolean(result.error);
      const deliveryFailed = !deliveryResult.ok && Boolean(deliveryResult.error);
      setError(followUpFailed || deliveryFailed);
      if (deliveryFailed) {
        setStatus(deliveryResult.assignment
          ? "Player delivery could not be confirmed. The assignment is saved locally so you can retry when connected."
          : "Player delivery could not be refreshed. Retry when connected.");
      } else if (followUpFailed) {
        setStatus(result.record
          ? "A local follow-up record is available, but team sync could not be refreshed."
          : "Follow-up could not be refreshed. Close and reopen this player to retry.");
      } else {
        setStatus(confirmedDelivery
          ? `Player delivery status: ${deliveryLabel(confirmedDelivery.state)}.`
          : result.record
            ? "Existing follow-up record loaded."
            : responseContext
              ? "Result loaded. Confirm the next assignment before recording it."
              : "No follow-up has been recorded.");
      }
    }).catch(() => {
      if (cancelled) return;
      setError(true);
      setStatus("Follow-up could not be loaded. Close and reopen this player to retry.");
    });
    return () => { cancelled = true; };
  }, [context.teamId, context.playerIdentity, responseContext?.openedAt]);

  const save = async (nextState, { requireAssignment = false } = {}) => {
    if (requireAssignment && !clean(assignment)) {
      setError(true);
      setStatus("Add a next assignment before recording it.");
      return;
    }
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaving(true);
    setError(false);
    setStatus(requireAssignment ? "Saving private context and delivering assignment…" : "Saving…");
    try {
      const followUpPromise = saveCoachCoreLoopAction({
        ...context,
        state: nextState,
        note: serializeCoachResponseNote({ assignment, privateNote: note }),
      });
      const deliveryPromise = requireAssignment
        ? savePlayerAssignment({
            ...context,
            assignmentText: assignment,
            resultDetail: responseContext?.resultDetail || "",
          })
        : Promise.resolve(null);
      const [result, deliveryResult] = await Promise.all([followUpPromise, deliveryPromise]);
      setRecord(result.record || record);
      if (deliveryResult?.ok && deliveryResult.assignment) setDelivery(deliveryResult.assignment);
      const parsedNote = parseCoachResponseNote(result.record?.note ?? serializeCoachResponseNote({ assignment, privateNote: note }));
      setAssignment(deliveryResult?.assignment?.assignmentText || parsedNote.assignment);
      setNote(parsedNote.privateNote);
      const followUpOk = Boolean(result.ok);
      const deliveryOk = !requireAssignment || Boolean(deliveryResult?.ok);
      setError(!followUpOk || !deliveryOk);
      if (requireAssignment) {
        if (followUpOk && deliveryOk) {
          setStatus(deliveryResult.message || "Assignment delivered to the player.");
        } else if (deliveryOk) {
          setStatus("Assignment delivered, but private follow-up sync failed. Your private follow-up remains saved locally.");
        } else if (followUpOk) {
          setStatus("Private follow-up saved, but player delivery could not be confirmed. Retry when connected.");
        } else {
          setStatus("Saved locally, but team sync and player delivery could not be confirmed. Retry when connected.");
        }
      } else {
        setStatus(result.message || (result.ok ? "Follow-up record saved." : "Follow-up could not be synced. Retry when connected."));
      }
    } catch {
      setError(true);
      setStatus(requireAssignment
        ? "The assignment could not be confirmed. Your edits are still on screen; retry when connected."
        : "The follow-up could not be saved. Your edits are still on screen; try again.");
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
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
    delivery ? React.createElement("div", { className: "coachDeliveryStatus", "data-testid": "coach-player-assignment-status", "data-assignment-state": delivery.state },
      React.createElement("span", null, "Player delivery"),
      React.createElement("strong", null, deliveryLabel(delivery.state))) : null,
    React.createElement("p", { className: "coachFollowUpCopy" }, state === "completed"
      ? "You confirmed that this follow-up was completed outside ShotLab."
      : state === "planned"
        ? "This player is on your follow-up list. Keep the next assignment and private context together."
        : responseContext
          ? "Review the result, adjust the suggested next assignment, and record the decision before leaving the player."
          : "Create a private follow-up task for this player."),
    React.createElement("p", { className: "coachFollowUpWarning" }, "The player receives only the assignment text and result context. Private coach notes remain coach-only."),
    React.createElement("label", { className: "coachFollowUpField is-assignment" },
      React.createElement("span", null, "Next assignment to deliver"),
      React.createElement("textarea", { value: assignment, maxLength: 2000, placeholder: "Example: Repeat the form shooting block and match today’s makes with balanced footwork.", onChange: (event) => setAssignment(event.target.value), disabled: saving, "data-testid": "coach-next-assignment-input" })),
    React.createElement("button", { type: "button", className: "coachAssignmentSave", onClick: () => save("planned", { requireAssignment: true }), disabled: saving, "aria-busy": saving }, "Deliver next assignment"),
    React.createElement("label", { className: "coachFollowUpField" },
      React.createElement("span", null, "Private coach note"),
      React.createElement("textarea", { value: note, maxLength: 2000, placeholder: "Example: Check in after practice about completing the priority drill.", onChange: (event) => setNote(event.target.value), disabled: saving })),
    React.createElement("div", { className: "coachFollowUpActions" },
      React.createElement("button", { type: "button", onClick: () => save(primaryState), disabled: saving, "aria-busy": saving }, primaryLabel),
      React.createElement("button", { type: "button", onClick: () => save("dismissed"), disabled: saving || !state, "aria-busy": saving }, "Clear record")),
    React.createElement("div", { className: `coachFollowUpStatus ${error ? "is-error" : ""}`, role: "status" }, status),
    record?.updatedAt ? React.createElement("div", { className: "coachFollowUpMeta" }, `Updated ${formatDate(record.updatedAt)}${record.updatedBy ? ` · ${record.updatedBy}` : ""}`) : null,
  );
}

export function installCoachFollowUpEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachFollowUpEnhancer) return true;
  window.__shotlabCoachFollowUpEnhancer = true;
  document.addEventListener("click", (event) => {
    const liveRow = event.target?.closest?.(`${LIVE_ROW_SELECTOR}[data-shotlab-response-row="true"]`);
    if (liveRow) { openLiveRow(liveRow); return; }
    const row = event.target?.closest?.(".mcAssignmentOutcomeRow[data-player-email]");
    if (row) window[CONTEXT_KEY] = {
      playerIdentity: clean(row.getAttribute("data-player-email")),
      playerName: clean(row.querySelector("strong")?.textContent),
    };
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target?.closest?.(`${LIVE_ROW_SELECTOR}[data-shotlab-response-row="true"]`);
    if (!row) return;
    event.preventDefault();
    openLiveRow(row);
  }, true);

  let host = null;
  let root = null;
  let drawer = null;
  let mountedKey = "";
  let frame = null;

  const reconcile = () => {
    frame = null;
    wireLiveRows();
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
    const body = dialog.querySelector('[data-visual-role="dashboard-section"]')?.parentElement;
    if (!body || body === dialog) return;
    host = document.createElement("div");
    host.dataset.testid = HOST_TEST_ID;
    body.appendChild(host);
    root = createRoot(host);
    root.render(React.createElement(CoachFollowUpPanel, { context }));
  };

  const schedule = () => {
    if (frame != null) return;
    frame = window.requestAnimationFrame(reconcile);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.addEventListener("storage", schedule);
  window.addEventListener("focus", schedule);
  schedule();
  return true;
}
