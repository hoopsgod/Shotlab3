import resolveTeamBranding from "./resolveTeamBranding";
import DEFAULT_BRANDING from "./brandingDefaults";
import { balanceBrandColor, mixHex, normalizeHexColor, resolveOnColor, rgba } from "./brandColorUtils";

export default function buildThemeTokens(teamBranding = {}) {
  const branding = resolveTeamBranding(teamBranding);

  const rawPrimary = normalizeHexColor(branding.primaryColor, DEFAULT_BRANDING.primaryColor);
  const rawSecondary = normalizeHexColor(branding.secondaryColor, rawPrimary);

  const brandPrimary = balanceBrandColor(rawPrimary);
  const brandSecondary = balanceBrandColor(rawSecondary);
  const brandPrimarySoft = rgba(brandPrimary, 0.22);
  const brandPrimaryMuted = rgba(brandPrimary, 0.14);
  const brandPrimaryGlow = rgba(brandPrimary, 0.34);
  const brandOnPrimary = resolveOnColor(brandPrimary, normalizeHexColor(branding.textOnPrimary, DEFAULT_BRANDING.textOnPrimary));
  const brandBorder = rgba(brandPrimary, 0.5);
  const brandTintSurface = rgba(brandPrimary, 0.1);
  const brandAccentText = mixHex(brandPrimary, "#E5E7EB", 0.2);
  const brandNavActive = mixHex(brandPrimary, "#FFFFFF", 0.12);
  const brandIconAccent = mixHex(brandSecondary, brandPrimary, 0.45);
  const brandActionBg = rgba(brandPrimary, 0.18);
  const brandActionBgHover = rgba(brandPrimary, 0.28);

  return {
    branding: {
      ...branding,
      primaryColor: brandPrimary,
      secondaryColor: brandSecondary,
      accentColor: brandNavActive,
      textOnPrimary: brandOnPrimary,
    },
    colors: {
      brandPrimary,
      brandPrimarySoft,
      brandPrimaryMuted,
      brandPrimaryGlow,
      brandOnPrimary,
      brandBorder,
      brandTintSurface,
      brandAccentText,
      brandNavActive,
      brandIconAccent,
      primary: brandPrimary,
      primaryText: brandOnPrimary,
      primarySoft: brandPrimarySoft,
      headerAccent: brandAccentText,
      logoAccent: brandIconAccent,
      navActive: brandNavActive,
      badgeBg: brandTintSurface,
      badgeBorder: brandBorder,
      badgeText: brandAccentText,
      actionBg: brandActionBg,
      actionBgHover: brandActionBgHover,
      actionText: brandAccentText,
      accentSoft: brandPrimarySoft,
      accentBg: brandTintSurface,
      secondary: brandSecondary,
    },
    cssVariables: {
      "--team-brand-primary": brandPrimary,
      "--team-brand-primary-text": brandOnPrimary,
      "--team-brand-secondary": brandSecondary,
      "--team-brand-accent": brandAccentText,
      "--team-brand-primary-soft": brandPrimarySoft,
      "--team-brand-primary-muted": brandPrimaryMuted,
      "--team-brand-primary-glow": brandPrimaryGlow,
      "--team-brand-on-primary": brandOnPrimary,
      "--team-brand-border": brandBorder,
      "--team-brand-tint-surface": brandTintSurface,
      "--team-brand-accent-text": brandAccentText,
      "--team-brand-nav-active": brandNavActive,
      "--team-brand-icon-accent": brandIconAccent,
      "--team-brand-header-accent": brandAccentText,
      "--team-brand-logo-accent": brandIconAccent,
      "--team-brand-badge-bg": brandTintSurface,
      "--team-brand-badge-border": brandBorder,
      "--team-brand-badge-text": brandAccentText,
      "--team-brand-action-bg": brandActionBg,
      "--team-brand-action-bg-hover": brandActionBgHover,
      "--team-brand-action-text": brandAccentText,
      "--accent": brandAccentText,
      "--accent-soft": brandPrimarySoft,
      "--team-brand-accent-soft": brandPrimarySoft,
      "--team-brand-accent-bg": brandTintSurface,
      "--color-primary": brandPrimary,
      "--nav-active-text": brandNavActive,
      "--page-accent": brandAccentText,
    },
  };
}
