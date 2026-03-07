function HeroBanner({
  title,
  subtitle,
  accent = "var(--accent)",
  icon = null,
  actionLabel,
  onAction,
  dominant = false,
}) {
  const sectionStyle = dominant
    ? {
        background: `linear-gradient(150deg, ${accent}2f 0%, ${accent}16 42%, var(--surface-1) 100%)`,
        border: `1px solid ${accent}80`,
        borderRadius: 20,
        padding: "20px 16px",
        marginBottom: 26,
        boxShadow: `0 18px 34px ${accent}2a`,
      }
    : {
        background: `linear-gradient(140deg, ${accent}20 0%, ${accent}10 45%, var(--surface-1) 100%)`,
        border: `1px solid ${accent}66`,
        borderRadius: 18,
        padding: "16px 14px",
        marginBottom: 20,
        boxShadow: `0 14px 28px ${accent}22`,
      };

  const titleStyle = dominant
    ? { fontSize: 22, letterSpacing: 2.6 }
    : { fontSize: 18, letterSpacing: 2.2 };

  const subtitleStyle = dominant ? { fontSize: 12 } : { fontSize: 11 };

  const actionStyle = dominant
    ? {
        borderRadius: 999,
        minHeight: 38,
        padding: "0 16px",
        fontSize: 11,
        letterSpacing: 1.4,
        boxShadow: `0 0 0 1px ${accent}40, 0 10px 20px ${accent}30`,
      }
    : {
        borderRadius: 10,
        minHeight: 34,
        padding: "0 10px",
        fontSize: 10,
        letterSpacing: 1.2,
        boxShadow: "none",
      };

  return (
    <section
      style={sectionStyle}
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
                fontSize: titleStyle.fontSize,
                letterSpacing: titleStyle.letterSpacing,
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
                  fontSize: subtitleStyle.fontSize,
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
              borderRadius: actionStyle.borderRadius,
              minHeight: actionStyle.minHeight,
              padding: actionStyle.padding,
              fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
              fontSize: actionStyle.fontSize,
              fontWeight: 800,
              letterSpacing: actionStyle.letterSpacing,
              textTransform: "uppercase",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: actionStyle.boxShadow,
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
