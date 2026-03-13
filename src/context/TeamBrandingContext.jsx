import { createContext, useContext, useEffect, useMemo } from "react";
import { buildThemeTokens } from "../theme/buildThemeTokens";
import { brandingDefaults } from "../theme/brandingDefaults";

const TeamBrandingContext = createContext({
  branding: brandingDefaults,
  tokens: {},
});

export function TeamBrandingProvider({ branding, children }) {
  const value = useMemo(() => {
    const built = buildThemeTokens(branding);
    return { branding: built.branding, tokens: built.cssVars };
  }, [branding]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(value.tokens).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
  }, [value.tokens]);

  return <TeamBrandingContext.Provider value={value}>{children}</TeamBrandingContext.Provider>;
}

export function useTeamBranding() {
  return useContext(TeamBrandingContext);
}
