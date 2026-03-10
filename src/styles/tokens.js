const COLOR_TOKENS = {
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
};

export const UI_TOKENS = {
  colors: {
    // Canonical color values currently remain in this JS map for legacy alpha-concatenation usage
    // (for example `${UI_TOKENS.colors.danger}55` in inline styles).
    // Semantic palette: premium mobile-first sports product
    ...COLOR_TOKENS,

    // Backward-compat aliases (legacy token names kept for existing components)
    primary: COLOR_TOKENS.action.primary,
    primaryDim: COLOR_TOKENS.text.muted,
    primaryGlow: "rgba(83, 121, 190, 0.22)",
    secondary: COLOR_TOKENS.action.secondary,
    secondaryDim: "rgba(75, 127, 134, 0.22)",
    primaryCyan: COLOR_TOKENS.action.primary,
    primaryYellow: COLOR_TOKENS.action.highlight,
    highlight: COLOR_TOKENS.action.highlight,
    success: COLOR_TOKENS.state.success,
    pending: COLOR_TOKENS.state.warning,
    warning: COLOR_TOKENS.state.warning,
    danger: COLOR_TOKENS.state.danger,
    bgBase: COLOR_TOKENS.bg.canvas,
    bgCard: COLOR_TOKENS.bg.surface,
    bgElevated: COLOR_TOKENS.bg.elevated,
    bgSubtle: "rgba(175, 191, 214, 0.09)",
    textPrimary: COLOR_TOKENS.text.primary,
    textSecondary: COLOR_TOKENS.text.secondary,
    textMuted: COLOR_TOKENS.text.muted,
  },
  // Canonical source for shared spacing/radius/shadow/border values is `src/styles/design-system.css`.
  // Keep this JS export as a compatibility wrapper for inline styles and existing imports.
  spacing: {
    xs: "var(--space-1)",
    sm: "var(--space-2)",
    smd: "var(--space-3)",
    md: "var(--space-4)",
    mdlg: "var(--space-4a)",
    lg: "var(--space-5)",
    xl: "var(--space-6)",
    xxl: "var(--space-7)",
    section: "var(--space-8)",
    xxxl: "var(--space-9)",
  },
  radii: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    card: "var(--radius-md)",
    pill: "var(--radius-pill)",
  },
  shadows: {
    card: "var(--shadow-1)",
    raised: "var(--shadow-2)",
    accent: "var(--focus-ring)",
  },
  borders: {
    subtle: "var(--border-1)",
    strong: "var(--border-2)",
    accent: "var(--color-focus-ring)",
  },
};

export default UI_TOKENS;
