import resolveTeamBranding from "./resolveTeamBranding";
import DEFAULT_BRANDING from "./brandingDefaults";
import { balanceBrandColor, mixHex, normalizeHexColor, resolveOnColor, rgba } from "./brandColorUtils";
import { SEMANTIC_COLORS, SEMANTIC_TONES } from "./semanticColors";

export default function buildThemeTokens(teamBranding = {}) {
  const branding = resolveTeamBranding(teamBranding);
  const textScale = branding.textScale || DEFAULT_BRANDING.textScale;
  const textScaleTokens = textScale === "xl"
    ? { small: 1.22, medium: 1.2, display: 1.06 }
    : textScale === "large"
      ? { small: 1.12, medium: 1.11, display: 1.04 }
      : { small: 1, medium: 1, display: 1 };

  const rawPrimary = normalizeHexColor(branding.primaryColor, DEFAULT_BRANDING.primaryColor);
  const rawSecondary = normalizeHexColor(branding.secondaryColor, rawPrimary);

  // Team colors control identity and primary actions only. Semantic state colors stay fixed.
  const darkSurfaceBase = "#0F1115";
  const darkSurfaceElevated = "#171D28";
  const neutralText = "#E5E7EB";

  const brandPrimary = balanceBrandColor(rawPrimary);
  const brandSecondary = balanceBrandColor(rawSecondary);
  const brandPrimarySoft = rgba(brandPrimary, 0.2);
  const brandPrimaryMuted = rgba(brandPrimary, 0.12);
  const brandPrimaryGlow = rgba(brandPrimary, 0.38);
  const brandOnPrimary = resolveOnColor(brandPrimary, normalizeHexColor(branding.textOnPrimary, DEFAULT_BRANDING.textOnPrimary));
  const brandBorder = mixHex(brandPrimary, darkSurfaceElevated, 0.52);
  const brandTintSurface = mixHex(darkSurfaceBase, brandPrimary, 0.15);
  const brandAccentText = mixHex(brandPrimary, neutralText, 0.34);
  const brandNavActive = mixHex(brandPrimary, neutralText, 0.2);
  const brandIconAccent = mixHex(brandSecondary, brandPrimary, 0.6);
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
      semanticSuccess: SEMANTIC_COLORS.SUCCESS,
      semanticInfo: SEMANTIC_COLORS.INFO,
      semanticWarning: SEMANTIC_COLORS.WARNING,
      semanticDanger: SEMANTIC_COLORS.DANGER,
      semanticNeutral: SEMANTIC_COLORS.NEUTRAL,
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
      "--nav-active-glow": rgba(brandNavActive, 0.22),
      "--page-accent": brandAccentText,
      "--semantic-success": SEMANTIC_COLORS.SUCCESS,
      "--semantic-success-surface": SEMANTIC_TONES.success.surface,
      "--semantic-success-border": SEMANTIC_TONES.success.border,
      "--semantic-info": SEMANTIC_COLORS.INFO,
      "--semantic-info-surface": SEMANTIC_TONES.info.surface,
      "--semantic-info-border": SEMANTIC_TONES.info.border,
      "--semantic-warning": SEMANTIC_COLORS.WARNING,
      "--semantic-warning-surface": SEMANTIC_TONES.warning.surface,
      "--semantic-warning-border": SEMANTIC_TONES.warning.border,
      "--semantic-danger": SEMANTIC_COLORS.DANGER,
      "--semantic-danger-surface": SEMANTIC_TONES.danger.surface,
      "--semantic-danger-border": SEMANTIC_TONES.danger.border,
      "--semantic-neutral": SEMANTIC_COLORS.NEUTRAL,
      "--semantic-neutral-surface": SEMANTIC_TONES.neutral.surface,
      "--semantic-neutral-border": SEMANTIC_TONES.neutral.border,
      "--coach-text-scale-small": String(textScaleTokens.small),
      "--coach-text-scale-medium": String(textScaleTokens.medium),
      "--coach-text-scale-display": String(textScaleTokens.display),
    },
  };
}
