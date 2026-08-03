import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { COACH_ASSIGN_NEXT_OPEN_EVENT } from "./coachAssignNextEnhancer.js";
import { listPlayerAssignmentsLocal, PLAYER_ASSIGNMENT_CHANGE_EVENT } from "./playerAssignmentService.js";

const STYLE_ID = "shotlab-coach-assign-next-ready-styles";
const HOST_TEST_ID = "coach-assign-next-ready-host";
const clean = (value, max = 4000) => String(value ?? "").trim().slice(0, max);
const parse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };

const styles = `
.mcAssignNextReady{margin-top:12px;padding:12px;border:1px solid color-mix(in srgb,var(--mc,#c8ff1a) 18%,rgba(255,255,255,.07));border-radius:14px;background:color-mix(in srgb,var(--mc,#c8ff1a) 4%,rgba(255,255,255,.012))}
.mcAssignNextReadyHead{display:flex;align-items:center;justify-content:space-between;gap:12px}.mcAssignNextReadyHead span,.mcAssignNextReadyHead strong,.mcAssignNextReadyButton small{font-family:'Barlow Condensed','Arial Narrow',sans-serif;text-transform:uppercase;letter-spacing:.08em}.mcAssignNextReadyHead span{color:var(--text-2,#aab3b8);font-size:9px;font-weight:800}.mcAssignNextReadyHead strong{color:var(--mc,#c8ff1a);font-size:9px;font-weight:900}.mcAssignNextReadyList{display:grid;gap:7px;margin-top:9px}.mcAssignNextReadyButton{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;min-height:48px;padding:9px 10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.018);color:inherit;text-align:left;cursor:pointer}.mcAssignNextReadyButton:hover,.mcAssignNextReadyButton:focus-visible{border-color:color-mix(in srgb,var(--mc,#c8ff1a) 34%,rgba(255,255,255,.08));outline:none}.mcAssignNextReadyButton strong{display:block;color:var(--text-1,#f4f7f8);font:800 12px/1.2 'Barlow Condensed','Arial Narrow',sans-serif}.mcAssignNextReadyButton small{display:block;margin-top:3px;color:var(--text-3,#7d898f);font-size:8px;font-weight:700}.mcAssignNextReadyButton em{color:var(--mc,#c8ff1a);font:900 10px/1 'Barlow Condensed','Arial Narrow',sans-serif;font-style:normal;text-transform:uppercase;white-space:nowrap}@media(max-width:420px){.mcAssignNextReadyButton{grid-template-columns:1fr}.mcAssignNextReadyButton em{margin-top:2px}}
`;

function teamIdFromSession() {
  const raw = parse(globalThis?.localStorage?.getItem?.("sl:session"), {});
  const session = Array.isArray(raw) ? raw[0] || {} : raw;
  return clean(session?.teamId || session?.team_id, 180);
}

function ReadyPanel() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const load = () => {
      const teamId = teamIdFromSession();
      setRows(listPlayerAssignmentsLocal({ teamId }).filter((row) => row.state === "completed").slice(0, 6));
    };
    load();
    window.addEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener(PLAYER_ASSIGNMENT_CHANGE_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, []);
  if (!rows.length) return null;
  return React.createElement("section", { className: "mcAssignNextReady", "data-testid": "coach-assign-next-ready", "data-ready-count": String(rows.length), "aria-label": "Players ready for next assignment" },
    React.createElement("div", { className: "mcAssignNextReadyHead" }, React.createElement("span", null, "Ready for next assignment"), React.createElement("strong", null, String(rows.length))),
    React.createElement("div", { className: "mcAssignNextReadyList" }, ...rows.map((row) => React.createElement("button", {
      type: "button",
      className: "mcAssignNextReadyButton",
      key: `${row.teamId}:${row.playerIdentity}`,
      "data-testid": "coach-assign-next-ready-player",
      "data-player-email": row.playerIdentity,
      onClick: () => window.dispatchEvent(new CustomEvent(COACH_ASSIGN_NEXT_OPEN_EVENT, { detail: {
        teamId: row.teamId,
        playerIdentity: row.playerIdentity,
        playerName: row.playerName,
        assignmentText: row.assignmentText,
      } })),
      "aria-label": `Assign the next coach assignment to ${row.playerName || row.playerIdentity}`,
    }, React.createElement("span", null, React.createElement("strong", null, row.playerName || row.playerIdentity), React.createElement("small", null, "Completed · ready for the next decision")), React.createElement("em", null, "Assign next ›")))));
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}

export function installCoachAssignNextReadyEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.__shotlabCoachAssignNextReadyEnhancer) return true;
  window.__shotlabCoachAssignNextReadyEnhancer = true;
  ensureStyles();

  let host = null;
  let root = null;
  let frame = null;
  const reconcile = () => {
    frame = null;
    const panel = document.querySelector('[data-testid="coach-assignment-accountability"]');
    if (!panel) {
      root?.unmount?.();
      host?.remove?.();
      root = null;
      host = null;
      return;
    }
    if (host?.isConnected) return;
    host = document.createElement("div");
    host.dataset.testid = HOST_TEST_ID;
    const completedDetails = panel.querySelector(".mcAssignmentAccountabilityHistory");
    if (completedDetails) panel.insertBefore(host, completedDetails);
    else panel.appendChild(host);
    root = createRoot(host);
    root.render(React.createElement(ReadyPanel));
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
