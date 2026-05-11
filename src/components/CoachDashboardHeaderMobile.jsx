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
    <section ref={heroRef} className="coach-mobile-header" aria-label="Coach dashboard mobile header">
      <style>{`
        .coach-mobile-header{position:relative;overflow:hidden;min-height:318px;margin-bottom:8px;padding:14px 14px 10px;background:linear-gradient(152deg,#070907 0%,#0b130d 48%,#090b09 100%)}
        .coach-mobile-header::before,.coach-mobile-header::after{content:"";position:absolute;pointer-events:none}
        .coach-mobile-header::before{right:-18%;top:-16%;width:68%;height:130%;background:radial-gradient(circle at 30% 44%,rgba(188,255,0,.22) 0%,rgba(188,255,0,.08) 36%,rgba(0,0,0,0) 74%)}
        .coach-mobile-header::after{left:-16%;bottom:-46%;width:84%;height:120%;background:linear-gradient(38deg,rgba(130,210,80,.14),rgba(0,0,0,0));filter:blur(2px)}
        .coach-mobile-content{position:relative;z-index:2;max-width:66%}
        .coach-mobile-badge{display:inline-flex;border:1px solid var(--team-brand-badge-border);background:color-mix(in srgb,var(--team-brand-badge-bg) 88%,transparent);color:var(--team-brand-badge-text);padding:3px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
        .coach-mobile-name{margin:10px 0 0;font-size:clamp(44px,15vw,58px);line-height:.9;font-family:'Bebas Neue','Impact','Arial Black',sans-serif;color:var(--text-1);letter-spacing:var(--tracking-default);text-transform:uppercase}
        .coach-mobile-sub{margin:10px 0 0;color:var(--text-2);font-size:12px;letter-spacing:.05em;text-transform:uppercase}
        .coach-mobile-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
        .coach-mobile-meta-pill{display:inline-flex;align-items:center;gap:6px;color:var(--text-3);font-size:10px;letter-spacing:.07em;text-transform:uppercase}
        .coach-mobile-meta-icon{color:var(--accent);font-size:12px}
        .coach-mobile-brand-btn{margin-top:11px;display:inline-flex;align-items:center;gap:8px;padding:10px 13px;border-radius:12px;border:1px solid color-mix(in srgb,var(--accent) 26%,var(--stroke-1));background:linear-gradient(160deg,color-mix(in srgb,var(--team-brand-badge-bg) 44%,transparent),rgba(200,255,0,.05));color:var(--text-1);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
        .coach-mobile-logo{position:absolute;right:-14px;top:42px;width:min(56vw,230px);opacity:.88;z-index:1;pointer-events:none;filter:drop-shadow(0 20px 36px rgba(0,0,0,.45)) drop-shadow(0 0 24px rgba(200,255,0,.14))}
        .coach-mobile-options{position:absolute;right:10px;top:8px;width:30px;height:30px;border-radius:999px;border:1px solid var(--team-brand-border,var(--stroke-1));background:color-mix(in srgb,var(--surface-1) 88%,transparent);color:var(--text-2);font-size:12px;z-index:3}
      `}</style>
      <button type="button" onClick={onLogout} aria-label="Log out" className="coach-mobile-options">✕</button>
      <div className="coach-mobile-content">
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
      <div className="coach-mobile-logo" aria-hidden="true">{wordmark}</div>
    </section>
  );
}
