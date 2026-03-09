import { DEFAULT_TEAM_BRANDING } from "../constants/defaultTeamBranding";

export const sanitizeHexColor = (value, fallback) =>
  /^#[0-9A-F]{6}$/i.test(String(value || "").trim()) ? String(value).trim().toUpperCase() : fallback;

export const sanitizeTeamBranding = (branding = {}) => ({
  logoUrl: typeof branding.logoUrl === "string" ? branding.logoUrl.trim() : "",
  teamName: typeof branding.teamName === "string" ? branding.teamName.trim() : "",
  mascotName: typeof branding.mascotName === "string" ? branding.mascotName.trim() : "",
  motto: typeof branding.motto === "string" ? branding.motto.trim().slice(0, 48) : "",
  primaryColor: sanitizeHexColor(branding.primaryColor, DEFAULT_TEAM_BRANDING.primaryColor),
  secondaryColor: sanitizeHexColor(branding.secondaryColor, DEFAULT_TEAM_BRANDING.secondaryColor),
  brandingMode: ["subtle", "balanced", "bold", "compact"].includes(branding.brandingMode)
    ? branding.brandingMode
    : DEFAULT_TEAM_BRANDING.brandingMode,
  showHeaderLogo: branding.showHeaderLogo !== false,
  showWatermark: Boolean(branding.showWatermark),
  useTeamColors: branding.useTeamColors !== false,
  useTeamNameInHeader: branding.useTeamNameInHeader !== false,
  watermarkEmptyStates: Boolean(branding.watermarkEmptyStates),
  headerAccentStyle: ["underline", "side-stripe", "top-glow"].includes(branding.headerAccentStyle)
    ? branding.headerAccentStyle
    : DEFAULT_TEAM_BRANDING.headerAccentStyle,
  badgeStyle: ["shield", "round", "rectangle"].includes(branding.badgeStyle)
    ? branding.badgeStyle
    : DEFAULT_TEAM_BRANDING.badgeStyle,
  homeTexture: ["none", "diagonal", "court-lines", "matte"].includes(branding.homeTexture)
    ? branding.homeTexture
    : DEFAULT_TEAM_BRANDING.homeTexture,
});

export const withTeamBranding = (team) => (team ? { ...team, branding: sanitizeTeamBranding(team.branding) } : team);

export const hexToRgb = (hex) => {
  const clean = String(hex || "").replace("#", "");
  if (clean.length !== 6) return null;
  const num = Number.parseInt(clean, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

export const alphaFromHex = (hex, alpha) => {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex;
};

const relativeLuminance = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const norm = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
};

export const contrastRatio = (c1, c2) => {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
};
