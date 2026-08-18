import { createContext, useContext, useEffect, useMemo } from "react";
import DEFAULT_BRANDING from "../theme/brandingDefaults";
import buildThemeTokens from "../theme/buildThemeTokens";
import applyThemeVariables from "../theme/applyThemeVariables";
import resolveTeamBranding from "../theme/resolveTeamBranding";

const defaultTheme = buildThemeTokens(DEFAULT_BRANDING);

const isCustomLogoUrl = (url) => Boolean(
  url
  && url !== DEFAULT_BRANDING.logoUrl
  && url !== DEFAULT_BRANDING.logoMarkUrl
);

const TeamBrandingContext = createContext({
  branding: DEFAULT_BRANDING,
  theme: defaultTheme,
  tokens: defaultTheme,
  hasCustomLogo: false,
});

export function TeamBrandingProvider({ branding, children }) {
  const safeBranding = useMemo(() => resolveTeamBranding(branding || DEFAULT_BRANDING), [branding]);
  const theme = useMemo(() => buildThemeTokens(safeBranding), [safeBranding]);
  const hasCustomLogo = useMemo(
    () => [safeBranding?.logoUrl, safeBranding?.logoMarkUrl].some(isCustomLogoUrl),
    [safeBranding?.logoUrl, safeBranding?.logoMarkUrl]
  );

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
    () => ({ branding: safeBranding, theme, tokens: theme, hasCustomLogo }),
    [safeBranding, theme, hasCustomLogo]
  );

  return <TeamBrandingContext.Provider value={value}>{children}</TeamBrandingContext.Provider>;
}

export function useTeamBranding() {
  return useContext(TeamBrandingContext);
}
