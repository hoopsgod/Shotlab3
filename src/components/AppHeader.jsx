const VARIANT_STYLES = {
  standard: {
    padding: "16px",
    border: "1px solid var(--stroke-1)",
    background: "var(--surface-2)",
    shadow: "var(--shadow-1)",
  },
  branded: {
    padding: "16px",
    border: "1px solid var(--team-brand-border, var(--stroke-2))",
    background: "linear-gradient(180deg, color-mix(in srgb, var(--team-brand-tint-surface, transparent) 46%, transparent), transparent), var(--surface-3)",
    shadow: "var(--shadow-2)",
  },
  utility: {
    padding: "10px 0 8px",
    border: "none",
    background: "transparent",
    shadow: "none",
  },
};

const ACTION_BASE = {
  borderRadius: 999,
  border: "1px solid var(--team-brand-border, var(--stroke-1))",
  background: "var(--team-brand-action-bg, color-mix(in srgb, var(--surface-1) 88%, transparent))",
  color: "var(--team-brand-action-text, var(--text-2))",
  height: 30,
  minWidth: 30,
  padding: "0 10px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "var(--tracking-tight)",
  textTransform: "uppercase",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  cursor: "pointer",
  transition: "background-color 0.16s ease, border-color 0.16s ease",
};

export default function AppHeader({
  variant = "standard",
  eyebrow,
  title,
  subtitle,
  leading,
  brandLockup,
  action,
}) {
  const stylePreset = VARIANT_STYLES[variant] || VARIANT_STYLES.standard;

  return (
    <header
      style={{
        marginBottom: variant === "utility" ? 12 : "var(--stack-gap)",
        padding: stylePreset.padding,
        border: stylePreset.border,
        borderRadius: variant === "utility" ? 0 : "var(--radius-card)",
        background: stylePreset.background,
        boxShadow: stylePreset.shadow,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, flex: "1 1 220px" }}>
          {leading ? <div style={{ marginTop: 1, color: "var(--text-2)", flexShrink: 0 }}>{leading}</div> : null}
          <div style={{ minWidth: 0 }}>
            {eyebrow ? (
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", color: "var(--team-brand-header-accent, var(--text-3))", fontWeight: 700, marginBottom: 4 }}>
                {eyebrow}
              </div>
            ) : null}
            <h1 style={{ fontSize: variant === "utility" ? 18 : 28, lineHeight: 1.03, margin: 0, color: "var(--text-1)", fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif", letterSpacing: "var(--tracking-default)" }}>
              {title}
            </h1>
            {subtitle ? (
              <p style={{ marginTop: 6, marginBottom: 0, color: "var(--text-2)", fontSize: 12, letterSpacing: "0.03em", maxWidth: 520 }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {(brandLockup || action) ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", maxWidth: "100%" }}>
            {brandLockup ? <div style={{ minWidth: 0 }}>{brandLockup}</div> : null}
            {action ? (
              <button type="button" onClick={action.onClick} aria-label={action.ariaLabel || action.label} style={{ ...ACTION_BASE, opacity: 0.85 }}>
                {action.icon}
                {action.label ? <span>{action.label}</span> : null}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
