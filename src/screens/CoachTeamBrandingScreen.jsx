import { useEffect, useState } from "react";
import { DEFAULT_BRANDING } from "../theme/brandingDefaults";
import TeamBrandingForm from "../components/team/TeamBrandingForm";
import TeamBrandingPreview from "../components/team/TeamBrandingPreview";
import AppHeader from "../components/AppHeader";

const BG = "#0B0D10";
const SURFACE = "#141821";
const LIGHT = "#E5E7EB";
const FD = "'Bebas Neue','Impact','Arial Black',sans-serif";
const FB = "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

export default function CoachTeamBrandingScreen({ branding, onSave, onBack, teamName, canEdit = true }) {
  const [saving, setSaving] = useState(false);
  const [draftBranding, setDraftBranding] = useState({ ...DEFAULT_BRANDING, ...(branding || {}) });

  useEffect(() => {
    setDraftBranding({ ...DEFAULT_BRANDING, ...(branding || {}) });
  }, [branding]);

  const handleSave = async (next) => {
    if (!canEdit) return;
    setSaving(true);
    await onSave?.(next);
    setSaving(false);
  };

  return (
    <div className="team-brand" style={{ minHeight: "100dvh", background: BG, color: LIGHT, padding: 20, fontFamily: FB }}>
      <div style={{ maxWidth: 740, margin: "0 auto", display: "grid", gap: 16 }}>
        <AppHeader
          variant="utility"
          title="TEAM BRANDING"
          subtitle={`${teamName} branding is shared by coaches and players.${canEdit ? "" : " Team admins control logo and color changes."}`}
          action={{ label: "Back", onClick: onBack }}
        />
        <div style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16 }}>
          {canEdit ? (
            <TeamBrandingForm
              branding={branding}
              onChange={setDraftBranding}
              onSave={handleSave}
              onCancel={onBack}
              saving={saving}
            />
          ) : (
            <div style={{ color: "#9CA3AF", fontSize: 13, lineHeight: 1.5 }}>
              Team admins can update the shared logo, colors, and typography. Your account can still view the active branding below.
            </div>
          )}
        </div>
        <div style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16 }}>
          <div style={{ fontFamily: FD, fontSize: 18, letterSpacing: 1, marginBottom: 10 }}>Shared Preview</div>
          <TeamBrandingPreview branding={draftBranding} />
        </div>
      </div>
    </div>
  );
}
