import { useTeamBranding } from "../context/TeamBrandingContext";

function MetaPill({ icon, label }) {
  if (!label) return null;
  return (
    <span className="coach-premium-meta-pill">
      <span aria-hidden="true" className="coach-premium-meta-icon">{icon}</span>
      {label}
    </span>
  );
}

export default function CoachHero({ heroRef, userName, wordmark, teamName, onOpenTeamBranding, onLogout }) {
  const { branding } = useTeamBranding();
  const coachLabel = userName || "Demo Coach";
  const programLabel = branding?.teamName ?? teamName ?? "Titans Program";

  return (
    <section ref={heroRef} className="coach-premium-header" aria-label="Coach dashboard header">
      <style>{`
        .coach-premium-header{position:relative;margin-bottom:10px;padding:14px 0 8px;overflow:hidden;background:linear-gradient(140deg,#090b08 0%,#0e1410 55%,#0b0e0c 100%)}
        .coach-premium-header::before,.coach-premium-header::after{content:"";position:absolute;inset:auto;pointer-events:none}
        .coach-premium-header::before{width:42%;height:120%;right:-10%;top:-20%;background:linear-gradient(135deg,rgba(200,255,0,.13),rgba(0,0,0,0));transform:skewX(-24deg)}
        .coach-premium-header::after{width:55%;height:95%;left:-12%;bottom:-36%;background:linear-gradient(45deg,rgba(180,255,0,.08),rgba(0,0,0,0));transform:skewX(-32deg)}
        .coach-premium-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr);gap:10px;align-items:start}
        .coach-premium-badge{display:inline-flex;border:1px solid var(--team-brand-badge-border);background:color-mix(in srgb,var(--team-brand-badge-bg) 88%,transparent);color:var(--team-brand-badge-text);padding:3px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
        .coach-premium-name{margin:7px 0 0;font-size:clamp(36px,6vw,62px);line-height:.9;font-family:'Bebas Neue','Impact','Arial Black',sans-serif;color:var(--text-1);letter-spacing:var(--tracking-default);text-transform:uppercase}
        .coach-premium-sub{margin:8px 0 0;color:var(--text-2);font-size:13px;letter-spacing:.05em;text-transform:uppercase}
        .coach-premium-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:7px}
        .coach-premium-meta-pill{display:inline-flex;align-items:center;gap:6px;color:var(--text-3);font-size:10px;letter-spacing:.07em;text-transform:uppercase}
        .coach-premium-meta-icon{color:var(--accent);font-size:12px}
        .coach-premium-brand-btn{margin-top:11px;display:inline-flex;align-items:center;gap:8px;padding:11px 14px;border-radius:12px;border:1px solid color-mix(in srgb,var(--accent) 26%,var(--stroke-1));background:linear-gradient(160deg,color-mix(in srgb,var(--team-brand-badge-bg) 44%,transparent),rgba(200,255,0,.05));color:var(--text-1);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
        .coach-premium-logo-atmo{position:absolute;right:18px;top:10px;bottom:8px;width:42%;min-width:180px;display:flex;align-items:center;justify-content:flex-end;pointer-events:none;z-index:0}
        .coach-premium-logo-atmo::before{content:"";position:absolute;right:8%;width:80%;height:80%;background:radial-gradient(circle at 50% 50%,rgba(192,255,0,.15) 0%,rgba(192,255,0,.06) 30%,rgba(0,0,0,0) 74%);filter:blur(3px)}
        .coach-premium-logo-atmo-mark{max-width:100%;max-height:210px;transform:scale(1.06);opacity:.92;filter:drop-shadow(0 14px 28px rgba(0,0,0,0.35)) drop-shadow(0 0 24px rgba(200,255,0,0.20))}
        .coach-premium-options{position:absolute;right:8px;top:4px;width:30px;height:30px;border-radius:999px;border:1px solid var(--team-brand-border,var(--stroke-1));background:color-mix(in srgb,var(--surface-1) 88%,transparent);color:var(--text-2);cursor:pointer;font-size:12px;z-index:2}
        .coach-premium-content{position:relative;z-index:1;padding-right:min(42%,260px)}
        @media (max-width:900px){.coach-premium-name{font-size:clamp(32px,7vw,50px)}.coach-premium-logo-atmo{width:40%;min-width:150px}}
        @media (max-width:700px){.coach-premium-grid{gap:8px}.coach-premium-name{font-size:clamp(30px,10vw,44px)}.coach-premium-content{padding-right:0}.coach-premium-logo-atmo{width:45%;min-width:118px;top:20px;bottom:auto;height:118px;opacity:.7}.coach-premium-logo-atmo-mark{max-height:120px}}
      `}</style>
      <div className="coach-premium-grid">
        <div className="coach-premium-content">
          <span className="coach-premium-badge">Coach Mode</span>
          <h1 className="coach-premium-name">{coachLabel.toUpperCase()}</h1>
          <p className="coach-premium-sub">Lead. Develop. Dominate.</p>
          <div className="coach-premium-meta">
            <MetaPill icon="✓" label="Coach Identity" />
            <MetaPill icon="👤" label={coachLabel} />
            <MetaPill icon="★" label={programLabel} />
          </div>
          <button type="button" onClick={onOpenTeamBranding} className="coach-premium-brand-btn">
            <span aria-hidden="true">🎨</span>
            Team Branding Settings
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <button type="button" onClick={onLogout} aria-label="Log out" className="coach-premium-options">✕</button>
        <div className="coach-premium-logo-atmo" aria-hidden="true">
          <div className="coach-premium-logo-atmo-mark">{wordmark}</div>
        </div>
      </div>
    </section>
  );
}
