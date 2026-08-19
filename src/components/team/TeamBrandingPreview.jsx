import { TeamBrandingProvider, useTeamBranding } from "../../context/TeamBrandingContext";
import TeamIdentityTitleStage from "../TeamIdentityTitleStage.jsx";

function TeamBrandingPreviewContent() {
  const { branding } = useTeamBranding();
  const scale = branding?.textScale || "standard";
  const label = scale === "xl" ? "Extra Large" : scale === "large" ? "Large" : "Default";
  return <div style={{ display: "grid", gap: 14 }} data-testid="branding-live-preview">
    <div style={{ overflow: "hidden", borderRadius: 20, boxShadow: "0 16px 34px rgba(4,18,25,.18)" }}>
      <TeamIdentityTitleStage variant="hero" brandTreatment="hero" surface="dark" role="Coach Mode" title="Mission Control" personName="Coach preview" summary="Program identity and decision authority share one opening system." testId="branding-preview-coach-title" ariaLabel="Coach title stage preview" />
    </div>
    <div style={{ overflow: "hidden", border: "1px solid rgba(24,32,31,.1)", borderRadius: 20, background: "#f8f6ee", padding: "0 16px" }}>
      <TeamIdentityTitleStage variant="editorial" brandTreatment="compact" surface="light" role="Player" title="Program Training" summary="The same program identity carries into the athlete experience without competing with the destination." status="Coach plan active" testId="branding-preview-player-title" ariaLabel="Player title stage preview" />
    </div>
    <section style={{ padding: 16, border: "1px solid rgba(24,32,31,.1)", borderRadius: 18, background: "#f8f7f3" }}>
      <div style={{ color: "#747d77", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>Typography · {label}</div>
      <div style={{ marginTop: 9, color: "#17201e", fontSize: "calc(23px * var(--coach-text-scale-display))", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-.035em" }}>One program. Coach and player.</div>
      <div style={{ marginTop: 7, color: "#68716c", fontSize: "calc(12px * var(--coach-text-scale-medium))", lineHeight: 1.55 }}>Team color personalizes identity accents while ShotLab keeps body text, status, actions, and navigation readable.</div>
    </section>
  </div>;
}

export default function TeamBrandingPreview({ branding }) {
  return branding ? <TeamBrandingProvider branding={branding}><TeamBrandingPreviewContent /></TeamBrandingProvider> : <TeamBrandingPreviewContent />;
}
