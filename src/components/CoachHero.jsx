import { TeamIdentity, TeamWatermark } from "./TeamBranding";
import Button from "./ui/Button";
const FD="'Bebas Neue','Impact','Arial Black',sans-serif";
const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

function IconButton({ label, onClick, children, borderColor, color }) {
  return (
    <Button
      type="button"
      aria-label={label}
      onClick={onClick}
      variant="tertiary"
      iconOnly
      className="coach-icon-btn"
      style={{ borderColor, color, opacity: 0.9 }}
    >
      {children}
    </Button>
  );
}

const GearIcon = ({ size = 18 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h0a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h0a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v0a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
  </svg>
);

const CloseIcon = ({ size = 18 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

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
        background: "var(--surface-2)",
        boxShadow: "var(--shadow-1)",
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
                    color: "var(--text-2)",
                    opacity: 0.82,
                    fontSize: 10,
                    textTransform: "none",
                    letterSpacing: "0.01em",
                    lineHeight: 1.35,
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
                      color: "var(--text-2)",
                      opacity: 0.72,
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
            <IconButton label="Open settings" onClick={onOpenSettings} borderColor={borderColor} color="var(--text-secondary)">
              <GearIcon />
            </IconButton>
            <IconButton label="Log out" onClick={onLogout} borderColor={borderColor} color={mutedColor}>
              <CloseIcon />
            </IconButton>
          </div>
        </div>

        {branding?.showHeaderLogo !== false ? (
          <div style={{ marginTop: 4 }}>
            <TeamIdentity
              branding={branding || { logoUrl, primaryColor: accentColor, secondaryColor: accentColor, badgeStyle: "shield" }}
              teamName={teamName}
              mascotName={branding?.mascotName}
              motto={branding?.motto}
              mode="balanced"
              compact={branding?.brandingMode === "compact"}
              showLogo={branding?.showHeaderLogo !== false}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
