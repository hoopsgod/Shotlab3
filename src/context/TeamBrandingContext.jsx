import { createContext, useContext, useEffect, useMemo, useState } from "react";
import DEFAULT_BRANDING from "../theme/brandingDefaults";
import buildThemeTokens from "../theme/buildThemeTokens";
import applyThemeVariables from "../theme/applyThemeVariables";
import resolveTeamBranding from "../theme/resolveTeamBranding";

const defaultTheme = buildThemeTokens(DEFAULT_BRANDING);
const STORAGE_SESSION = "sl:session";
const STORAGE_PLAYERS = "sl:players";
const STORAGE_TEAMS = "sl:teams";

const TeamBrandingContext = createContext({
  branding: DEFAULT_BRANDING,
  theme: defaultTheme,
  tokens: defaultTheme,
});

function parseStored(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function inferPersistedTeamName() {
  if (typeof window === "undefined") return "";
  try {
    const session = parseStored(window.localStorage?.getItem(STORAGE_SESSION), null);
    const players = parseStored(window.localStorage?.getItem(STORAGE_PLAYERS), []);
    const teams = parseStored(window.localStorage?.getItem(STORAGE_TEAMS), []);
    const email = String(session?.email || "").trim().toLowerCase();
    const player = (Array.isArray(players) ? players : []).find((row) => String(row?.email || "").trim().toLowerCase() === email);
    const teamId = String(session?.teamId || session?.team_id || player?.teamId || player?.team_id || "");
    if (!teamId) return "";
    const team = (Array.isArray(teams) ? teams : []).find((row) => String(row?.id || "") === teamId);
    return String(team?.name || team?.teamName || "").trim();
  } catch {
    return "";
  }
}

export function TeamBrandingProvider({ branding, children }) {
  const [persistedTeamName, setPersistedTeamName] = useState(() => inferPersistedTeamName());

  useEffect(() => {
    const refresh = () => setPersistedTeamName(inferPersistedTeamName());
    refresh();
    window.addEventListener?.("storage", refresh);
    return () => window.removeEventListener?.("storage", refresh);
  }, [branding]);

  const safeBranding = useMemo(() => {
    const supplied = branding || DEFAULT_BRANDING;
    const teamName = String(supplied?.teamName || supplied?.name || persistedTeamName || "").trim();
    return resolveTeamBranding(teamName ? { ...supplied, teamName } : supplied);
  }, [branding, persistedTeamName]);
  const theme = useMemo(() => buildThemeTokens(safeBranding), [safeBranding]);

  useEffect(() => applyThemeVariables(theme.cssVariables), [theme]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const previousScale = root.getAttribute("data-text-scale");
    const nextScale = safeBranding?.textScale || DEFAULT_BRANDING.textScale;

    if (nextScale && nextScale !== DEFAULT_BRANDING.textScale) {
      root.setAttribute("data-text-scale", nextScale);
    } else {
      root.removeAttribute("data-text-scale");
    }

    return () => {
      if (previousScale) {
        root.setAttribute("data-text-scale", previousScale);
      } else {
        root.removeAttribute("data-text-scale");
      }
    };
  }, [safeBranding?.textScale]);

  const value = useMemo(
    () => ({ branding: safeBranding, theme, tokens: theme }),
    [safeBranding, theme]
  );

  return <TeamBrandingContext.Provider value={value}>{children}</TeamBrandingContext.Provider>;
}

export function useTeamBranding() {
  return useContext(TeamBrandingContext);
}
