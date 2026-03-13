import AppHeader from "./AppHeader";

export default function CoachHero({
  heroRef,
  isOverview,
  userName,
  isCoach,
  avatar,
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {avatar}
            {wordmark}
            {isCoach ? (
              <span
                style={{
                  border: "1px solid var(--stroke-1)",
                  borderRadius: 999,
                  fontSize: 8,
                  color: "var(--text-3)",
                  letterSpacing: "var(--tracking-tight)",
                  textTransform: "uppercase",
                  padding: "2px 7px",
                }}
              >
                Coach
              </span>
            ) : null}
          </div>
        )}
        action={{ label: "", icon: "✕", onClick: onLogout, ariaLabel: "Log out" }}
      />
    </div>
  );
}
