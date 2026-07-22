export const SEMANTIC_COLORS = Object.freeze({
  SUCCESS: "#4ADE80",
  INFO: "#38BDF8",
  WARNING: "#F59E0B",
  DANGER: "#F87171",
  NEUTRAL: "#94A3B8",
});

export const SEMANTIC_TONES = Object.freeze({
  success: Object.freeze({
    foreground: SEMANTIC_COLORS.SUCCESS,
    surface: "rgba(74, 222, 128, 0.10)",
    border: "rgba(74, 222, 128, 0.34)",
  }),
  info: Object.freeze({
    foreground: SEMANTIC_COLORS.INFO,
    surface: "rgba(56, 189, 248, 0.10)",
    border: "rgba(56, 189, 248, 0.34)",
  }),
  warning: Object.freeze({
    foreground: SEMANTIC_COLORS.WARNING,
    surface: "rgba(245, 158, 11, 0.10)",
    border: "rgba(245, 158, 11, 0.34)",
  }),
  danger: Object.freeze({
    foreground: SEMANTIC_COLORS.DANGER,
    surface: "rgba(248, 113, 113, 0.10)",
    border: "rgba(248, 113, 113, 0.34)",
  }),
  neutral: Object.freeze({
    foreground: SEMANTIC_COLORS.NEUTRAL,
    surface: "rgba(148, 163, 184, 0.09)",
    border: "rgba(148, 163, 184, 0.28)",
  }),
});

export function getSemanticTone(tone = "neutral") {
  return SEMANTIC_TONES[tone] || SEMANTIC_TONES.neutral;
}

export default SEMANTIC_COLORS;
