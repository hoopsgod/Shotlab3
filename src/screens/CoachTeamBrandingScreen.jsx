import { useState } from "react";
import { DEFAULT_BRANDING } from "../theme/brandingDefaults";
import TeamBrandingForm from "../components/team/TeamBrandingForm";
import TeamBrandingPreview from "../components/team/TeamBrandingPreview";

const BG = "#0B0D10";
const SURFACE = "#141821";
const LIGHT = "#E5E7EB";
const MUTED = "#6B7280";
const FD = "'Bebas Neue','Impact','Arial Black',sans-serif";
const FB = "'Barlow Condensed','Arial Narrow','Helvetica Neue',sans-serif";

export default function CoachTeamBrandingScreen({ branding, onSave, onBack, teamName }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [draftBranding, setDraftBranding] = useState({ ...DEFAULT_BRANDING, ...(branding || {}) });

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div>
            <div style={{ fontFamily: FD, fontSize: 24, letterSpacing: 2 }}>TEAM BRANDING</div>
            <div style={{ color: MUTED, fontSize: 13 }}>{teamName} branding is shared by coaches and players.</div>
          </div>
          <button onClick={onBack} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: LIGHT }}>
            Back
          </button>
        </div>
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
