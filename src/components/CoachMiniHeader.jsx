import ShotLabIcon from "./ShotLabIcon";

const SYSTEM_FONT="-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif";

export default function CoachMiniHeader({ visible, avatar, wordmark, borderColor, mutedColor, onLogout }) {
  if (!visible) return null;

  return (
    <div
      data-testid="coach-mini-header"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 25,
        paddingTop: "max(env(safe-area-inset-top), 8px)",
        paddingLeft: 12,
        paddingRight: 12,
        pointerEvents: "none",
        animation: "coachMiniHeaderIn 180ms ease-out",
      }}
    >
      <div
        style={{
          width: "min(620px, 100%)",
          minHeight: 54,
          margin: "0 auto",
          borderRadius: 18,
          border: `1px solid ${borderColor || "rgba(17,26,33,.11)"}`,
          background: "rgba(250,249,245,.88)",
          boxShadow: "0 12px 34px rgba(17,26,33,.13), inset 0 1px rgba(255,255,255,.78)",
          display: "grid",
          gridTemplateColumns: "auto minmax(0,1fr) auto",
          alignItems: "center",
          padding: "7px 8px 7px 10px",
          WebkitBackdropFilter: "blur(24px) saturate(145%)",
          backdropFilter: "blur(24px) saturate(145%)",
          gap: 10,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {avatar}
          <span style={{ fontFamily: SYSTEM_FONT, fontSize: 10, letterSpacing: ".055em", color: "var(--accent-strong,#617900)", textTransform: "uppercase", fontWeight: 750, lineHeight: 1.1 }}>Coach</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0, overflow: "hidden" }}>{wordmark}</div>
        <button
          type="button"
          aria-label="Log out"
          onClick={onLogout}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,.72)",
            border: `1px solid ${borderColor || "rgba(17,26,33,.11)"}`,
            borderRadius: 12,
            color: mutedColor || "var(--text-2,#44515b)",
            width: 40,
            height: 40,
            cursor: "pointer",
            fontFamily: SYSTEM_FONT,
          }}
        >
          <ShotLabIcon name="logout" size={17} />
        </button>
      </div>
    </div>
  );
}
