import React, { useEffect, useMemo, useRef, useState } from "react";
import "./CoachMissionControlInteractions.css";
import "./CoachMissionControlShell.css";
import "./CoachMissionControlFinal.css";
import "./CoachMissionControlTitleStage.css";
import "./CoachActivationPath.css";
import "./CoachTeamMonogramFallback.css";
import "./CoachPriorityOverlay.css";
import { useTeamBranding } from "../context/TeamBrandingContext";
import { deriveCoachActivationPath } from "../lib/coachActivationPath.js";
import { buildCoachInboxModel } from "../lib/coachInbox.js";
import { getRemoteActiveNamesToday, loadCoachCrossDeviceActivity, mergeCoachActivityItems } from "../lib/coachCrossDeviceActivity.js";
import { isDemoPersistenceSession } from "../lib/demoMode.js";
import useCleanTeamLogo from "./useCleanTeamLogo";

const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";
const initials = (value = "") => String(value).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL";
const normalizedName = (value = "") => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
const isDefaultTitansLogo = (value = "") => [
  FALLBACK_LOGO,
  "/branding/titans-default-mark.svg",
  "/branding/titans-default-mark-free.svg",
].some((candidate) => String(value).includes(candidate));

function Icon({ name, size = 22 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></>,
    pulse: <><path d="M3 12h4l2-5 4 10 2-5h6"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    chevron: <><path d="m9 18 6-6-6-6"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.22.8V21h-4v-.09a1.65 1.65 0 0 0-1.08-1.55 1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-.8-.22H3v-4h.09a1.65 1.65 0 0 0 1.55-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .22-.8V3h4v.09a1.65 1.65 0 0 0 1.08 1.55 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.15.36.35.69.6 1 .22.27.5.49.8.62.26.11.54.17.82.18H21v4h-.09a1.65 1.65 0 0 0-1.51.2z"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></>,
    target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></>,
    activity: <><path d="M3 12h4l2-5 4 10 2-5h6"/></>,
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}
