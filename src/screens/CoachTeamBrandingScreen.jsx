import { useEffect, useState } from "react";
import { DEFAULT_BRANDING } from "../theme/brandingDefaults";
import TeamBrandingForm from "../components/team/TeamBrandingForm";
import TeamBrandingPreview from "../components/team/TeamBrandingPreview";
import AppHeader from "../components/AppHeader";
import AppFeedbackLayer, { announceFeedback } from "../components/AppFeedbackLayer";
import "../styles/PremiumWorkspace.css";
import "./CoachTeamBrandingScreen.css";

export default function CoachTeamBrandingScreen({ branding, onSave, onBack, teamName }) {
  const [saving, setSaving] = useState(false);
  const [draftBranding, setDraftBranding] = useState({ ...DEFAULT_BRANDING, ...(branding || {}) });

  useEffect(() => {
    setDraftBranding({ ...DEFAULT_BRANDING, ...(branding || {}) });
  }, [branding]);

  const handleSave = async (next) => {
    setSaving(true);
    try {
      await onSave?.(next);
      announceFeedback({
        tone: "success",
        title: "Team identity saved",
        message: "Your updated colors, logos, and typography are now applied across coach and player experiences.",
      });
    } catch (error) {
      announceFeedback({
        tone: "error",
        title: "Branding was not saved",
        message: error?.message || "ShotLab could not save these changes. Your draft remains available so you can try again.",
        duration: 5200,
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="team-brand premium-screen premium-screen--branding branding-industrial">
      <AppFeedbackLayer />
      <div className="branding-industrial__inner">
        <AppHeader
          variant="standard"
          eyebrow="Team identity system"
          title="Branding"
          subtitle={`${teamName} branding flows through coach, player, training, event, leaderboard, and storefront experiences.`}
          action={{ label: "Back", onClick: onBack }}
        />

        <div className="branding-industrial__workspace" data-testid="branding-identity-workspace">
          <section className="branding-industrial__panel" aria-labelledby="branding-controls-title" aria-busy={saving}>
            <header className="branding-industrial__panel-header">
              <div>
                <div className="branding-industrial__kicker">Identity controls</div>
                <h2 id="branding-controls-title">Build one recognizable team system</h2>
                <p>Choose an approved palette, set readable typography, and prepare transparent logos without exposing technical setup to players.</p>
              </div>
              <span className="branding-industrial__status" role="status" aria-live="polite">{saving ? "Saving changes…" : "Live preview"}</span>
            </header>
            <TeamBrandingForm branding={branding} onChange={setDraftBranding} onSave={handleSave} onCancel={onBack} saving={saving} />
          </section>

          <aside className="branding-industrial__panel branding-industrial__preview" aria-labelledby="branding-preview-title">
            <header className="branding-industrial__panel-header">
              <div>
                <div className="branding-industrial__kicker">Shared preview</div>
                <h2 id="branding-preview-title">See the identity in context</h2>
                <p>Coach and player surfaces update together so the program feels consistent before anything is saved.</p>
              </div>
              <span className="branding-industrial__status">Coach + Player</span>
            </header>
            <TeamBrandingPreview branding={draftBranding} />
          </aside>
        </div>
      </div>
    </main>
  );
}
