import { DEFAULT_BRANDING } from "./brandingDefaults";

export default function buildThemeTokens(teamBranding = {}) {
  const legacyColors = teamBranding?.colors || {};
  const branding = {
    ...DEFAULT_BRANDING,
    ...teamBranding,
    primaryColor: teamBranding?.primaryColor || legacyColors.primary || DEFAULT_BRANDING.primaryColor,
    secondaryColor: teamBranding?.secondaryColor || DEFAULT_BRANDING.secondaryColor,
    accentColor:
      teamBranding?.accentColor || legacyColors.headerAccent || legacyColors.logoAccent || DEFAULT_BRANDING.accentColor,
    textOnPrimary: teamBranding?.textOnPrimary || legacyColors.primaryText || DEFAULT_BRANDING.textOnPrimary,
    logoUrl: teamBranding?.logoUrl || "",
    logoMarkUrl: teamBranding?.logoMarkUrl || "",
  };

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
