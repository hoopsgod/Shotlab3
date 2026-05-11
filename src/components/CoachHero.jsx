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
        .coach-premium-header{position:relative;margin-bottom:8px;padding:11px 0 6px;overflow:hidden;background:linear-gradient(140deg,#090b08 0%,#0e1410 55%,#0b0e0c 100%)}
        .coach-premium-header::before,.coach-premium-header::after{content:"";position:absolute;inset:auto;pointer-events:none}
        .coach-premium-header::before{width:46%;height:130%;right:-12%;top:-24%;background:radial-gradient(circle at 36% 52%,rgba(200,255,0,.16) 0%,rgba(130,210,80,.07) 34%,rgba(0,0,0,0) 76%),linear-gradient(132deg,rgba(180,255,0,.02) 0%,rgba(180,255,0,.10) 46%,rgba(180,255,0,0) 88%);filter:blur(2px);transform:skewX(-14deg)}
        .coach-premium-header::after{width:58%;height:96%;left:-12%;bottom:-38%;background:linear-gradient(45deg,rgba(180,255,0,.08),rgba(0,0,0,0));transform:skewX(-32deg)}
        .coach-premium-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr);gap:10px;align-items:start}
        .coach-premium-badge{display:inline-flex;border:1px solid var(--team-brand-badge-border);background:color-mix(in srgb,var(--team-brand-badge-bg) 88%,transparent);color:var(--team-brand-badge-text);padding:3px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
        .coach-premium-name{margin:7px 0 0;font-size:clamp(36px,6vw,62px);line-height:.9;font-family:'Bebas Neue','Impact','Arial Black',sans-serif;color:var(--text-1);letter-spacing:var(--tracking-default);text-transform:uppercase}
        .coach-premium-sub{margin:8px 0 0;color:var(--text-2);font-size:13px;letter-spacing:.05em;text-transform:uppercase}
        .coach-premium-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:7px}
        .coach-premium-meta-pill{display:inline-flex;align-items:center;gap:6px;color:var(--text-3);font-size:10px;letter-spacing:.07em;text-transform:uppercase}
        .coach-premium-meta-icon{color:var(--accent);font-size:12px}
        .coach-premium-brand-btn{margin-top:11px;display:inline-flex;align-items:center;gap:8px;padding:11px 14px;border-radius:12px;border:1px solid color-mix(in srgb,var(--accent) 26%,var(--stroke-1));background:linear-gradient(160deg,color-mix(in srgb,var(--team-brand-badge-bg) 44%,transparent),rgba(200,255,0,.05));color:var(--text-1);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
        .coach-premium-logo-atmo{position:absolute;right:-18px;top:-8px;width:min(52%,430px);height:calc(100% + 22px);display:flex;align-items:center;justify-content:flex-end;pointer-events:none;z-index:0}
        .coach-premium-logo-atmo-mark{position:relative;max-width:118%;max-height:292px;transform:scale(1.48);transform-origin:72% 50%;opacity:.82;filter:drop-shadow(0 20px 38px rgba(0,0,0,0.44)) drop-shadow(0 0 28px rgba(200,255,0,0.16))}
        .coach-premium-logo-atmo-mark::before{content:"";position:absolute;inset:-8% -10%;background:radial-gradient(circle at 58% 52%,rgba(200,255,0,.15) 0%,rgba(150,220,100,.07) 36%,rgba(0,0,0,0) 74%),linear-gradient(125deg,rgba(180,255,0,.00) 0%,rgba(180,255,0,.08) 50%,rgba(180,255,0,.00) 88%);mix-blend-mode:screen;pointer-events:none}
        .coach-premium-options{position:absolute;right:8px;top:4px;width:30px;height:30px;border-radius:999px;border:1px solid var(--team-brand-border,var(--stroke-1));background:color-mix(in srgb,var(--surface-1) 88%,transparent);color:var(--text-2);cursor:pointer;font-size:12px;z-index:2}
        .coach-premium-content{position:relative;z-index:1;padding-right:min(42%,265px)}
        @media (max-width:900px){.coach-premium-name{font-size:clamp(32px,7vw,50px)}.coach-premium-logo-atmo{right:-10px;width:min(48%,320px)}}
        @media (max-width:700px){.coach-premium-grid{gap:8px}.coach-premium-name{font-size:clamp(30px,10vw,44px)}.coach-premium-content{padding-right:0}.coach-premium-logo-atmo{right:-6px;top:10px;width:min(47%,210px);height:132px;opacity:.74}.coach-premium-logo-atmo-mark{max-height:150px;transform:scale(1.28);opacity:.78}}
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
      </div>
      <div className="coach-premium-logo-atmo" aria-hidden="true">
        <div className="coach-premium-logo-atmo-mark">{wordmark}</div>
      </div>
    </section>
  );
}
