export const UI_TOKENS = {
  colors: {
    // Semantic palette: premium mobile-first sports product
    bg: {
      canvas: "#0f1722",
      surface: "#182230",
      elevated: "#1f2b3b",
    },
    text: {
      primary: "#f4f7fc",
      secondary: "#c7d2e2",
      muted: "#9aa9bc",
    },
    border: {
      subtle: "rgba(175, 191, 214, 0.22)",
      strong: "rgba(195, 211, 231, 0.4)",
    },
    action: {
      primary: "#5379be",
      secondary: "#4b7f86",
      highlight: "#baa98f",
    },
    state: {
      success: "#5e9479",
      warning: "#af8c5f",
      danger: "#ab6e6e",
    },

    // Backward-compat aliases (legacy token names kept for existing components)
    primary: "#5379be",
    primaryDim: "#9aa9bc",
    primaryGlow: "rgba(83, 121, 190, 0.22)",
    secondary: "#4b7f86",
    secondaryDim: "rgba(75, 127, 134, 0.22)",
    primaryCyan: "#5379be",
    primaryYellow: "#baa98f",
    highlight: "#baa98f",
    success: "#5e9479",
    pending: "#af8c5f",
    warning: "#af8c5f",
    danger: "#ab6e6e",
    bgBase: "#0f1722",
    bgCard: "#182230",
    bgElevated: "#1f2b3b",
    bgSubtle: "rgba(175, 191, 214, 0.09)",
    textPrimary: "#f4f7fc",
    textSecondary: "#c7d2e2",
    textMuted: "#9aa9bc",
  },
  spacing: {
    xs: 4,
    sm: 8,
    smd: 12,
    md: 16,
    mdlg: 20,
    lg: 24,
    xl: 32,
    xxl: 40,
    section: 48,
    xxxl: 64,
  },
  radii: {
    sm: 8,
    md: 14,
    lg: 14,
    xl: 14,
    card: 14,
    pill: 999,
  },
  shadows: {
    card: "0 6px 18px rgba(6, 11, 19, 0.28)",
    raised: "0 12px 26px rgba(6, 11, 19, 0.34)",
    accent: "0 0 0 3px rgba(83, 121, 190, 0.24)",
  },
  borders: {
    subtle: "rgba(175, 191, 214, 0.22)",
    strong: "rgba(195, 211, 231, 0.4)",
    accent: "rgba(83, 121, 190, 0.36)",
  },
};

export default UI_TOKENS;
