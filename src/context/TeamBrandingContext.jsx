import { createContext, useContext, useEffect, useMemo } from "react";
import BRANDING_DEFAULTS from "../theme/brandingDefaults";
import buildThemeTokens from "../theme/buildThemeTokens";
import applyThemeVariables from "../theme/applyThemeVariables";

const TeamBrandingContext = createContext({
  branding: BRANDING_DEFAULTS,
  tokens: buildThemeTokens(BRANDING_DEFAULTS),
});

export function TeamBrandingProvider({ branding, children }) {
  const safeBranding = branding || BRANDING_DEFAULTS;
  const tokens = useMemo(() => buildThemeTokens(safeBranding), [safeBranding]);

  useEffect(() => applyThemeVariables(tokens.cssVariables), [tokens]);

  const value = useMemo(() => ({ branding: safeBranding, tokens }), [safeBranding, tokens]);

  return <TeamBrandingContext.Provider value={value}>{children}</TeamBrandingContext.Provider>;
}

export function useTeamBranding() {
  return useContext(TeamBrandingContext);
}
