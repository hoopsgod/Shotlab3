import { useTeamBranding } from "../../context/TeamBrandingContext";

function PreviewCard({ title, subtitle }) {
  const { branding } = useTeamBranding();

  return (
    <div
      style={{
        border: `1px solid ${branding.secondaryColor}`,
        borderRadius: 12,
        padding: 12,
        background: "#10131A",
      }}
    >
      <div
        style={{
          background: branding.primaryColor,
          color: branding.textOnPrimary,
          borderRadius: 10,
          padding: "8px 10px",
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {branding.logoMarkUrl ? (
          <img src={branding.logoMarkUrl} alt="Team mark" style={{ width: 18, height: 18, objectFit: "contain" }} />
        ) : (
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: branding.accentColor,
              display: "inline-block",
            }}
          />
        )}
        <span>{title}</span>
      </div>
      <div style={{ color: "#E5E7EB", fontSize: 12, marginBottom: 8 }}>{subtitle}</div>
      <button
        type="button"
        style={{
          background: branding.accentColor,
          color: "#0B0D10",
          border: 0,
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        Action
      </button>
    </div>
  );
}

export default function TeamBrandingPreview() {
  const { branding } = useTeamBranding();

  return (
    <section>
      <h3 style={{ margin: "0 0 10px", color: "#fff", fontSize: 14 }}>Preview</h3>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <PreviewCard title="Coach Preview" subtitle="Coach shell uses team branding tokens." />
        <PreviewCard title="Player Preview" subtitle="Players inherit the same team branding automatically." />
      </div>
      {branding.logoUrl ? (
        <img src={branding.logoUrl} alt="Team logo" style={{ marginTop: 10, maxHeight: 40, objectFit: "contain" }} />
      ) : null}
    </section>
  );
}
