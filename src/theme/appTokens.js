import DEFAULT_BRANDING from "./brandingDefaults";
import resolveTeamBranding from "./resolveTeamBranding";

const BASE_THEME_COLORS = Object.freeze({
  BG_BASE: "#0B0D10",
  BG_CARD: "#111418",
  BG_SUBTLE: "rgba(255, 255, 255, 0.10)",
  TEXT_PRIMARY: "#F5F7FA",
  TEXT_SECONDARY: "#A6B0BF",
  TEXT_MUTED: "#7E8794",
  WARNING: "#F59E0B",
  DANGER: "#EF4444",
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
