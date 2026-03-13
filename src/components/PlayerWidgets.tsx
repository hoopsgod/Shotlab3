import { useTeamBranding } from "../branding/TeamBrandingProvider";

export default function PlayerWidgets() {
  const { teamName, tokens } = useTeamBranding();

  return (
    <aside
      style={{
        width: "256px",
        background: "var(--surface-1)",
        borderLeft: "1px solid var(--stroke-1)",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "16px", color: tokens.text }}>{teamName} Updates</div>

      <div style={{ marginBottom: "20px", padding: "12px", border: "1px solid var(--stroke-1)", borderRadius: "12px", background: tokens.surface }}>
        <h3 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: tokens.muted, margin: "0 0 8px" }}>Next Workout</h3>
        <p style={{ fontSize: "0.875rem", color: tokens.text, margin: 0 }}>Strength training on March 15, 2026 at 5 PM</p>
      </div>

      <button
        style={{
          width: "100%",
          border: "none",
          borderRadius: "12px",
          padding: "12px 14px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          cursor: "pointer",
          color: "#111",
          background: tokens.primary,
          boxShadow: `0 0 0 1px ${tokens.primarySoft}`,
        }}
      >
        Open Training Plan
      </button>
    </aside>
  );
}
