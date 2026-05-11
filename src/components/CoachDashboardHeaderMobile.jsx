import { useTeamBranding } from "../context/TeamBrandingContext";

function MetaPill({ icon, label }) {
  if (!label) return null;
  return (
    <span className="coach-mobile-meta-pill">
      <span aria-hidden="true" className="coach-mobile-meta-icon">{icon}</span>
      {label}
    </span>
  );
}

export default function CoachDashboardHeaderMobile({ heroRef, userName, teamName, wordmark, onOpenTeamBranding, onLogout }) {
  const { branding } = useTeamBranding();
  const coachLabel = userName || "Demo Coach";
  const programLabel = branding?.teamName ?? teamName ?? "Titans Program";

  return (
    <section ref={heroRef} className="coach-mobile-hero" aria-label="Coach dashboard mobile header">
      <style>{`
        .coach-mobile-hero{position:relative;min-height:330px;overflow:hidden;margin-bottom:8px;padding:12px 14px 8px}
        .coach-mobile-hero-atmo{position:absolute;inset:0;z-index:0;pointer-events:none;background:
          radial-gradient(74% 118% at 84% 48%, rgba(180,255,64,.24) 0%, rgba(180,255,64,.1) 32%, rgba(0,0,0,0) 74%),
          radial-gradient(120% 120% at 8% 112%, rgba(108,195,84,.18) 0%, rgba(0,0,0,0) 62%),
          linear-gradient(150deg,#060806 0%,#0a130d 46%,#080a08 100%)}
        .coach-mobile-hero-atmo::before,.coach-mobile-hero-atmo::after{content:"";position:absolute;pointer-events:none}
        .coach-mobile-hero-atmo::before{right:-16%;top:-28%;width:72%;height:146%;background:linear-gradient(131deg,rgba(188,255,0,0) 0%,rgba(188,255,0,.12) 46%,rgba(188,255,0,0) 85%);transform:skewX(-18deg)}
        .coach-mobile-hero-atmo::after{left:-20%;bottom:-52%;width:90%;height:128%;background:linear-gradient(36deg,rgba(118,196,85,.16),rgba(0,0,0,0));filter:blur(2px)}
        .coach-mobile-hero-content{position:relative;z-index:2;padding-right:min(44vw,186px)}
        .coach-mobile-badge{display:inline-flex;border:1px solid var(--team-brand-badge-border);background:color-mix(in srgb,var(--team-brand-badge-bg) 88%,transparent);color:var(--team-brand-badge-text);padding:3px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
        .coach-mobile-name{margin:10px 0 0;font-size:clamp(44px,15vw,58px);line-height:.9;font-family:'Bebas Neue','Impact','Arial Black',sans-serif;color:var(--text-1);letter-spacing:var(--tracking-default);text-transform:uppercase}
        .coach-mobile-sub{margin:10px 0 0;color:var(--text-2);font-size:12px;letter-spacing:.05em;text-transform:uppercase}
        .coach-mobile-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
        .coach-mobile-meta-pill{display:inline-flex;align-items:center;gap:6px;color:var(--text-3);font-size:10px;letter-spacing:.07em;text-transform:uppercase}
        .coach-mobile-meta-icon{color:var(--accent);font-size:12px}
        .coach-mobile-brand-btn{margin-top:11px;display:inline-flex;align-items:center;gap:8px;padding:10px 13px;border-radius:12px;border:1px solid color-mix(in srgb,var(--accent) 26%,var(--stroke-1));background:linear-gradient(160deg,color-mix(in srgb,var(--team-brand-badge-bg) 44%,transparent),rgba(200,255,0,.05));color:var(--text-1);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
        .coach-mobile-brandmark{position:absolute;right:-42px;top:34px;width:min(72vw,320px);z-index:1;opacity:.82;pointer-events:none;transform:rotate(-4deg);filter:drop-shadow(0 26px 46px rgba(0,0,0,.48)) drop-shadow(0 0 26px rgba(200,255,0,.12))}
        .coach-mobile-options{position:absolute;right:10px;top:8px;width:30px;height:30px;border-radius:999px;border:1px solid var(--team-brand-border,var(--stroke-1));background:color-mix(in srgb,var(--surface-1) 88%,transparent);color:var(--text-2);font-size:12px;z-index:3}
      `}</style>

      <div className="coach-mobile-hero-atmo" aria-hidden="true" />
      <div className="coach-mobile-brandmark" aria-hidden="true">{wordmark}</div>

      <button type="button" onClick={onLogout} aria-label="Log out" className="coach-mobile-options">✕</button>

      <div className="coach-mobile-hero-content">
        <span className="coach-mobile-badge">Coach Mode</span>
        <h1 className="coach-mobile-name">{coachLabel.toUpperCase()}</h1>
        <p className="coach-mobile-sub">Lead. Develop. Dominate.</p>
        <div className="coach-mobile-meta">
          <MetaPill icon="✓" label="Coach Identity" />
          <MetaPill icon="👤" label={coachLabel} />
          <MetaPill icon="★" label={programLabel} />
        </div>
        <button type="button" onClick={onOpenTeamBranding} className="coach-mobile-brand-btn">
          <span aria-hidden="true">🎨</span>
          Team Branding Settings
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </section>
  );
}
