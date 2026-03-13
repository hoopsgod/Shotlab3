import resolveTeamBranding from "./resolveTeamBranding";

export default function buildThemeTokens(teamBranding = {}) {
  const branding = resolveTeamBranding(teamBranding);

  const primarySoft = `color-mix(in srgb, ${branding.primaryColor} 22%, transparent)`;

  return {
    branding,
    colors: {
      primary: branding.primaryColor,
      primaryText: branding.textOnPrimary,
      primarySoft,
      headerAccent: branding.accentColor,
      logoAccent: branding.accentColor,
      navActive: branding.accentColor,
      badgeBg: `color-mix(in srgb, ${branding.accentColor} 16%, transparent)`,
      badgeBorder: `color-mix(in srgb, ${branding.accentColor} 42%, transparent)`,
      badgeText: branding.accentColor,
      secondary: branding.secondaryColor,
    },
    cssVariables: {
      "--team-brand-primary": branding.primaryColor,
      "--team-brand-primary-text": branding.textOnPrimary,
      "--team-brand-secondary": branding.secondaryColor,
      "--team-brand-accent": branding.accentColor,
      "--team-brand-primary-soft": primarySoft,
      "--team-brand-header-accent": branding.accentColor,
      "--team-brand-logo-accent": branding.accentColor,
      "--team-brand-nav-active": branding.accentColor,
      "--team-brand-badge-bg": `color-mix(in srgb, ${branding.accentColor} 16%, transparent)`,
      "--team-brand-badge-border": `color-mix(in srgb, ${branding.accentColor} 42%, transparent)`,
      "--team-brand-badge-text": branding.accentColor,
      "--accent": branding.accentColor,
      "--accent-soft": primarySoft,
      "--color-primary": branding.primaryColor,
      "--nav-active-text": branding.accentColor,
      "--page-accent": branding.accentColor,
    },
  };
}
