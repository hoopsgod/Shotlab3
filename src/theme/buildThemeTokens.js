import { mergeBrandingWithDefaults } from "./brandingDefaults";

export function buildThemeTokens(branding) {
  const merged = mergeBrandingWithDefaults(branding);

  const cssVars = {
    "--team-primary": merged.primaryColor,
    "--team-secondary": merged.secondaryColor,
    "--team-accent": merged.accentColor,
    "--team-text-on-primary": merged.textOnPrimary,
    "--team-logo-url": merged.logoUrl ? `url(${merged.logoUrl})` : "none",
    "--team-logo-mark-url": merged.logoMarkUrl ? `url(${merged.logoMarkUrl})` : "none",
    "--accent": merged.primaryColor,
    "--accent-soft": `${merged.primaryColor}33`,
    "--color-primary": merged.primaryColor,
    "--color-secondary": merged.secondaryColor,
    "--accent-feed": merged.primaryColor,
    "--accent-drills": merged.primaryColor,
    "--accent-events": merged.accentColor,
    "--accent-sc": merged.accentColor,
    "--accent-lifting": merged.accentColor,
    "--accent-players": merged.secondaryColor,
    "--nav-active-text": merged.primaryColor,
  };

  return { branding: merged, cssVars };
}
