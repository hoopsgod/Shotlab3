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
                border: "1px solid var(--stroke-2)",
                borderRadius: 14,
                background: "color-mix(in srgb, var(--surface-1) 70%, transparent)",
                padding: "10px 14px",
                minHeight: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "min(280px, 72vw)",
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
