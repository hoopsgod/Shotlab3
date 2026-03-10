export const colorTokenRefs = {
  bg: {
    canvas: "var(--color-bg-canvas)",
    surface: "var(--color-bg-surface)",
    elevated: "var(--color-bg-elevated)",
    subtle: "var(--color-bg-subtle)",
  },
  text: {
    primary: "var(--color-text-primary)",
    secondary: "var(--color-text-secondary)",
    muted: "var(--color-text-muted)",
    helper: "var(--color-text-helper)",
    placeholder: "var(--color-text-placeholder)",
  },
  border: {
    subtle: "var(--color-border-subtle)",
    strong: "var(--color-border-strong)",
  },
  action: {
    primary: "var(--color-action-primary)",
    primarySoft: "var(--color-action-primary-soft)",
    primaryStrong: "var(--color-action-primary-strong)",
    secondary: "var(--color-action-secondary)",
    secondarySoft: "var(--color-action-secondary-soft)",
    highlight: "var(--color-highlight-warm)",
    highlightSoft: "var(--color-highlight-warm-soft)",
  },
  state: {
    success: "var(--color-state-success)",
    successSoft: "var(--color-state-success-soft)",
    warning: "var(--color-state-warning)",
    warningSoft: "var(--color-state-warning-soft)",
    danger: "var(--color-state-danger)",
    dangerSoft: "var(--color-state-danger-soft)",
  },

  // Existing compatibility aliases backed by design-system variables.
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
  lime: "var(--lime)",
  bgBase: "var(--bg)",
  bgCard: "var(--surface-1)",
  bgElevated: "var(--surface-2)",
  textPrimary: "var(--text-1)",
  textSecondary: "var(--text-2)",
  textMuted: "var(--text-3)",
  borderSubtle: "var(--border-1)",
  borderStrong: "var(--border-2)",
};

export default colorTokenRefs;
