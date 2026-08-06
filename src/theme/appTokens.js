import DEFAULT_BRANDING from "./brandingDefaults";
import resolveTeamBranding from "./resolveTeamBranding";
import { SEMANTIC_COLORS } from "./semanticColors";

const BASE_THEME_COLORS = Object.freeze({
  BG_BASE: "#F3F1EA",
  BG_CARD: "#FFFFFF",
  BG_ELEVATED: "#F8F7F2",
  BG_SUBTLE: "rgba(17, 26, 33, 0.10)",
  TEXT_PRIMARY: "#111A21",
  TEXT_SECONDARY: "#44515B",
  TEXT_MUTED: "#65717A",
  INK: "#0D171E",
  PERFORMANCE_SURFACE: "#101C23",
  PERFORMANCE_TEXT: "#F5F8F9",
  ACCENT_INK: "#10170B",
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
