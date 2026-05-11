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
          "linear-gradient(140deg, color-mix(in srgb, var(--accent) 5%, transparent), transparent 42%), radial-gradient(74% 68% at 88% 16%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 74%), radial-gradient(120% 96% at 48% 100%, color-mix(in srgb, var(--surface-2) 42%, transparent), transparent 76%)",
      }}
    >
      <style>{`
        .coach-hero-brand-btn{min-height:32px;max-width:208px;width:max-content;opacity:.86;}
        @media (max-width:520px){
          .coach-hero-row-top{align-items:flex-start;}
          .coach-hero-logo-wrap{width:clamp(102px,33vw,138px);}
        }
      `}</style>

      <div style={{ display: "grid", gap: 5 }}>
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
                margin: "5px 0 0",
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
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <div
              className="coach-hero-logo-wrap"
              style={{
                width: "clamp(118px, 33vw, 166px)",
                maxHeight: 114,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  maxWidth: "100%",
                  maxHeight: 114,
                  transform: "translateY(2px)",
                  filter: "drop-shadow(0 7px 15px rgba(0,0,0,0.22)) drop-shadow(0 0 16px color-mix(in srgb, var(--accent) 16%, transparent))",
                }}
              >
                {wordmark}
              </div>
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
                opacity: 0.84,
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
            gap: 7,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 220px" }}>
            <p
              style={{
                margin: 0,
                color: "var(--text-2)",
                fontSize: 12,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Lead. Develop. Dominate.
            </p>
            <div
              style={{
                marginTop: 2,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "var(--text-3)",
                fontSize: 10,
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
                    "1px solid color-mix(in srgb, var(--accent) 34%, var(--stroke-1))",
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
              padding: "6px 10px",
              borderRadius: 9,
              border:
                "1px solid color-mix(in srgb, var(--team-brand-badge-border) 70%, var(--stroke-1))",
              background:
                "color-mix(in srgb, var(--team-brand-badge-bg) 54%, transparent)",
              color:
                "color-mix(in srgb, var(--team-brand-badge-text) 80%, var(--text-2))",
              fontSize: 10,
              fontWeight: 600,
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
