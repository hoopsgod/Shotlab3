import React, { createContext, useContext, useEffect, useMemo } from "react";
import DEFAULT_BRANDING from "../theme/brandingDefaults";
import buildThemeTokens from "../theme/buildThemeTokens";
import applyThemeVariables from "../theme/applyThemeVariables";
import resolveTeamBranding from "../theme/resolveTeamBranding";

export interface TeamBranding {
  name?: string;
  shortName?: string;
  wordmark?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textOnPrimary?: string;
  logoUrl?: string;
  logoMarkUrl?: string;
  textScale?: "standard" | "large" | "xl";
  updatedAt?: number | null;
  updatedBy?: string | null;
  version?: number;
}

interface TeamBrandingContextValue {
  branding: TeamBranding;
  theme: ReturnType<typeof buildThemeTokens>;
  teamName: string;
  teamWordmark: string;
  tokens: {
    primary: string;
    primarySoft: string;
    surface: string;
    text: string;
    muted: string;
  };
}

const defaultTheme = buildThemeTokens(DEFAULT_BRANDING);

const defaultValue: TeamBrandingContextValue = {
  branding: resolveTeamBranding(DEFAULT_BRANDING),
  theme: defaultTheme,
  teamName: "ShotLab",
  teamWordmark: "ShotLab",
  tokens: {
    primary: defaultTheme.colors.primary,
    primarySoft: defaultTheme.colors.primarySoft,
    surface: "var(--surface-2)",
    text: "var(--text-1)",
    muted: "var(--text-2)",
  },
};

const TeamBrandingContext = createContext<TeamBrandingContextValue>(defaultValue);

export function TeamBrandingProvider({ branding, children }: { branding?: TeamBranding; children: React.ReactNode }) {
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

  const value = useMemo<TeamBrandingContextValue>(() => {
    const teamName = safeBranding?.name || safeBranding?.shortName || "ShotLab";
    return {
      branding: safeBranding,
      theme,
      teamName,
      teamWordmark: safeBranding?.wordmark || teamName,
      tokens: {
        primary: theme.colors.primary,
        primarySoft: theme.colors.primarySoft,
        surface: "var(--surface-2)",
        text: "var(--text-1)",
        muted: "var(--text-2)",
      },
    };
  }, [safeBranding, theme]);

  return <TeamBrandingContext.Provider value={value}>{children}</TeamBrandingContext.Provider>;
}

export function useTeamBranding() {
  return useContext(TeamBrandingContext);
}
