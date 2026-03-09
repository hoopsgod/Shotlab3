export default function MobileFocusPanel({
  accent,
  goal,
  summary,
  metricLabel,
  metricValue,
  primaryActionLabel,
  onPrimaryAction,
  secondaryLabel = "See details",
  children,
}) {
  return (
    <section
      className="heroModule"
      style={{
        marginBottom: 16,
        padding: "16px",
        border: `1px solid ${accent}44`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div className="heroKicker" style={{ color: accent, marginBottom: 4 }}>
            Primary goal
          </div>
          <h2 style={{ fontSize: 22, lineHeight: 1.05, margin: 0, color: "var(--text-1)", letterSpacing: "0.02em" }}>{goal}</h2>
          <p style={{ margin: "8px 0 0", color: "var(--text-2)", fontSize: 13, lineHeight: 1.4 }}>{summary}</p>
        </div>
        <button className="pageHeaderPill pageHeaderPillBrand" onClick={onPrimaryAction}>
          {primaryActionLabel}
        </button>
      </div>

      <div className="heroStatGroup" style={{ marginTop: 12, padding: "10px 12px" }}>
        <div className="heroStatLbl" style={{ fontSize: 10 }}>{metricLabel}</div>
        <div className="heroStatVal" style={{ color: accent, fontSize: 34, lineHeight: 1 }}>{metricValue}</div>
      </div>

      {children ? (
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: "pointer", color: "var(--text-2)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {secondaryLabel}
          </summary>
          <div style={{ marginTop: 8 }}>{children}</div>
        </details>
      ) : null}
    </section>
  );
}
