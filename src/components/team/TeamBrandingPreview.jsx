import { TeamBrandingProvider, useTeamBranding } from "../../context/TeamBrandingContext";

function LogoStack() {
  const { branding, theme } = useTeamBranding();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 88px",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
      }}
    >
      <div
        style={{
          minHeight: 48,
          borderRadius: 10,
          background: "rgba(11,13,16,0.72)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "6px 10px",
        }}
      >
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Team logo" style={{ maxWidth: "100%", maxHeight: 30, objectFit: "contain" }} />
        ) : (
          <span style={{ color: "rgba(229,231,235,0.68)", fontSize: 11, letterSpacing: 0.4 }}>Full Logo</span>
        )}
      </div>
      <div
        style={{
          height: 48,
          borderRadius: 10,
          background: "rgba(11,13,16,0.86)",
          border: `1px solid ${theme.colors.badgeBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: 8,
        }}
      >
        {branding.logoMarkUrl ? (
          <img src={branding.logoMarkUrl} alt="Team logo mark" style={{ maxWidth: "100%", maxHeight: 24, objectFit: "contain" }} />
        ) : (
          <span style={{ color: theme.colors.badgeText, fontSize: 11, fontWeight: 600 }}>Mark</span>
        )}
      </div>
    </div>
  );
}

function PreviewCard({ title, subtitle, chip }) {
  const { theme } = useTeamBranding();

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        overflow: "hidden",
        background: "linear-gradient(180deg, #131824 0%, #0F131D 100%)",
      }}
    >
      <div
        style={{
          background: `linear-gradient(90deg, ${theme.colors.primarySoft}, rgba(11,13,16,0.75))`,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          color: "#E5E7EB",
          padding: "11px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>{title}</div>
          <div style={{ color: "rgba(229,231,235,0.64)", fontSize: 11, lineHeight: 1.35, overflowWrap: "anywhere" }}>{subtitle}</div>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: theme.colors.badgeBg,
            border: `1px solid ${theme.colors.badgeBorder}`,
            color: theme.colors.badgeText,
            minHeight: 22,
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {chip}
        </span>
      </div>
      <div style={{ padding: 14 }}>
        <LogoStack />
      </div>
    </div>
  );
}

function TeamBrandingPreviewContent() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ color: "#E5E7EB", fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>App Preview Surfaces</div>
        <div style={{ color: "#9CA3AF", fontSize: 12 }}>Branding applied consistently across coach and player experiences.</div>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <PreviewCard title="Coach App Preview" subtitle="Command center header and branded UI" chip="Coach" />
        <PreviewCard title="Player App Preview" subtitle="Training and feed views with shared identity" chip="Player" />
      </div>
    </div>
  );
}

export default function TeamBrandingPreview({ branding }) {
  if (branding) {
    return (
      <TeamBrandingProvider branding={branding}>
        <TeamBrandingPreviewContent />
      </TeamBrandingProvider>
    );
  }

  return <TeamBrandingPreviewContent />;
}
