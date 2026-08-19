import { createContext, useContext, useEffect, useMemo } from "react";
import DEFAULT_BRANDING from "../theme/brandingDefaults";
import buildThemeTokens from "../theme/buildThemeTokens";
import applyThemeVariables from "../theme/applyThemeVariables";
import resolveTeamBranding from "../theme/resolveTeamBranding";

const defaultTheme = buildThemeTokens(DEFAULT_BRANDING);

const TeamBrandingContext = createContext({
  branding: DEFAULT_BRANDING,
  theme: defaultTheme,
  tokens: defaultTheme,
});

function readActiveStoredTeamName() {
  if (typeof window === "undefined") return "";
  try {
    const parse = (raw, fallback) => {
      try { return raw ? JSON.parse(raw) : fallback; }
      catch { return fallback; }
    };
    const tabSession = parse(window.sessionStorage?.getItem("sl:session"), null);
    const localSession = parse(window.localStorage?.getItem("sl:session"), null);
    const session = tabSession || localSession;
    const teams = parse(window.localStorage?.getItem("sl:teams"), []);
    const activeTeamId = String(session?.teamId || session?.team_id || "");
    if (!activeTeamId || !Array.isArray(teams)) return "";
    const activeTeam = teams.find((team) => String(team?.id || "") === activeTeamId);
    return String(activeTeam?.branding?.teamName || activeTeam?.name || "").trim();
  } catch {
    return "";
  }
}

export function TeamBrandingProvider({ branding, children }) {
  const safeBranding = useMemo(() => {
    const resolved = resolveTeamBranding(branding || DEFAULT_BRANDING);
    const storedTeamName = readActiveStoredTeamName();
    const resolvedTeamName = String(resolved?.teamName || "").trim();
    const defaultTeamName = String(DEFAULT_BRANDING?.teamName || "").trim();
    if (!storedTeamName || (resolvedTeamName && resolvedTeamName !== defaultTeamName)) return resolved;
    return { ...resolved, teamName: storedTeamName };
  }, [branding]);
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
