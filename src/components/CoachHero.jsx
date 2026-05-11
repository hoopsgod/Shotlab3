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
        position: "relative",
        marginBottom: 8,
        padding: "4px 0 2px",
      }}
    >
      <style>{`
        .coach-hero-shell{
          position:relative;
          display:grid;
          gap:10px;
          grid-template-columns:minmax(0,1fr) auto;
          align-items:end;
        }
        .coach-hero-brand-btn{
          width:max-content;
          max-width:220px;
          transition: box-shadow 280ms ease, filter 280ms ease;
        }
        .coach-hero-brand-btn:hover{
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent), 0 8px 24px color-mix(in srgb, var(--accent) 20%, transparent);
          filter: brightness(1.03);
        }
        @keyframes coachHeroAmbientShift{
          0%{ transform: translate3d(0,0,0) scale(1); opacity:.88; }
          50%{ transform: translate3d(0,-4px,0) scale(1.015); opacity:.96; }
          100%{ transform: translate3d(0,0,0) scale(1); opacity:.88; }
        }
        @media (max-width: 640px){
          .coach-hero-shell{grid-template-columns:minmax(0,1fr);align-items:start;gap:8px;}
          .coach-hero-right{justify-self:end;}
        }
        @media (prefers-reduced-motion: reduce){
          .coach-hero-ambient{animation:none !important;}
          .coach-hero-brand-btn{transition:none;}
        }
      `}</style>
      <div
        aria-hidden="true"
        className="coach-hero-ambient"
        style={{
          position: "absolute",
          inset: "-20px -12px auto",
          height: 126,
          pointerEvents: "none",
          background:
            "linear-gradient(128deg, color-mix(in srgb, var(--accent) 13%, transparent) 0%, transparent 44%), radial-gradient(80% 85% at 8% 22%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%), radial-gradient(70% 90% at 88% 2%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)",
          filter: "blur(6px)",
          animation: "coachHeroAmbientShift 16s ease-in-out infinite",
        }}
      />

      <div className="coach-hero-shell">
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "color-mix(in srgb, var(--team-brand-badge-bg) 90%, transparent)",
              color: "var(--team-brand-badge-text)",
              borderRadius: 999,
              padding: "4px 10px",
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
              fontSize: "clamp(34px, 8.2vw, 58px)",
              lineHeight: 0.93,
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
              margin: "8px 0 0",
              color: "var(--text-2)",
              fontSize: 13,
              letterSpacing: "0.035em",
              textTransform: "uppercase",
            }}
          >
            Lead. Develop. Dominate.
          </p>
          <div
            style={{
              marginTop: 5,
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

        <div className="coach-hero-right" style={{ display: "grid", gap: 8, justifyItems: "end" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ width: "clamp(156px, 38vw, 220px)", maxHeight: 146, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <div style={{ maxWidth: "100%", maxHeight: 146 }}>{wordmark}</div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              style={{
                borderRadius: 999,
                border: "none",
                background: "color-mix(in srgb, var(--surface-1) 82%, transparent)",
                color: "var(--text-2)",
                minHeight: 32,
                minWidth: 32,
                padding: 0,
                fontSize: 11,
                cursor: "pointer",
                opacity: 0.86,
                marginTop: 1,
              }}
            >
              ✕
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenTeamBranding}
            className="coach-hero-brand-btn"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid color-mix(in srgb, var(--team-brand-badge-border) 65%, transparent)",
              background: "var(--team-brand-badge-bg)",
              color: "var(--team-brand-badge-text)",
              fontSize: 12,
              fontWeight: 700,
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
