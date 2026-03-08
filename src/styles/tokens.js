export const UI_TOKENS = {
  colors: {
    // Semantic palette: premium sports-tech refresh (replaces prior neon/gaming accents)
    bg: {
      canvas: "#121821",
      surface: "#1a2431",
      elevated: "#223043",
    },
    text: {
      primary: "#f1f5fb",
      secondary: "#c1ccda",
      muted: "#8f9caf",
    },
    border: {
      subtle: "rgba(173, 187, 205, 0.22)",
      strong: "rgba(188, 202, 220, 0.36)",
    },
    action: {
      primary: "#3f5f97",
      secondary: "#3b6e74",
      highlight: "#b6aa94",
    },
    state: {
      success: "#5f8f78",
      warning: "#a9865e",
      danger: "#a86b6b",
    },

    // Backward-compat aliases (legacy token names kept for existing components)
    primary: "#3f5f97",
    primaryDim: "#8f9caf",
    primaryGlow: "rgba(63, 95, 151, 0.2)",
    secondary: "#3b6e74",
    secondaryDim: "rgba(59, 110, 116, 0.22)",
    primaryCyan: "#3f5f97",
    primaryYellow: "#b6aa94",
    highlight: "#b6aa94",
    success: "#5f8f78",
    pending: "#a9865e",
    warning: "#a9865e",
    danger: "#a86b6b",
    bgBase: "#121821",
    bgCard: "#1a2431",
    bgElevated: "#223043",
    bgSubtle: "rgba(173, 187, 205, 0.08)",
    textPrimary: "#f1f5fb",
    textSecondary: "#c1ccda",
    textMuted: "#8f9caf",
  },
  spacing: {
    xs: 4,
    sm: 8,
    smd: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    section: 56,
    xxxl: 72,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    card: 16,
    pill: 999,
  },
  shadows: {
    card: "0 8px 24px rgba(0, 0, 0, 0.26)",
    raised: "0 14px 30px rgba(0, 0, 0, 0.32)",
    accent: "0 0 0 3px rgba(63, 95, 151, 0.22)",
  },
  borders: {
    subtle: "rgba(173, 187, 205, 0.22)",
    strong: "rgba(188, 202, 220, 0.36)",
    accent: "rgba(63, 95, 151, 0.32)",
  },
};

export default UI_TOKENS;
