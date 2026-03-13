import { createContext, useContext, useEffect, useMemo } from "react";
import DEFAULT_BRANDING from "../theme/brandingDefaults";
import buildThemeTokens from "../theme/buildThemeTokens";
import applyThemeVariables from "../theme/applyThemeVariables";

const defaultTheme = buildThemeTokens(DEFAULT_BRANDING);

const TeamBrandingContext = createContext({
  branding: DEFAULT_BRANDING,
  theme: defaultTheme,
  tokens: defaultTheme,
});

export function TeamBrandingProvider({ branding, children }) {
  const safeBranding = useMemo(() => ({ ...DEFAULT_BRANDING, ...(branding || {}) }), [branding]);
  const theme = useMemo(() => buildThemeTokens(safeBranding), [safeBranding]);

  useEffect(() => applyThemeVariables(theme.cssVariables), [theme]);

  const value = useMemo(
    () => ({ branding: safeBranding, theme, tokens: theme }),
    [safeBranding, theme]
  );

  return <TeamBrandingContext.Provider value={value}>{children}</TeamBrandingContext.Provider>;
}

export function useTeamBranding() {
  return useContext(TeamBrandingContext);
}
