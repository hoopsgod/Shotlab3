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
      className="coach-hero"
      style={{
        position: "relative",
        marginBottom: 18,
        minHeight: "clamp(300px, 64vw, 336px)",
      }}
    >
      <style>{`
        .coach-hero-left{position:absolute;top:24px;left:24px;max-width:52%;}
        .coach-hero-right{position:absolute;top:42px;right:24px;width:40%;display:flex;flex-direction:column;align-items:flex-end;}
        .coach-hero-wordmark{width:clamp(128px,34vw,178px);max-height:150px;display:flex;align-items:center;justify-content:center;}
        .coach-hero-wordmark > *{max-width:100%;max-height:150px;}
        .coach-hero-brand-btn{margin-top:14px;max-width:220px;width:max-content;}
        .coach-hero-close{position:absolute;top:70px;right:16px;}
        @media (min-width: 920px){
          .coach-hero{min-height:270px;}
          .coach-hero-left{max-width:58%;}
          .coach-hero-right{width:32%;right:28px;}
          .coach-hero-close{right:22px;top:52px;}
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-24px -14px auto",
          height: 140,
          pointerEvents: "none",
          background: "linear-gradient(130deg, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 46%), radial-gradient(75% 85% at 10% 25%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 72%), radial-gradient(65% 80% at 92% 8%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)",
          filter: "blur(6px)",
          opacity: 0.9,
        }}
      />
      <div style={{ position: "relative", height: "100%" }}>
        <div className="coach-hero-left" style={{ minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid var(--team-brand-badge-border)",
              background: "color-mix(in srgb, var(--team-brand-badge-bg) 88%, transparent)",
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
              margin: "8px 0 0",
              fontSize: "clamp(34px, 7.6vw, 56px)",
              lineHeight: 0.94,
              color: "var(--text-1)",
              fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif",
              letterSpacing: "var(--tracking-default)",
              textTransform: "uppercase",
            }}
          >
            {(userName || "Demo Coach").toUpperCase()}
          </h1>
          <p style={{ margin: "8px 0 0", color: "var(--text-2)", fontSize: 13, letterSpacing: "0.03em", textTransform: "uppercase" }}>
            Lead. Develop. Dominate.
          </p>
          <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)", paddingBottom: 4 }}>
            <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 999, border: "1px solid color-mix(in srgb, var(--accent) 36%, var(--stroke-1))", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 9 }}>✓</span>
            Coach identity
          </div>
        </div>

        <div className="coach-hero-right">
          <div className="coach-hero-wordmark">
              {wordmark}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
            <button
              type="button"
              onClick={onOpenTeamBranding}
              className="coach-hero-brand-btn"
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid var(--team-brand-badge-border)",
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
        <button type="button" onClick={onLogout} aria-label="Log out" className="coach-hero-close" style={{ borderRadius: 999, border: "1px solid var(--team-brand-border, var(--stroke-1))", background: "color-mix(in srgb, var(--surface-1) 88%, transparent)", color: "var(--text-2)", minHeight: 34, minWidth: 34, padding: 0, fontSize: 11, cursor: "pointer", opacity: 0.84 }}>
          ✕
        </button>
      </div>
    </section>
  );
}
