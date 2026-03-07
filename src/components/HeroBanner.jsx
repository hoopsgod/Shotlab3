import UI_TOKENS from "../styles/tokens";

const HERO_RADIUS = 16;
const HERO_BUTTON_RADIUS = 12;

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
        padding: "var(--card-pad-standard) var(--card-pad-compact)",
        marginBottom: "var(--space-5)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--control-gap-tight)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--control-gap-tight)", minWidth: 0 }}>
          {icon ? (
            <div
              style={{
                width: 32,
                height: 32,
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
                  marginTop: "var(--space-1)",
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
              padding: "var(--space-2) var(--space-3)",
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
