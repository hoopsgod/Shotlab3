export default function CoachHero({
  heroRef,
  userName,
  wordmark,
  onOpenTeamBranding,
  onLogout,
}) {
  return (
    <section
      ref={heroRef}
      style={{
        marginBottom: 10,
        padding: "6px 0 4px",
        background:
          "linear-gradient(140deg, color-mix(in srgb, var(--accent) 7%, transparent), transparent 48%), radial-gradient(90% 85% at 92% 14%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)",
        borderRadius: 14,
      }}
    >
      <style>{`
        .coach-hero-brand-btn{min-height:34px;max-width:220px;width:max-content;opacity:.9;}
        @media (max-width:520px){
          .coach-hero-row-top{align-items:flex-start;}
          .coach-hero-logo-wrap{width:clamp(100px,32vw,136px);}
        }
      `}</style>

      <div style={{ display: "grid", gap: 6 }}>
        <div
          className="coach-hero-row-top"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid var(--team-brand-badge-border)",
                background:
                  "color-mix(in srgb, var(--team-brand-badge-bg) 90%, transparent)",
                color: "var(--team-brand-badge-text)",
                borderRadius: 999,
                padding: "3px 10px",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Coach Mode
            </span>
            <h1
              style={{
                margin: "6px 0 0",
                fontSize: "clamp(30px, 8vw, 44px)",
                lineHeight: 0.94,
                color: "var(--text-1)",
                fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif",
                letterSpacing: "var(--tracking-default)",
                textTransform: "uppercase",
              }}
            >
              {(userName || "Demo Coach").toUpperCase()}
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <div
              className="coach-hero-logo-wrap"
              style={{
                width: "clamp(116px, 32vw, 164px)",
                maxHeight: 112,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <div style={{ maxWidth: "100%", maxHeight: 112, transform: "translateY(1px)", filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.24))" }}>{wordmark}</div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              style={{
                borderRadius: 999,
                border: "1px solid var(--team-brand-border, var(--stroke-1))",
                background:
                  "color-mix(in srgb, var(--surface-1) 92%, transparent)",
                color: "var(--text-2)",
                minHeight: 32,
                minWidth: 32,
                padding: 0,
                fontSize: 11,
                cursor: "pointer",
                opacity: 0.88,
                marginTop: 2,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 220px" }}>
            <p
              style={{
                margin: 0,
                color: "var(--text-2)",
                fontSize: 13,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Lead. Develop. Dominate.
            </p>
            <div
              style={{
                marginTop: 3,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "var(--text-3)",
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  border:
                    "1px solid color-mix(in srgb, var(--accent) 36%, var(--stroke-1))",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                  fontSize: 9,
                }}
              >
                ✓
              </span>
              Coach identity
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenTeamBranding}
            className="coach-hero-brand-btn"
            style={{
              padding: "7px 11px",
              borderRadius: 9,
              border: "1px solid color-mix(in srgb, var(--team-brand-badge-border) 85%, var(--stroke-1))",
              background: "color-mix(in srgb, var(--team-brand-badge-bg) 68%, transparent)",
              color: "color-mix(in srgb, var(--team-brand-badge-text) 88%, var(--text-2))",
              fontSize: 11,
              fontWeight: 650,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Team Branding Settings
          </button>
        </div>
      </div>
    </section>
  );
}
