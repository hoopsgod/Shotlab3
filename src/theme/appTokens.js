import DEFAULT_BRANDING from "./brandingDefaults";
import resolveTeamBranding from "./resolveTeamBranding";
import { SEMANTIC_COLORS } from "./semanticColors";

const BASE_THEME_COLORS = Object.freeze({
  BG_BASE: "#F3F0E8",
  BG_CARD: "#FFFFFF",
  BG_RAISED: "#FAF9F5",
  BG_INK: "#0D151B",
  BG_SUBTLE: "rgba(18, 27, 34, 0.10)",
  SURFACE_PRIMARY: "#FFFFFF",
  SURFACE_SECONDARY: "#F8F6F0",
  SURFACE_INSET: "#ECE9E1",
  TEXT_PRIMARY: "#121A20",
  TEXT_SECONDARY: "#4E5A63",
  TEXT_MUTED: "#76818A",
  TEXT_ON_INK: "#F6F7F3",
  BORDER_SUBTLE: "rgba(18, 27, 34, 0.10)",
  BORDER_STRONG: "rgba(18, 27, 34, 0.17)",
  SHADOW_CARD: "0 12px 34px rgba(27, 35, 41, 0.08)",
  SHADOW_RAISED: "0 20px 54px rgba(27, 35, 41, 0.12)",
  RADIUS_SMALL: 12,
  RADIUS_MEDIUM: 18,
  RADIUS_LARGE: 26,
  ...SEMANTIC_COLORS,
});

export function buildAppTokens(teamBranding = DEFAULT_BRANDING) {
  const branding = resolveTeamBranding(teamBranding);
  return Object.freeze({
    PRIMARY: branding.primaryColor,
    SECONDARY: branding.secondaryColor,
    ...BASE_THEME_COLORS,
  });
}

const APP_TOKENS = buildAppTokens(DEFAULT_BRANDING);

export default APP_TOKENS;
