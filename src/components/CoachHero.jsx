import { TeamIdentity, TeamWatermark } from "./TeamBranding";
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
  branding,
  onOpenSettings,
  onLogout,
}) {
  const mobilePadding = isOverview ? "9px 12px 7px" : "8px 12px 6px";
  const desktopPadding = isOverview ? "10px 14px 8px" : "8px 14px 7px";

  return (
    <div
      ref={heroRef}
      style={{
        marginBottom: "var(--stack-gap)",
        padding: mobilePadding,
        border: `1px solid ${accentColor ? `${accentColor}52` : "var(--stroke-2)"}`,
        borderRadius: "var(--radius-card)",
        background: accentColor
          ? `linear-gradient(140deg, ${accentColor}17 0%, var(--surface-3) 54%)`
          : "var(--surface-3)",
        boxShadow: accentColor
          ? `0 10px 22px rgba(0,0,0,0.42), 0 0 0 1px ${accentColor}12`
          : "var(--shadow-2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .coach-hero { padding:${desktopPadding}; }
        }
      `}</style>
      {branding?.showWatermark ? (
        <TeamWatermark logoUrl={logoUrl} primaryColor={branding?.primaryColor || accentColor} opacity={0.014} size={190} />
      ) : null}
      <div className="coach-hero" style={{ position: "relative", zIndex: 1, display: "grid", gap: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1 }}>
              {avatar}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FD,
                    color: "#fff",
                    fontSize: isOverview ? 24 : 22,
                    letterSpacing: "var(--tracking-default)",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {(userName || "Demo Coach").toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: FB,
                    color: "var(--text-3)",
                    opacity: 0.74,
                    fontSize: 8,
                    textTransform: "uppercase",
                    letterSpacing: "var(--tracking-tight)",
                    marginTop: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{isCoach ? "Head coach" : "Team staff"}</span>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "1px 6px",
                      border: "1px solid var(--stroke-1)",
                      background: "rgba(255,255,255,0.01)",
                      color: "var(--text-3)",
                      opacity: 0.58,
                    }}
                  >
                    Coach mode
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ opacity: 0.72 }}>{wordmark}</div>
            <button
              type="button"
              aria-label="Open settings"
              onClick={onOpenSettings}
              style={{
                background: "rgba(20,20,20,0.88)",
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                color: "var(--text-secondary)",
                width: 34,
                height: 34,
                cursor: "pointer",
                fontSize: 12,
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
                background: "rgba(20,20,20,0.88)",
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                color: mutedColor,
                width: 34,
                height: 34,
                cursor: "pointer",
                fontSize: 12,
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

        <div style={{ marginTop: 0, padding: "5px 10px", borderRadius: 12, border: `1px solid ${accentColor ? `${accentColor}26` : "var(--stroke-1)"}`, background: accentColor ? `${accentColor}07` : "rgba(255,255,255,0.02)", maxWidth: "min(100%,460px)" }}>
          <TeamIdentity
            branding={branding || { logoUrl, primaryColor: accentColor, secondaryColor: accentColor }}
            teamName={teamName}
            mascotName={branding?.mascotName}
            motto={branding?.motto}
            mode="balanced"
            compact={branding?.brandingMode === "compact"}
            showLogo={branding?.showHeaderLogo !== false}
          />
        </div>
      </div>
    </div>
  );
}
