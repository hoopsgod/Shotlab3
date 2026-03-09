/** @typedef {import("../../../domain/models/coreModels").TeamBranding} TeamBranding */

/** @type {TeamBranding} */
export const DEFAULT_TEAM_BRANDING = {
  logoUrl: "",
  teamName: "",
  mascotName: "",
  motto: "",
  primaryColor: "#3f5f97",
  secondaryColor: "#3b6e74",
  brandingMode: "balanced",
  showHeaderLogo: true,
  showWatermark: false,
  useTeamColors: true,
  useTeamNameInHeader: true,
  watermarkEmptyStates: true,
  headerAccentStyle: "underline",
  badgeStyle: "round",
  homeTexture: "none",
};

export const BRANDING_PRESETS = [
  { id: "volt", name: "Volt", primaryColor: "#3f5f97", secondaryColor: "#3b6e74" },
  { id: "royal", name: "Royal", primaryColor: "#4F7CFF", secondaryColor: "#7CE7FF" },
  { id: "sunset", name: "Sunset", primaryColor: "#FF7A45", secondaryColor: "#FFD166" },
  { id: "crimson", name: "Crimson", primaryColor: "#FF5A5F", secondaryColor: "#FFE66D" },
  { id: "forest", name: "Forest", primaryColor: "#6EEB83", secondaryColor: "#4D96FF" },
  { id: "navy-gold", name: "Navy Gold", primaryColor: "#0B1F3B", secondaryColor: "#F4C542" },
  { id: "cardinal-gold", name: "Cardinal Gold", primaryColor: "#8C1D40", secondaryColor: "#FFB81C" },
  { id: "green-gold", name: "Green Gold", primaryColor: "#0B6B3A", secondaryColor: "#D4AF37" },
  { id: "purple-gold", name: "Purple Gold", primaryColor: "#4B2E83", secondaryColor: "#FDB927" },
  { id: "black-red", name: "Black Red", primaryColor: "#121212", secondaryColor: "#D7263D" },
  { id: "maroon-silver", name: "Maroon Silver", primaryColor: "#6E2233", secondaryColor: "#C0C6CF" },
];

export const LOGO_ALLOWED_TYPES = ["image/png", "image/jpeg"];
export const MIN_LOGO_RATIO = 0.75;
export const MAX_LOGO_RATIO = 3;
