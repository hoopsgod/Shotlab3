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
        padding: "8px 0 4px",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-24px -14px auto",
          height: 140,
          pointerEvents: "none",
          background: "radial-gradient(75% 85% at 10% 25%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 72%), radial-gradient(65% 80% at 92% 8%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)",
          filter: "blur(6px)",
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 240px" }}>
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
              margin: "10px 0 0",
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
          <p style={{ margin: "8px 0 0", color: "var(--text-2)", fontSize: 12, letterSpacing: "0.03em", textTransform: "uppercase" }}>
            Coach identity
          </p>
        </div>

        <div style={{ display: "grid", gap: 10, justifyItems: "end", flex: "0 1 320px", marginLeft: "auto", maxWidth: "100%" }}>
          <div style={{ minWidth: "min(200px, 62vw)", maxWidth: "min(320px, 72vw)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52,
                padding: "4px 8px",
                borderRadius: 14,
                border: "1px solid color-mix(in srgb, var(--team-brand-border, var(--stroke-1)) 58%, transparent)",
                background: "linear-gradient(140deg, color-mix(in srgb, var(--surface-1) 78%, transparent), color-mix(in srgb, var(--surface-2) 78%, transparent))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {wordmark}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onOpenTeamBranding}
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
            <button type="button" onClick={onLogout} aria-label="Log out" style={{ borderRadius: 999, border: "1px solid var(--team-brand-border, var(--stroke-1))", background: "color-mix(in srgb, var(--surface-1) 88%, transparent)", color: "var(--text-2)", minHeight: 34, minWidth: 34, padding: 0, fontSize: 11, cursor: "pointer", opacity: 0.84 }}>
              ✕
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
