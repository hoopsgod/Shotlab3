const FD="'Bebas Neue','Impact','Arial Black',sans-serif";
const FB="'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

export default function CoachMiniHeader({ visible, avatar, wordmark, borderColor, mutedColor, onLogout }) {
  return (
    <div
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
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
    >
      <div
        style={{
          height: "clamp(52px, 7.8vw, 60px)",
          borderRadius: 14,
          border: `1px solid color-mix(in srgb, ${borderColor} 58%, var(--stroke-1))`,
          background: "linear-gradient(170deg, color-mix(in srgb, var(--surface-1) 92%, #000) 0%, var(--surface-2) 100%)",
          boxShadow: "var(--shadow-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          backdropFilter: "blur(8px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 85% 12%, color-mix(in srgb, var(--accent-soft) 72%, transparent) 0%, transparent 60%)", opacity: 0.55 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1 }}>
          <span style={{ fontFamily: FD, fontSize: 11, letterSpacing: "var(--tracking-tight)", color: "var(--text-2)", textTransform: "uppercase", border: "1px solid var(--stroke-1)", borderRadius: 999, padding: "4px 8px" }}>Coach Mode</span>
          {avatar}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, position: "relative", zIndex: 1 }}>{wordmark}</div>
        <button
          aria-label="Log out"
          onClick={onLogout}
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.01))",
            border: `1px solid color-mix(in srgb, ${borderColor} 55%, var(--stroke-1))`,
            borderRadius: 10,
            color: mutedColor,
            width: 32,
            height: 32,
            cursor: "pointer",
            fontFamily: FB,
            fontSize: 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
