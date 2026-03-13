import { useTeamBranding } from "../../context/TeamBrandingContext";

function Card({ title, subtitle }) {
  const { theme } = useTeamBranding();
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        overflow: "hidden",
        background: "#10141c",
      }}
    >
      <div
        style={{
          background: theme.colors.primary,
          color: theme.colors.primaryText,
          padding: "10px 12px",
          fontWeight: 700,
        }}
      >
        {title}
      </div>
      <div style={{ padding: 12, color: "#E5E7EB" }}>
        <div style={{ color: theme.colors.secondary, fontSize: 12, marginBottom: 8 }}>{subtitle}</div>
        <span
          style={{
            display: "inline-block",
            background: theme.colors.badgeBg,
            border: `1px solid ${theme.colors.badgeBorder}`,
            color: theme.colors.badgeText,
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 11,
          }}
        >
          Team Branding Inherited
        </span>
      </div>
    </div>
  );
}

export default function TeamBrandingPreview() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Card title="Coach Preview" subtitle="Coach tools using team branding" />
      <Card title="Player Preview" subtitle="Player experience inherits same team branding" />
    </div>
  );
}
