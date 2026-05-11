export default function CoachSimpleHeader({
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
        marginBottom: 6,
        padding: "2px 0 1px",
      }}
    >
      <style>{`
        .coach-simple-header-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:start;background:transparent;border:0;outline:none;box-shadow:none;}
         .coach-simple-header-right{display:flex;align-items:flex-start;gap:2px;justify-content:flex-end;background:transparent;border:0;outline:none;box-shadow:none;}
        .coach-simple-header-logo{width:clamp(144px,40vw,220px);max-height:132px;display:flex;align-items:flex-start;justify-content:flex-end;background:transparent;border:0;outline:none;box-shadow:none;}
        .coach-simple-header-brand-btn{min-height:32px;max-width:220px;width:max-content;}
        .coach-simple-header-top::before,.coach-simple-header-top::after,.coach-simple-header-right::before,.coach-simple-header-right::after,.coach-simple-header-logo::before,.coach-simple-header-logo::after{content:none !important;display:none !important;}
        @media (max-width:640px){
          .coach-simple-header-top{grid-template-columns:1fr;}
          .coach-simple-header-right{justify-content:space-between;align-items:flex-start;}
          .coach-simple-header-logo{justify-content:flex-start;}
        }
      `}</style>

      <div className="coach-simple-header-top">
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              color: "var(--team-brand-badge-text)",
              fontSize: 9.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Coach Mode
          </span>
          <h1
            style={{
              margin: "2px 0 0",
              fontSize: "clamp(30px, 8vw, 45px)",
              lineHeight: 0.94,
              color: "var(--text-1)",
              fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif",
              letterSpacing: "var(--tracking-default)",
              textTransform: "uppercase",
            }}
          >
            {(userName || "Demo Coach").toUpperCase()}
          </h1>
          <p
            style={{
              margin: "2px 0 0",
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
              marginTop: -1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--text-3)",
              fontSize: 9.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <span aria-hidden="true" style={{ color: "var(--accent)", fontSize: 10 }}>
              ✓
            </span>
            Coach identity
          </div>
        </div>

        <div className="coach-simple-header-right">
          <div className="coach-simple-header-logo">
            <div
              style={{
                maxWidth: "100%",
                maxHeight: 132,
                transform: "translateY(-6px)",
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
              border: "none",
              background: "transparent",
              color: "var(--text-2)",
              minHeight: 28,
              minWidth: 28,
              padding: 0,
              fontSize: 13,
              cursor: "pointer",
              opacity: 0.84,
              marginTop: -1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ marginTop: 3, display: "flex", justifyContent: "flex-start" }}>
        <button
          type="button"
          onClick={onOpenTeamBranding}
          className="coach-simple-header-brand-btn"
          style={{
            padding: "4px 10px",
            borderRadius: 9,
            border: "1px solid color-mix(in srgb, var(--team-brand-badge-border) 70%, var(--stroke-1))",
            background: "color-mix(in srgb, var(--team-brand-badge-bg) 54%, transparent)",
            color: "color-mix(in srgb, var(--team-brand-badge-text) 80%, var(--text-2))",
            fontSize: 9.5,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Team Branding Settings
        </button>
      </div>
    </section>
  );
}
