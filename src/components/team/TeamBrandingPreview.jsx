import { TeamBrandingProvider, useTeamBranding } from "../../context/TeamBrandingContext";
import TeamIdentityTitleStage from "../TeamIdentityTitleStage.jsx";

function ProductSurface({ role, title, eyebrow, subtitle, surface = "light" }) {
  return (
    <article style={{ overflow: "hidden", border: "1px solid rgba(24,32,31,.1)", borderRadius: 22, background: surface === "dark" ? "#071b24" : "#fff", boxShadow: "0 14px 34px rgba(31,37,35,.07)" }}>
      <TeamIdentityTitleStage
        variant="hero"
        surface={surface}
        role={role}
        eyebrow={eyebrow}
        title={title}
        summary={subtitle}
        crestSize={132}
        showTonalCrest
        titleAs="div"
      />
    </article>
  );
}

function TeamBrandingPreviewContent() {
  const { branding } = useTeamBranding();
  const scale = branding?.textScale || "standard";
  const label = scale === "xl" ? "Extra Large" : scale === "large" ? "Large" : "Default";

  return (
    <div style={{ display: "grid", gap: 14 }} data-testid="branding-live-preview">
      <ProductSurface role="COACH" eyebrow="PROGRAM COMMAND" title="Mission Control" subtitle="Your crest, team name, and approved color signature now frame the actual Coach mobile title system." surface="dark" />
      <ProductSurface role="PLAYER" eyebrow="PROGRAM TRAINING" title="Today’s Training" subtitle="The same team identity carries into the athlete experience without changing ShotLab’s functional semantics." />
      <section style={{ padding: 16, border: "1px solid rgba(24,32,31,.1)", borderRadius: 18, background: "#f8f7f3" }}>
        <div style={{ color: "#747d77", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>Typography · {label}</div>
        <div style={{ marginTop: 9, color: "#17201e", fontSize: "calc(23px * var(--coach-text-scale-display))", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-.035em" }}>This preview is the real title architecture.</div>
        <div style={{ marginTop: 7, color: "#68716c", fontSize: "calc(12px * var(--coach-text-scale-medium))", lineHeight: 1.55 }}>Brand changes are shown through the same crest geometry, hierarchy, safe color tokens, and tonal mark used by Coach and Player pages.</div>
      </section>
    </div>
  );
}

export default function TeamBrandingPreview({ branding }) {
  return branding ? <TeamBrandingProvider branding={branding}><TeamBrandingPreviewContent /></TeamBrandingProvider> : <TeamBrandingPreviewContent />;
}
