import { useEffect, useState } from "react";
import { DEFAULT_BRANDING } from "../theme/brandingDefaults";
import TeamBrandingForm from "../components/team/TeamBrandingForm";
import TeamBrandingPreview from "../components/team/TeamBrandingPreview";
import AppHeader from "../components/AppHeader";
import { DSCard, DSSectionHeader } from "../components/ui/designSystem";

const BG = "#0B0D10";
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
    <div className="team-brand" style={{ minHeight: "100dvh", background: BG, color: LIGHT, padding: 20, fontFamily: FB }}>
      <div style={{ maxWidth: 740, margin: "0 auto", display: "grid", gap: 16 }}>
        <AppHeader variant="utility" title="TEAM BRANDING" subtitle={`${teamName} branding is shared by coaches and players.`} action={{ label: "Back", onClick: onBack }} />
        <DSCard style={{ padding: 16 }}>
          <DSSectionHeader title="Brand tokens" meta={saving ? "Saving…" : "Autosync ready"} />
          <TeamBrandingForm branding={branding} onChange={setDraftBranding} onSave={handleSave} onCancel={onBack} saving={saving} />
        </DSCard>
        <DSCard style={{ padding: 16 }}>
          <DSSectionHeader title="Shared preview" meta="Coach + Player" />
          <TeamBrandingPreview branding={draftBranding} />
        </DSCard>
      </div>
    </div>
  );
}
