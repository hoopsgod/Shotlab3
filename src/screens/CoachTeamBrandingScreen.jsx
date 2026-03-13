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

export default function CoachTeamBrandingScreen({ branding, onSave, onBack, teamName }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [draftBranding, setDraftBranding] = useState({ ...DEFAULT_BRANDING, ...(branding || {}) });

  useEffect(() => {
    setDraftBranding({ ...DEFAULT_BRANDING, ...(branding || {}) });
  }, [branding]);

  const handleSave = async (next) => {
    setSaving(true);
    setMessage("");
    const result = await onSave?.(next);
    setSaving(false);
    if (result?.ok) {
      setMessage("Team branding saved for all coach/player views.");
      return;
    }
    setMessage(result?.err || "Could not save team branding.");
  };

  return (
    <div className="team-brand" style={{ minHeight: "100dvh", background: BG, color: LIGHT, padding: 20, fontFamily: FB }}>
      <div style={{ maxWidth: 740, margin: "0 auto", display: "grid", gap: 16 }}>
        <AppHeader
          variant="utility"
          title="TEAM BRANDING"
          subtitle={`${teamName} branding is shared by coaches and players.`}
          action={{ label: "Back", onClick: onBack }}
        />
        <div style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16 }}>
          <TeamBrandingForm
            branding={branding}
            onChange={setDraftBranding}
            onSave={handleSave}
            onCancel={onBack}
            saving={saving}
          />
        </div>
        <div style={{ background: SURFACE, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 16 }}>
          <div style={{ fontFamily: FD, fontSize: 18, letterSpacing: 1, marginBottom: 10 }}>Shared Preview</div>
          <TeamBrandingPreview branding={draftBranding} />
        </div>
        {message && <div style={{ color: message.toLowerCase().includes("saved") ? "#9DFF7A" : "#FF8E8E", fontSize: 13 }}>{message}</div>}
      </div>
    </div>
  );
}
