const FD="'Bebas Neue','Impact','Arial Black',sans-serif";
const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

export default function CoachMiniHeader({ visible, avatar, wordmark, borderColor, mutedColor, onOpenSettings, onLogout }) {
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
          height: "clamp(52px, 7.8vw, 60px)",
          borderRadius: 12,
          border: `1px solid ${borderColor}`,
          background: "rgba(10, 10, 10, 0.92)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FD, fontSize: 11, letterSpacing: "var(--tracking-tight)", color: "var(--text-2)", textTransform: "uppercase", border: "1px solid var(--stroke-1)", borderRadius: 999, padding: "4px 8px" }}>Coach Mode</span>
          {avatar}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>{wordmark}</div>
        <button
          type="button"
          aria-label="Open settings"
          onClick={onOpenSettings}
          style={{
            background: "rgba(20,20,20,0.95)",
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            color: "var(--text-secondary)",
            width: 32,
            height: 32,
            cursor: "pointer",
            fontFamily: FB,
            fontSize: 12,
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
            borderRadius: 10,
            color: "var(--text-secondary)",
            width: 32,
            height: 32,
            cursor: "pointer",
            fontFamily: FB,
            fontSize: 12,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
