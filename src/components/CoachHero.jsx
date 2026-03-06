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
  logoUrl,
  teamName,
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
        border: `1px solid ${accentColor ? `${accentColor}66` : "var(--stroke-2)"}`,
        borderRadius: "var(--radius-card)",
        background: accentColor
          ? `linear-gradient(130deg, ${accentColor}1F 0%, var(--surface-3) 56%)`
          : "var(--surface-3)",
        boxShadow: accentColor
          ? `0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px ${accentColor}22, 0 14px 36px ${accentColor}24`
          : "var(--shadow-2)",
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
          {logoUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "6px 10px", borderRadius: 999, background: accentColor ? `${accentColor}1A` : "rgba(255,255,255,0.06)", border: accentColor ? `1px solid ${accentColor}55` : "1px solid var(--stroke-1)", width: "fit-content" }}>
              <img src={logoUrl} alt="Team logo" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover", border: accentColor ? `1px solid ${accentColor}88` : "1px solid var(--stroke-1)", boxShadow: accentColor ? `0 0 0 3px ${accentColor}29` : "none" }} />
              <span style={{ fontFamily: FB, color: "var(--text-1)", fontSize: 11, letterSpacing: "var(--tracking-tight)", textTransform: "uppercase", fontWeight: 700 }}>{teamName || "Team Identity"}</span>
            </div>
          ) : null}
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
