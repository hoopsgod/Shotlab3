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
        marginBottom: 8,
        padding: "2px 0",
      }}
    >
      <style>{`
        .coach-hero-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
        .coach-hero-brand-btn{width:max-content;max-width:220px;transition:box-shadow 260ms ease, filter 260ms ease;}
        .coach-hero-brand-btn:hover{box-shadow:0 8px 20px color-mix(in srgb, var(--accent) 18%, transparent);filter:brightness(1.03);}
        @media (max-width: 640px){
          .coach-hero-row{gap:8px;}
        }
        @media (prefers-reduced-motion: reduce){
          .coach-hero-brand-btn{transition:none;}
        }
      `}</style>

      <div className="coach-hero-row">
        <div style={{ minWidth: 0, flex: 1 }}>
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
              fontSize: "clamp(34px, 8.1vw, 56px)",
              lineHeight: 0.93,
              color: "var(--text-1)",
              fontFamily: "'Bebas Neue','Impact','Arial Black',sans-serif",
              letterSpacing: "var(--tracking-default)",
              textTransform: "uppercase",
            }}
          >
            {(userName || "Demo Coach").toUpperCase()}
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--text-2)", fontSize: 13, letterSpacing: "0.035em", textTransform: "uppercase" }}>
            Lead. Develop. Dominate.
          </p>
          <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-3)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 9 }}>✓</span>
            Coach identity
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexShrink: 0 }}>
          <div style={{ width: "clamp(150px, 36vw, 208px)", maxHeight: 136, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <div style={{ maxWidth: "100%", maxHeight: 136 }}>{wordmark}</div>
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
              marginTop: 2,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
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
    </section>
  );
}
