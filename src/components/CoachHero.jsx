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
                color: "var(--text-3)",
                letterSpacing: "var(--tracking-tight)",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Team identity
            </span>
            <div
              style={{
                border: "1px solid color-mix(in srgb, var(--team-brand-border, var(--stroke-2)) 44%, transparent)",
                borderRadius: 14,
                background: "color-mix(in srgb, var(--team-brand-surface, var(--surface-1)) 84%, transparent)",
                padding: "8px 12px",
                minHeight: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--team-brand-accent, var(--accent)) 10%, transparent)",
                maxWidth: "min(300px, 74vw)",
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
