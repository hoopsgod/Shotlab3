const VARIANT_STYLES = {
  standard: {
    padding: "4px 0 18px",
    border: "none",
    borderBottom: "1px solid var(--stroke-1)",
    background: "transparent",
    shadow: "none",
    radius: 0,
  },
  branded: {
    padding: "20px",
    border: "1px solid var(--stroke-1)",
    background: "var(--surface-1)",
    shadow: "var(--shadow-1)",
    radius: "var(--radius-xl, 24px)",
  },
  utility: {
    padding: "2px 0 14px",
    border: "none",
    borderBottom: "1px solid var(--stroke-1)",
    background: "transparent",
    shadow: "none",
    radius: 0,
  },
};

const ACTION_BASE = {
  borderRadius: "var(--radius-md, 14px)",
  border: "1px solid var(--stroke-1)",
  background: "rgba(255,255,255,.86)",
  color: "var(--text-1)",
  minHeight: 44,
  minWidth: 44,
  padding: "9px 13px",
  fontSize: 12,
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: "-0.005em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: 6,
  whiteSpace: "normal",
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(17,26,33,.04)",
  transition: "background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease",
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
  const isIconOnlyAction = Boolean(action && !action.label);
  const quietBrandedActionStyle = variant === "branded" && isIconOnlyAction
    ? {
      minHeight: 44,
      minWidth: 44,
      padding: 7,
      color: "var(--text-2)",
      background: "var(--surface-3)",
    }
    : null;

  return (
    <header
      className={`appHeader appHeader--${variant}`}
      style={{
        marginBottom: variant === "utility" ? 16 : "var(--stack-gap)",
        padding: stylePreset.padding,
        border: stylePreset.border,
        borderBottom: stylePreset.borderBottom,
        borderRadius: stylePreset.radius,
        background: stylePreset.background,
        boxShadow: stylePreset.shadow,
      }}
    >
      <div
        className="appHeaderMain"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          minWidth: 0,
        }}
      >
        <div className="appHeaderIdentity" style={{ display: "flex", alignItems: "flex-start", gap: 13, minWidth: 0, flex: "1 1 230px", maxWidth: "100%" }}>
          {leading ? <div className="appHeaderLeading" style={{ marginTop: 2, color: "var(--text-2)", flexShrink: 0 }}>{leading}</div> : null}
          <div className="appHeaderCopy" style={{ minWidth: 0, maxWidth: "100%" }}>
            {eyebrow ? (
              <div className="appHeaderEyebrow" style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: ".01em", color: "var(--accent-strong, #617900)", fontWeight: 720, marginBottom: 7, lineHeight: 1.25 }}>
                {eyebrow}
              </div>
            ) : null}
            <h1 className="appHeaderTitle" style={{ fontFamily: "var(--font-display)", fontSize: variant === "utility" ? 24 : 38, fontWeight: 780, lineHeight: 1.02, margin: 0, color: "var(--text-1)", letterSpacing: "-.038em", maxWidth: "100%", overflowWrap: "break-word" }}>
              {title}
            </h1>
            {subtitle ? (
              <p className="appHeaderSubtitle" style={{ marginTop: 8, marginBottom: 0, color: "var(--text-2)", fontFamily: "var(--font-body)", fontSize: 14, letterSpacing: "-.008em", lineHeight: 1.5, overflowWrap: "anywhere", maxWidth: 680 }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {(brandLockup || action) ? (
          <div className="appHeaderTools" style={{ display: "flex", alignItems: "flex-start", gap: 8, marginLeft: "auto", maxWidth: "100%", flexWrap: "wrap" }}>
            {brandLockup ? <div className="appHeaderBrand" style={{ minWidth: 0 }}>{brandLockup}</div> : null}
            {action ? (
              <button className="appHeaderAction" type="button" onClick={action.onClick} aria-label={action.ariaLabel || action.label} style={{ ...ACTION_BASE, ...(quietBrandedActionStyle || {}) }}>
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
