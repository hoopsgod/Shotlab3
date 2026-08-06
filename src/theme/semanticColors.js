export const SEMANTIC_COLORS = Object.freeze({
  SUCCESS: "#167A52",
  INFO: "#176B87",
  WARNING: "#A85F0C",
  DANGER: "#C33B49",
  NEUTRAL: "#65717A",
});

export const SEMANTIC_TONES = Object.freeze({
  success: Object.freeze({
    foreground: SEMANTIC_COLORS.SUCCESS,
    surface: "rgba(22, 122, 82, 0.09)",
    border: "rgba(22, 122, 82, 0.28)",
  }),
  info: Object.freeze({
    foreground: SEMANTIC_COLORS.INFO,
    surface: "rgba(23, 107, 135, 0.09)",
    border: "rgba(23, 107, 135, 0.28)",
  }),
  warning: Object.freeze({
    foreground: SEMANTIC_COLORS.WARNING,
    surface: "rgba(168, 95, 12, 0.09)",
    border: "rgba(168, 95, 12, 0.28)",
  }),
  danger: Object.freeze({
    foreground: SEMANTIC_COLORS.DANGER,
    surface: "rgba(195, 59, 73, 0.09)",
    border: "rgba(195, 59, 73, 0.28)",
  }),
  neutral: Object.freeze({
    foreground: SEMANTIC_COLORS.NEUTRAL,
    surface: "rgba(101, 113, 122, 0.08)",
    border: "rgba(101, 113, 122, 0.24)",
  }),
});

export function getSemanticTone(tone = "neutral") {
  return SEMANTIC_TONES[tone] || SEMANTIC_TONES.neutral;
}

export default SEMANTIC_COLORS;
