import React, { createContext, useContext, useMemo } from "react";

export interface TeamBranding {
  name?: string;
  shortName?: string;
  wordmark?: string;
  primary?: string;
  primarySoft?: string;
  surface?: string;
  text?: string;
  muted?: string;
}

interface TeamBrandingContextValue {
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

const defaultValue: TeamBrandingContextValue = {
  teamName: "ShotLab",
  teamWordmark: "ShotLab",
  tokens: {
    primary: "var(--accent)",
    primarySoft: "var(--accent-soft)",
    surface: "var(--surface-2)",
    text: "var(--text-1)",
    muted: "var(--text-2)",
  },
};

const TeamBrandingContext = createContext<TeamBrandingContextValue>(defaultValue);

export function TeamBrandingProvider({ branding, children }: { branding?: TeamBranding; children: React.ReactNode }) {
  const value = useMemo<TeamBrandingContextValue>(() => {
    const teamName = branding?.name || branding?.shortName || defaultValue.teamName;
    return {
      teamName,
      teamWordmark: branding?.wordmark || teamName,
      tokens: {
        primary: branding?.primary || "var(--accent)",
        primarySoft: branding?.primarySoft || "var(--accent-soft)",
        surface: branding?.surface || "var(--surface-2)",
        text: branding?.text || "var(--text-1)",
        muted: branding?.muted || "var(--text-2)",
      },
    };
  }, [branding]);

  return <TeamBrandingContext.Provider value={value}>{children}</TeamBrandingContext.Provider>;
}

export function useTeamBranding() {
  return useContext(TeamBrandingContext);
}
