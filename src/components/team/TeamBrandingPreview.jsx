import { TeamBrandingProvider, useTeamBranding } from "../../context/TeamBrandingContext";

const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";
const FALLBACK_MARK = "/branding/titans-default-mark.svg";

function CoachSurface() {
  const { branding, theme } = useTeamBranding();
  const primary = branding.primaryColor || theme.colors.primary;
  const secondary = branding.secondaryColor || primary;

  return (
    <article
      data-testid="branding-preview-coach"
      style={{
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 22,
        background: `radial-gradient(circle at 95% 0%, color-mix(in srgb, ${primary} 18%, transparent), transparent 34%), linear-gradient(145deg,#242724 0%,#121512 58%,#0b0d0b 100%)`,
        boxShadow: "0 18px 38px rgba(24,30,25,.15)",
        color: "#f8faf5",
      }}
    >
      <div style={{ padding: 17, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 46, height: 46, display: "grid", placeItems: "center", flex: "0 0 auto", padding: 7, border: `1px solid color-mix(in srgb, ${secondary} 26%, transparent)`, borderRadius: 14, background: "rgba(255,255,255,.055)" }}>
              <img src={branding.logoMarkUrl || FALLBACK_MARK} alt="Coach preview team mark" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: secondary, fontSize: 9, fontWeight: 850, letterSpacing: ".11em", textTransform: "uppercase" }}>Coach mode</div>
              <div style={{ marginTop: 3, overflow: "hidden", color: "#f8faf5", fontSize: 18, fontWeight: 820, letterSpacing: "-.035em", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Mission Control</div>
            </div>
          </div>
          <span style={{ flex: "0 0 auto", padding: "6px 8px", border: "1px solid rgba(255,255,255,.09)", borderRadius: 999, background: "rgba(255,255,255,.045)", color: "rgba(248,250,245,.62)", fontSize: 8, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>Live identity</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 9 }}>
          <div style={{ minHeight: 96, display: "grid", alignContent: "space-between", padding: 13, border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, background: "rgba(255,255,255,.04)" }}>
            <div style={{ color: "rgba(248,250,245,.48)", fontSize: 9, fontWeight: 760, letterSpacing: ".08em", textTransform: "uppercase" }}>Team readiness</div>
            <div style={{ color: "#f8faf5", fontSize: 31, fontWeight: 780, letterSpacing: "-.055em" }}>82%</div>
            <div style={{ height: 5, overflow: "hidden", borderRadius: 999, background: "rgba(255,255,255,.08)" }}><span style={{ display: "block", width: "82%", height: "100%", borderRadius: "inherit", background: secondary }} /></div>
          </div>
          <div style={{ minHeight: 96, display: "grid", alignContent: "space-between", padding: 13, border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, background: `color-mix(in srgb, ${primary} 11%, rgba(255,255,255,.025))` }}>
            <div style={{ color: "rgba(248,250,245,.48)", fontSize: 9, fontWeight: 760, letterSpacing: ".08em", textTransform: "uppercase" }}>Next action</div>
            <div style={{ minHeight: 38, display: "grid", placeItems: "center", borderRadius: 12, background: secondary, color: branding.textOnPrimary || "#11140f", fontSize: 10.5, fontWeight: 850 }}>Review team</div>
          </div>
        </div>
      </div>
    </article>
  );
}

function PlayerSurface() {
  const { branding, theme } = useTeamBranding();
  const primary = branding.primaryColor || theme.colors.primary;
  const secondary = branding.secondaryColor || primary;

  return (
    <article data-testid="branding-preview-player" style={{ overflow: "hidden", border: "1px solid rgba(24,32,31,.1)", borderRadius: 22, background: "#fff", boxShadow: "0 14px 34px rgba(31,37,35,.07)" }}>
      <div style={{ height: 6, background: primary }} />
      <div style={{ padding: 17, display: "grid", gap: 15 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#6c746f", fontSize: 9, fontWeight: 850, letterSpacing: ".11em", textTransform: "uppercase" }}>Player today</div>
            <div style={{ marginTop: 4, color: "#17201e", fontSize: 23, fontWeight: 820, letterSpacing: "-.045em" }}>Training Command</div>
          </div>
          <div style={{ width: 50, height: 50, flex: "0 0 auto", display: "grid", placeItems: "center", padding: 8, borderRadius: 16, background: `color-mix(in srgb, ${primary} 9%, white)`, border: `1px solid color-mix(in srgb, ${primary} 19%, transparent)` }}>
            <img src={branding.logoMarkUrl || FALLBACK_MARK} alt="Player preview team mark" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
        </div>

        <div style={{ padding: 13, borderRadius: 16, background: "#f7f5f0" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <strong style={{ color: "#17201e", fontSize: 28, letterSpacing: "-.055em" }}>125</strong>
            <span style={{ color: "#747d77", fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Shots today</span>
          </div>
          <div style={{ height: 5, marginTop: 10, overflow: "hidden", borderRadius: 999, background: "#e7e5de" }}><span style={{ display: "block", width: "72%", height: "100%", borderRadius: "inherit", background: primary }} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <img src={branding.logoUrl || FALLBACK_LOGO} alt="Player preview full team logo" style={{ width: 74, height: 40, objectFit: "contain", objectPosition: "left center" }} />
            <div style={{ minWidth: 0, color: "#68716c", fontSize: 10.5, lineHeight: 1.35 }}>Program identity stays visible without competing with the training task.</div>
          </div>
          <span style={{ width: 35, height: 35, display: "grid", placeItems: "center", borderRadius: 11, background: secondary, color: branding.textOnPrimary || "#11140f", fontSize: 16, fontWeight: 850 }}>→</span>
        </div>
      </div>
    </article>
  );
}

function TeamBrandingPreviewContent() {
  const { branding } = useTeamBranding();
  const scale = branding?.textScale || "standard";
  const label = scale === "xl" ? "Extra Large" : scale === "large" ? "Large" : "Default";
  const palette = [branding.primaryColor, branding.secondaryColor, branding.accentColor].filter(Boolean);

  return (
    <div style={{ display: "grid", gap: 14 }} data-testid="branding-live-preview">
      <CoachSurface />
      <PlayerSurface />
      <section style={{ padding: 16, border: "1px solid rgba(24,32,31,.1)", borderRadius: 18, background: "#f8f7f3" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ color: "#747d77", fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>System tokens</div>
          <div style={{ display: "flex", gap: 5 }}>{palette.map((color, index) => <span key={`${color}-${index}`} style={{ width: 20, height: 8, borderRadius: 999, border: "1px solid rgba(24,32,31,.08)", background: color }} />)}</div>
        </div>
        <div style={{ marginTop: 9, color: "#17201e", fontSize: "calc(22px * var(--coach-text-scale-display))", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-.035em" }}>{label} readability</div>
        <div style={{ marginTop: 7, color: "#68716c", fontSize: "calc(12px * var(--coach-text-scale-medium))", lineHeight: 1.55 }}>Body, helper, button, input, and navigation text scale together while display headings stay controlled.</div>
      </section>
    </div>
  );
}

export default function TeamBrandingPreview({ branding }) {
  return branding ? <TeamBrandingProvider branding={branding}><TeamBrandingPreviewContent /></TeamBrandingProvider> : <TeamBrandingPreviewContent />;
}
