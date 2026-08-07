import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_BRANDING } from "../theme/brandingDefaults";
import TeamBrandingForm from "../components/team/TeamBrandingForm";
import TeamBrandingPreview from "../components/team/TeamBrandingPreview";
import AppHeader from "../components/AppHeader";
import AppFeedbackLayer, { announceFeedback } from "../components/AppFeedbackLayer";
import "../styles/PremiumWorkspace.css";
import "./CoachTeamBrandingScreen.css";

const FALLBACK_LOGO = "/branding/titans-exact-logo.png.PNG";
const FALLBACK_MARK = "/branding/titans-default-mark.svg";

function textScaleLabel(scale) {
  if (scale === "xl") return "Extra Large";
  if (scale === "large") return "Large";
  return "Default";
}

export default function CoachTeamBrandingScreen({ branding, onSave, onBack, teamName }) {
  const [saving, setSaving] = useState(false);
  const [draftBranding, setDraftBranding] = useState({ ...DEFAULT_BRANDING, ...(branding || {}) });
  const controlsRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    setDraftBranding({ ...DEFAULT_BRANDING, ...(branding || {}) });
  }, [branding]);

  const identity = useMemo(() => ({ ...DEFAULT_BRANDING, ...(draftBranding || {}) }), [draftBranding]);
  const primary = identity.primaryColor || "#7F9E1E";
  const secondary = identity.secondaryColor || "#C8FF1A";
  const accent = identity.accentColor || primary;
  const fullLogo = identity.logoUrl || FALLBACK_LOGO;
  const markLogo = identity.logoMarkUrl || FALLBACK_MARK;

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

  const reveal = (ref) => {
    ref.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="team-brand premium-screen premium-screen--branding branding-industrial" data-testid="program-identity-studio">
      <AppFeedbackLayer />
      <div className="branding-industrial__inner">
        <AppHeader
          variant="standard"
          eyebrow="Program identity system"
          title="Program Identity"
          subtitle={`${teamName} should feel unmistakably yours everywhere a coach or player opens ShotLab.`}
          action={{ label: "Back", onClick: onBack }}
        />

        <section
          className="branding-studio__hero"
          data-testid="branding-identity-hero"
          style={{ "--identity-primary": primary, "--identity-secondary": secondary, "--identity-accent": accent }}
        >
          <div className="branding-studio__hero-topline">
            <span>LIVE PROGRAM ID</span>
            <span className="branding-studio__hero-status"><i aria-hidden="true" /> Previewing draft</span>
          </div>

          <div className="branding-studio__hero-grid">
            <div className="branding-studio__logo-stage" data-testid="branding-logo-stage">
              <div className="branding-studio__logo-glow" aria-hidden="true" />
              <img className="branding-studio__full-logo" src={fullLogo} alt={`${teamName} full logo`} />
              <div className="branding-studio__mark-tile">
                <img src={markLogo} alt={`${teamName} logo mark`} />
              </div>
            </div>

            <div className="branding-studio__hero-copy">
              <div className="branding-studio__eyebrow">One identity · every surface</div>
              <h1>{teamName}</h1>
              <p>Your logo, palette, and readability settings flow into Mission Control, player training, leaderboards, events, and the Team Store.</p>

              <div className="branding-studio__palette" aria-label="Current program palette">
                {[primary, secondary, accent].map((color, index) => (
                  <span key={`${color}-${index}`} style={{ backgroundColor: color }} aria-label={`Program color ${index + 1}: ${color}`} />
                ))}
              </div>

              <div className="branding-studio__hero-actions">
                <button type="button" className="branding-studio__primary-action" onClick={() => reveal(controlsRef)}>Edit identity <span aria-hidden="true">→</span></button>
                <button type="button" className="branding-studio__secondary-action" onClick={() => reveal(previewRef)}>Preview surfaces</button>
              </div>
            </div>
          </div>

          <div className="branding-studio__signal-strip" aria-label="Program identity coverage">
            <span><strong>2</strong><small>Logo assets</small></span>
            <span><strong>3</strong><small>Brand colors</small></span>
            <span><strong>{textScaleLabel(identity.textScale)}</strong><small>Text scale</small></span>
          </div>
        </section>

        <div className="branding-studio__principles" aria-label="Program identity principles">
          <div><span>01</span><strong>Logo first</strong><small>Make the team mark recognizable before decorative chrome.</small></div>
          <div><span>02</span><strong>Controlled color</strong><small>Use a deliberate palette instead of repainting every surface.</small></div>
          <div><span>03</span><strong>Readable everywhere</strong><small>Protect contrast and hierarchy across coach and player modes.</small></div>
        </div>

        <div className="branding-industrial__workspace" data-testid="branding-identity-workspace">
          <section ref={controlsRef} className="branding-industrial__panel branding-industrial__controls" aria-labelledby="branding-controls-title" aria-busy={saving} data-testid="branding-identity-controls">
            <header className="branding-industrial__panel-header">
              <div>
                <div className="branding-industrial__kicker">Identity controls</div>
                <h2 id="branding-controls-title">Build one recognizable team system</h2>
                <p>Choose a controlled palette, set readable typography, and prepare transparent logos without exposing technical setup to players.</p>
              </div>
              <span className="branding-industrial__status" role="status" aria-live="polite">{saving ? "Saving changes…" : "Live preview"}</span>
            </header>
            <TeamBrandingForm branding={branding} onChange={setDraftBranding} onSave={handleSave} onCancel={onBack} saving={saving} />
          </section>

          <aside ref={previewRef} className="branding-industrial__panel branding-industrial__preview" aria-labelledby="branding-preview-title" data-testid="branding-surface-preview">
            <header className="branding-industrial__panel-header">
              <div>
                <div className="branding-industrial__kicker">Shared preview</div>
                <h2 id="branding-preview-title">See the identity in context</h2>
                <p>Coach and player surfaces update together before anything is saved.</p>
              </div>
              <span className="branding-industrial__status">Coach + Player</span>
            </header>
            <TeamBrandingPreview branding={identity} />
          </aside>
        </div>
      </div>
    </main>
  );
}
