import { TeamBrandingProvider, useTeamBranding } from "../../context/TeamBrandingContext";

const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";
const FALLBACK_MARK = "/branding/titans-default-mark.svg";

function ProductSurface({ role, title, subtitle }) {
  const { branding, theme } = useTeamBranding();
  const primary = branding.primaryColor || theme.colors.primary;

  return (
    <article style={{ overflow: "hidden", border: "1px solid rgba(24,32,31,.1)", borderRadius: 20, background: "#fff", boxShadow: "0 14px 34px rgba(31,37,35,.07)" }}>
      <div style={{ height: 7, background: primary }} />
      <div style={{ padding: 18, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 48, height: 48, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: 15, background: `color-mix(in srgb, ${primary} 10%, white)`, border: `1px solid color-mix(in srgb, ${primary} 22%, transparent)`, padding: 8 }}>
              <img src={branding.logoMarkUrl || FALLBACK_MARK} alt="Team logo mark" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#17201e", fontSize: 16, fontWeight: 800, letterSpacing: "-.02em" }}>{title}</div>
              <div style={{ marginTop: 3, color: "#747d77", fontSize: 12, lineHeight: 1.4 }}>{subtitle}</div>
            </div>
          </div>
          <span style={{ flex: "0 0 auto", padding: "6px 9px", borderRadius: 999, background: `color-mix(in srgb, ${primary} 9%, white)`, color: "#26312e", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>{role}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 10 }}>
          <div style={{ minHeight: 94, display: "grid", alignContent: "space-between", padding: 14, borderRadius: 16, background: "#f7f5f0" }}>
            <img src={branding.logoUrl || FALLBACK_LOGO} alt="Team logo" style={{ width: "100%", height: 44, objectFit: "contain", objectPosition: "left center" }} />
            <div style={{ width: "68%", height: 7, borderRadius: 999, background: `color-mix(in srgb, ${primary} 28%, #e8e5de)` }} />
          </div>
          <div style={{ minHeight: 94, display: "grid", alignContent: "space-between", padding: 14, borderRadius: 16, background: `linear-gradient(145deg, color-mix(in srgb, ${primary} 12%, white), #fff)` }}>
            <div style={{ color: "#66706a", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>Primary action</div>
            <div style={{ height: 38, display: "grid", placeItems: "center", borderRadius: 12, background: primary, color: branding.textOnPrimary || "#fff", fontSize: 11, fontWeight: 850 }}>Continue</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function TeamBrandingPreviewContent() {
  const { branding } = useTeamBranding();
  const scale = branding?.textScale || "standard";
  const label = scale === "xl" ? "Extra Large" : scale === "large" ? "Large" : "Default";

  return (
    <div style={{ display: "grid", gap: 14 }} data-testid="branding-live-preview">
      <ProductSurface role="Coach" title="Mission Control" subtitle="Team identity supports decisions without overpowering content." />
      <ProductSurface role="Player" title="Today’s Training" subtitle="The same program identity carries into the athlete experience." />
      <section style={{ padding: 16, border: "1px solid rgba(24,32,31,.1)", borderRadius: 18, background: "#f8f7f3" }}>
        <div style={{ color: "#747d77", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>Typography · {label}</div>
        <div style={{ marginTop: 9, color: "#17201e", fontSize: "calc(23px * var(--coach-text-scale-display))", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-.035em" }}>Clear hierarchy at every size.</div>
        <div style={{ marginTop: 7, color: "#68716c", fontSize: "calc(12px * var(--coach-text-scale-medium))", lineHeight: 1.55 }}>Body, helper, button, input, and navigation text scale together while display headings remain controlled.</div>
      </section>
    </div>
  );
}

export default function TeamBrandingPreview({ branding }) {
  return branding ? <TeamBrandingProvider branding={branding}><TeamBrandingPreviewContent /></TeamBrandingProvider> : <TeamBrandingPreviewContent />;
}
