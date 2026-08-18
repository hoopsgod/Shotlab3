import { useEffect, useState } from "react";
import { DEFAULT_BRANDING } from "../theme/brandingDefaults";
import TeamBrandingForm from "../components/team/TeamBrandingForm";
import TeamBrandingPreview from "../components/team/TeamBrandingPreview";
import { SecondaryPageIntro, SecondaryPageShell } from "../components/SecondaryPageSystem";
import { announceFeedback } from "../components/AppFeedbackLayer";
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
      <SecondaryPageShell className="brandingEditorialWorkspace" testId="coach-branding-workspace">
        <SecondaryPageIntro
          variant="hero"
          crestSize={136}
          role="COACH"
          eyebrow="PROGRAM IDENTITY"
          title="Program Branding"
          summary={`${teamName} should feel unmistakably yours across coach, player, training, event, leaderboard, and storefront experiences.`}
          status="Coach + Player"
          backAction={{ label: "Back to Coach", onClick: onBack }}
          testId="coach-branding-header"
          icon="settings"
        />

        <div className="branding-industrial__workspace" data-testid="branding-identity-workspace">
          <aside className="branding-industrial__panel branding-industrial__preview" data-surface="dark" data-visual-role="branding-preview" aria-labelledby="branding-preview-title">
            <header className="branding-industrial__panel-header">
              <div>
                <div className="branding-industrial__kicker">Program identity</div>
                <h2 id="branding-preview-title">{teamName}, recognized at a glance</h2>
                <p>This is the shared identity players, coaches, and families carry from training to competition to the team storefront.</p>
              </div>
              <span className="branding-industrial__status">Coach + Player</span>
            </header>
            <TeamBrandingPreview branding={draftBranding} />
          </aside>

          <section className="branding-industrial__panel branding-industrial__controls" data-surface="light" data-visual-role="branding-controls" aria-labelledby="branding-controls-title" aria-busy={saving}>
            <header className="branding-industrial__panel-header">
              <div>
                <div className="branding-industrial__kicker">Identity controls</div>
                <h2 id="branding-controls-title">Refine the system</h2>
                <p>Adjust the approved palette, typography, and marks that power the program identity above.</p>
              </div>
              <span className="branding-industrial__status" role="status" aria-live="polite">{saving ? "Saving changes…" : "Live preview"}</span>
            </header>
            <TeamBrandingForm branding={branding} onChange={setDraftBranding} onSave={handleSave} onCancel={onBack} saving={saving} />
          </section>
        </div>
      </SecondaryPageShell>
    </main>
  );
}
