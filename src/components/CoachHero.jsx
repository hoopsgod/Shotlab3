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
  onLogout,
}) {
  const mobilePadding = isOverview ? "12px 12px" : "10px 12px";
  const desktopPadding = isOverview ? "14px 14px" : "10px 14px";

  return (
    <div
      ref={heroRef}
      style={{
        marginBottom: isOverview ? 10 : 8,
        padding: mobilePadding,
        border: `1px solid ${accentColor}2a`,
        borderRadius: 18,
        background:
          "linear-gradient(135deg, rgba(200,255,0,0.12) 0%, rgba(10,10,10,0.94) 45%, rgba(10,10,10,0.98) 100%)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
      }}
    >
      <style>{`@media (min-width: 768px) {.coach-hero{padding:${desktopPadding};}}`}</style>
      <div className="coach-hero" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: 10, letterSpacing: "var(--tracking-tight)", opacity: 0.96, textTransform: "uppercase", color: "var(--text-secondary)" }}>COACH MODE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            <div style={{ fontFamily: FD, color: "#fff", fontSize: isOverview ? 26 : 23, letterSpacing: "var(--tracking-default)", lineHeight: 1.02 }}>{(userName || "Demo Coach").toUpperCase()}</div>
            {isCoach && (
              <span
                style={{
                  background: "rgba(200, 255, 0, 0.16)",
                  border: "1px solid rgba(200, 255, 0, 0.65)",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 8,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-tight)",
                  color: "#D9FF5C",
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
