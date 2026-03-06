const FD="'Bebas Neue','Impact','Arial Black',sans-serif";
const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

export default function CoachHero({
  heroRef,
  isOverview,
  userName,
  isCoach,
  accentColor,
  borderColor,
  mutedColor,
  avatar,
  wordmark,
  onOpenSettings,
  onLogout,
}) {
  const mobilePadding = isOverview ? "12px 12px" : "10px 12px";
  const desktopPadding = isOverview ? "14px 14px" : "10px 14px";

  return (
    <div
      ref={heroRef}
      style={{
        marginBottom: "var(--stack-gap)",
        padding: mobilePadding,
        border: "1px solid var(--stroke-2)",
        borderRadius: "var(--radius-card)",
        background: "var(--surface-3)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .coach-hero { padding:${desktopPadding}; }
        }
        @media (hover: hover) and (pointer: fine) {
          .coach-hero-wrap { transition: transform 150ms ease, box-shadow 150ms ease; }
          .coach-hero-wrap:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(0,0,0,0.50); }
        }
      `}</style>
      <div className="coach-hero coach-hero-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: 10, letterSpacing: "var(--tracking-tight)", opacity: 0.96, textTransform: "uppercase", color: "var(--text-secondary)" }}>COACH MODE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            <div style={{ fontFamily: FD, color: "#fff", fontSize: isOverview ? 26 : 23, letterSpacing: "var(--tracking-default)", lineHeight: 1.02 }}>{(userName || "Demo Coach").toUpperCase()}</div>
            {isCoach && (
              <span
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--stroke-1)",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-tight)",
                  color: "var(--text-2)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                COACH
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: FB,
              color: "var(--text-secondary)",
              fontSize: isOverview ? 9 : 8,
              letterSpacing: "var(--tracking-tight)",
              fontWeight: 600,
              marginTop: 3,
              lineHeight: 1.2,
              textTransform: "uppercase",
              maxWidth: 360,
            }}
          >
            Lead the squad. Track momentum. Build consistency.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
          {avatar}
          {wordmark}
          <button
            type="button"
            aria-label="Open settings"
            onClick={onOpenSettings}
            style={{
              background: "rgba(20,20,20,0.95)",
              border: `1px solid ${borderColor}`,
              borderRadius: 12,
              color: "var(--text-secondary)",
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
            ⚙
          </button>
          <button
            type="button"
            aria-label="Log out"
            onClick={onLogout}
            style={{
              background: "rgba(20,20,20,0.95)",
              border: `1px solid ${borderColor}`,
              borderRadius: 12,
              color: mutedColor,
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
      </div>
    </div>
  );
}
