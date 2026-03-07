function HeroBanner({
  title,
  subtitle,
  accent = "var(--accent)",
  icon = null,
  actionLabel,
  onAction,
}) {
  return (
    <section
      style={{
        background: `linear-gradient(140deg, ${accent}14 0%, rgba(18, 24, 30, 0.9) 45%, var(--surface-1) 100%)`,
        border: `1px solid var(--stroke-2)`,
        borderRadius: 18,
        padding: "16px 14px",
        marginBottom: 20,
        boxShadow: `0 12px 20px rgba(0,0,0,0.34)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {icon ? (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: `1px solid var(--stroke-1)`,
                background: `var(--accent-surface)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
          ) : null}
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif",
                color: accent,
                fontSize: 18,
                letterSpacing: 2.2,
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
                  color: "var(--text-1)",
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            style={{
              background: accent,
              color: "var(--bg)",
              border: "none",
              borderRadius: 10,
              padding: "8px 10px",
              fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default HeroBanner;
