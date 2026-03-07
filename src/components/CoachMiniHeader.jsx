import { TeamLogo } from "./TeamBranding";
const FD="'Bebas Neue','Impact','Arial Black',sans-serif";
const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

export default function CoachMiniHeader({ visible, avatar, wordmark, borderColor, mutedColor, logoUrl, teamName, accentColor, branding, onOpenSettings, onLogout }) {
  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 25,
        paddingTop: "max(env(safe-area-inset-top), 6px)",
        paddingLeft: 12,
        paddingRight: 12,
        pointerEvents: visible ? "auto" : "none",
        visibility: visible ? "visible" : "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        transition: "opacity 200ms ease, transform 200ms ease, visibility 0s linear " + (visible ? "0s" : "200ms"),
      }}
    >
      <div
        style={{
          height: "clamp(50px, 7.6vw, 62px)",
          borderRadius: 12,
          border: accentColor ? `1px solid ${accentColor}55` : `1px solid ${borderColor}`,
          background: accentColor ? `linear-gradient(120deg, ${accentColor}1C 0%, rgba(10,10,10,0.95) 55%)` : "rgba(10, 10, 10, 0.93)",
          boxShadow: accentColor ? `0 4px 12px rgba(0,0,0,0.24), 0 0 0 1px ${accentColor}18` : "0 4px 12px rgba(0,0,0,0.24)",
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          alignItems: "center",
          gap: 8,
          padding: "0 10px 0 12px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontFamily: FD, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: "var(--text-2)", textTransform: "uppercase", border: "1px solid var(--stroke-1)", borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap" }}>Coach Mode</span>
          {avatar}
          {logoUrl && branding?.showHeaderLogo !== false ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px", borderRadius: 999, background: accentColor ? `${accentColor}1A` : "rgba(255,255,255,0.06)", border: accentColor ? `1px solid ${accentColor}40` : "1px solid var(--stroke-1)", minWidth: 0 }}>
              <TeamLogo logoUrl={logoUrl} teamName={teamName} size={24} primaryColor={branding?.primaryColor || accentColor} badgeStyle={branding?.badgeStyle || "round"} />
              {teamName ? <span style={{ fontFamily: FB, fontSize: 12, color: "var(--text-1)", textTransform: "uppercase", letterSpacing: "0.03em", fontWeight: 700, maxWidth: 84, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{teamName}</span> : null}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ opacity: 0.85 }}>{wordmark}</div>
          <button type="button" aria-label="Open settings" onClick={onOpenSettings} style={{ background: "rgba(20,20,20,0.9)", border: `1px solid ${borderColor}`, borderRadius: 10, color: "var(--text-secondary)", width: 31, height: 31, cursor: "pointer", fontFamily: FB, fontSize: 11 }}>
            ⚙
          </button>
          <button type="button" aria-label="Log out" onClick={onLogout} style={{ background: "rgba(20,20,20,0.9)", border: `1px solid ${borderColor}`, borderRadius: 10, color: mutedColor, width: 31, height: 31, cursor: "pointer", fontFamily: FB, fontSize: 11 }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
