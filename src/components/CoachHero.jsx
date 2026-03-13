import AppHeader from "./AppHeader";

export default function CoachHero({
  heroRef,
  userName,
  avatar,
  wordmark,
  onLogout,
}) {
  return (
    <div ref={heroRef} style={{ marginBottom: "var(--stack-gap)" }}>
      <AppHeader
        variant="branded"
        eyebrow="COACH MODE"
        title={(userName || "Demo Coach").toUpperCase()}
        subtitle="Lead the squad. Track momentum. Build consistency."
        rightSlot={(
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {avatar}
            {wordmark}
            <button
              aria-label="Log out"
              onClick={onLogout}
              style={{
                background: "rgba(20,20,20,0.95)",
                border: "1px solid var(--stroke-1)",
                borderRadius: 12,
                color: "var(--text-2)",
                width: 38,
                height: 38,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        )}
      />
    </div>
  );
}
