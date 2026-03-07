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
        background: `linear-gradient(150deg, ${accent}2f 0%, ${accent}16 42%, var(--surface-1) 100%)`,
        border: `1px solid ${accent}80`,
        borderRadius: 20,
        padding: "20px 16px",
        marginBottom: 26,
        boxShadow: `0 18px 34px ${accent}2a`,
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
                border: `1px solid ${accent}55`,
                background: `${accent}14`,
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
                fontSize: 22,
                letterSpacing: 2.6,
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
                  fontSize: 12,
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
              borderRadius: 999,
              minHeight: 38,
              padding: "0 16px",
              fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: `0 0 0 1px ${accent}40, 0 10px 20px ${accent}30`,
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
