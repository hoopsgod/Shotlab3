import { useEffect, useState } from "react";
import { DEFAULT_BRANDING } from "../theme/brandingDefaults";
import TeamBrandingForm from "../components/team/TeamBrandingForm";
import TeamBrandingPreview from "../components/team/TeamBrandingPreview";
import AppHeader from "../components/AppHeader";
import { DSCard, DSSectionHeader } from "../components/ui/designSystem";
import "../styles/PremiumWorkspace.css";

const LIGHT = "#E5E7EB";
const FB = "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

export default function CoachTeamBrandingScreen({ branding, onSave, onBack, teamName }) {
  const [saving, setSaving] = useState(false);
  const [draftBranding, setDraftBranding] = useState({ ...DEFAULT_BRANDING, ...(branding || {}) });

  useEffect(() => {
    setDraftBranding({ ...DEFAULT_BRANDING, ...(branding || {}) });
  }, [branding]);

  const handleSave = async (next) => {
    setSaving(true);
    await onSave?.(next);
    setSaving(false);
  };

  return (
    <div className="team-brand premium-screen premium-screen--branding" style={{ color: LIGHT, padding: 20, fontFamily: FB }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gap: 16 }}>
        <AppHeader
          variant="standard"
          eyebrow="Team identity system"
          title="TEAM BRANDING"
          subtitle={`${teamName} branding is shared across Coach Mission Control, player workspaces, leaderboards, events, and training surfaces.`}
          action={{ label: "Back", onClick: onBack }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(300px,.9fr)", gap: 16, alignItems: "start" }} className="branding-workspace-grid">
          <DSCard style={{ padding: 18, background: "var(--pw-surface)", border: "1px solid var(--pw-border)", boxShadow: "var(--pw-shadow)" }}>
            <DSSectionHeader title="Brand system" meta={saving ? "Saving…" : "Live preview enabled"} />
            <TeamBrandingForm branding={branding} onChange={setDraftBranding} onSave={handleSave} onCancel={onBack} saving={saving} />
          </DSCard>
          <DSCard style={{ padding: 18, background: "var(--pw-surface)", border: "1px solid var(--pw-border)", boxShadow: "var(--pw-shadow)", position: "sticky", top: 18 }}>
            <DSSectionHeader title="Shared preview" meta="Coach + Player" />
            <TeamBrandingPreview branding={draftBranding} />
          </DSCard>
        </div>
      </div>
      <style>{`@media (max-width: 820px){.branding-workspace-grid{grid-template-columns:1fr!important}.branding-workspace-grid>div:last-child{position:static!important}}`}</style>
    </div>
  );
}
