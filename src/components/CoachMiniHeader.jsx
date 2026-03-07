import Button from "./ui/Button";
import { TeamLogo } from "./TeamBranding";
import BrandLogo from "./BrandLogo";
const FD="'Bebas Neue','Impact','Arial Black',sans-serif";
const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

const GearIcon = ({ size = 16 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h0a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h0a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v0a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
  </svg>
);

const CloseIcon = ({ size = 16 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

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
          background: "var(--surface-2)",
          boxShadow: "var(--shadow-1)",
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          alignItems: "center",
          gap: 8,
          padding: "0 10px 0 12px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <BrandLogo compact brandName="Shotlab" />
          <span style={{ fontFamily: FD, fontSize: 10, letterSpacing: "var(--tracking-tight)", color: "var(--text-2)", textTransform: "uppercase", border: "1px solid var(--stroke-1)", borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap" }}>Coach Mode</span>
          {avatar}
          {logoUrl && branding?.showHeaderLogo !== false ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px", borderRadius: 999, background: accentColor ? `${accentColor}1A` : "rgba(255,255,255,0.06)", border: accentColor ? `1px solid ${accentColor}40` : "1px solid var(--stroke-1)", minWidth: 0 }}>
              <TeamLogo logoUrl={logoUrl} teamName={teamName} size={24} primaryColor={branding?.primaryColor || accentColor} badgeStyle={branding?.badgeStyle || "round"} />
              {teamName ? <span style={{ fontFamily: FB, fontSize: 9, color: "var(--text-1)", textTransform: "uppercase", letterSpacing: "var(--tracking-tight)", fontWeight: 700, maxWidth: 84, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{teamName}</span> : null}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ opacity: 0.85 }}>{wordmark}</div>
          <Button type="button" aria-label="Open settings" onClick={onOpenSettings} variant="tertiary" iconOnly className="coach-icon-btn" style={{ border: `1px solid ${borderColor}`, color: "var(--text-secondary)", opacity: 0.9 }}>
            <GearIcon />
          </Button>
          <Button type="button" aria-label="Log out" onClick={onLogout} variant="tertiary" iconOnly className="coach-icon-btn" style={{ border: `1px solid ${borderColor}`, color: mutedColor, opacity: 0.9 }}>
            <CloseIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
