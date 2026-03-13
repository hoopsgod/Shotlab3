import BRANDING_DEFAULTS from "./brandingDefaults";

export default function buildThemeTokens(teamBranding = {}) {
  const colors = {
    ...BRANDING_DEFAULTS.colors,
    ...(teamBranding.colors || {}),
  };

  return {
    brandName: teamBranding.name || BRANDING_DEFAULTS.name,
    logoText: teamBranding.logoText || BRANDING_DEFAULTS.logoText,
    colors,
    cssVariables: {
      "--team-brand-primary": colors.primary,
      "--team-brand-primary-text": colors.primaryText,
      "--team-brand-primary-soft": colors.primarySoft,
      "--team-brand-header-accent": colors.headerAccent,
      "--team-brand-logo-accent": colors.logoAccent,
      "--team-brand-nav-active": colors.navActive,
      "--team-brand-badge-bg": colors.badgeBg,
      "--team-brand-badge-border": colors.badgeBorder,
      "--team-brand-badge-text": colors.badgeText,
      "--accent": colors.primary,
      "--accent-soft": colors.primarySoft,
      "--color-primary": colors.primary,
      "--nav-active-text": colors.navActive,
      "--page-accent": colors.headerAccent,
    },
  };
}
