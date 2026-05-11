import AppHeader from "./AppHeader";

export default function CoachHero({
  heroRef,
  userName,
  wordmark,
  onOpenTeamBranding,
  onLogout,
}) {
  return (
    <div ref={heroRef}>
      <AppHeader
        variant="utility"
        eyebrow={(
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid var(--team-brand-badge-border)",
              background: "var(--team-brand-badge-bg)",
              color: "var(--team-brand-badge-text)",
              borderRadius: 999,
              padding: "4px 9px",
            }}
          >
            Coach mode
          </span>
        )}
        title={(userName || "Demo Coach").toUpperCase()}
        subtitle="Coach identity"
        brandLockup={(
          <div style={{ display: "grid", gap: 10, minWidth: 0, justifyItems: "end" }}>
            <div style={{ maxWidth: "min(320px, 78vw)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 56 }}>
                {wordmark}
              </div>
            </div>
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
          </div>
        )}
        action={{ label: "", icon: "✕", onClick: onLogout, ariaLabel: "Log out" }}
      />
    </div>
  );
}
