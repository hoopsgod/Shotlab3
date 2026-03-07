import UI_TOKENS from "../styles/tokens";

const HERO_RADIUS = 18;
const HERO_BUTTON_RADIUS = 10;

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
        background: "var(--surface-2)",
        border: `1px solid ${accent}66`,
        borderRadius: HERO_RADIUS,
        padding: "16px 12px",
        marginBottom: 20,
        boxShadow: "var(--shadow-1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {icon ? (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: HERO_BUTTON_RADIUS,
                border: `1px solid ${accent}66`,
                background: "var(--surface-1)",
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
                fontSize: 19,
                letterSpacing: 1.6,
                lineHeight: 1.05,
                textTransform: "uppercase",
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
                  color: "var(--text-2)",
                  fontSize: 12,
                  lineHeight: 1.4,
                  letterSpacing: "0.01em",
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
              color: UI_TOKENS.colors.bgBase,
              border: "1px solid transparent",
              borderRadius: HERO_BUTTON_RADIUS,
              padding: "8px 10px",
              fontFamily: "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.02em",
              textTransform: "none",
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
