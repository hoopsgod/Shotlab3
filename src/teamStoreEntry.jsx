import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import AppFeedbackLayer from "./components/AppFeedbackLayer.jsx";
import TeamStoreFeedbackBridge from "./components/TeamStoreFeedbackBridge.jsx";
import TeamStorePortal from "./components/TeamStorePortal.jsx";
import { TeamBrandingProvider } from "./context/TeamBrandingContext.jsx";
import "./components/TeamStoreIndustrial.css";
import "./components/TeamStoreIdentityTitle.css";

const parseStored = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

async function storageGet(key, fallback) {
  try {
    if (window.storage?.get) {
      const result = await window.storage.get(key);
      return parseStored(result?.value ?? result, fallback);
    }
    return parseStored(window.localStorage?.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function TeamStoreBrandedRoot() {
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const hydrateBranding = async () => {
      const [session, players, teams] = await Promise.all([
        storageGet("sl:session", null),
        storageGet("sl:players", []),
        storageGet("sl:teams", []),
      ]);
      if (cancelled) return;
      const email = String(session?.email || "").trim().toLowerCase();
      const player = (Array.isArray(players) ? players : []).find((row) => String(row?.email || "").trim().toLowerCase() === email);
      const team = (Array.isArray(teams) ? teams : []).find((row) => String(row?.id || "") === String(player?.teamId || ""));
      if (!team) return;
      setBranding({
        ...(team?.branding || {}),
        teamName: String(team?.name || team?.teamName || team?.branding?.teamName || "Your Team"),
      });
    };

    hydrateBranding();
    const interval = window.setInterval(hydrateBranding, 2500);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  const portal = <TeamStorePortal />;
  return branding ? <TeamBrandingProvider branding={branding}>{portal}</TeamBrandingProvider> : portal;
}

const mount = document.getElementById("team-store-root");
const primaryAppMount = document.getElementById("root");
if (mount) {
  ReactDOM.createRoot(mount).render(
    <React.StrictMode>
      {primaryAppMount ? null : <AppFeedbackLayer />}
      <TeamStoreFeedbackBridge />
      <TeamStoreBrandedRoot />
    </React.StrictMode>,
  );
}
