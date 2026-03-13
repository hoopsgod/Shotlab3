import AppHeader from "./AppHeader";

export default function CoachHero({
  heroRef,
  userName,
  wordmark,
  onLogout,
}) {
  return (
    <div ref={heroRef}>
      <AppHeader
        variant="branded"
        eyebrow="Coach mode"
        title={(userName || "Demo Coach").toUpperCase()}
        subtitle="Lead the squad. Track momentum. Build consistency."
        brandLockup={(
          <div style={{ display: "grid", gap: 6, minWidth: 0, justifyItems: "end" }}>
            <span
              style={{
                fontSize: 9,
                color: "var(--team-brand-badge-text, var(--text-3))",
                letterSpacing: "var(--tracking-tight)",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Team identity
            </span>
            <div
              style={{
                border: "1px solid var(--team-brand-badge-border, var(--stroke-2))",
                borderRadius: 14,
                background: "linear-gradient(180deg, color-mix(in srgb, var(--team-brand-badge-bg, transparent) 62%, transparent), color-mix(in srgb, var(--surface-1) 76%, transparent))",
                padding: "10px 12px",
                minHeight: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "min(260px, 72vw)",
              }}
            >
              {wordmark}
            </div>
          </div>
        )}
        action={{ label: "", icon: "✕", onClick: onLogout, ariaLabel: "Log out" }}
      />
    </div>
  );
}
