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

export function TeamBrandingProvider({ branding, children }) {
  const safeBranding = useMemo(() => resolveTeamBranding(branding || DEFAULT_BRANDING), [branding]);
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
