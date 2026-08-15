import { useTeamBranding } from "../context/TeamBrandingContext";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./DashboardIdentityHeader.module.css";

const MOBILE_COACH_IDENTITY_CSS = `
@media(max-width:700px){
  [data-testid="coach-dashboard-identity-header"]{position:relative!important;margin:0 0 10px!important;overflow:hidden!important;border:0!important;border-bottom:1px solid rgba(200,255,26,.16)!important;border-radius:0!important;background:radial-gradient(circle at 93% -32%,rgba(200,255,26,.17),transparent 42%),linear-gradient(126deg,#061923 0%,#082430 58%,#0b2d37 100%)!important;box-shadow:0 14px 34px rgba(7,28,40,.15)!important;color:#f5f8f9!important}
  [data-testid="coach-dashboard-identity-header"]::before{display:block!important;content:""!important;position:absolute!important;inset:0!important;pointer-events:none!important;background:radial-gradient(ellipse 190px 104px at 105% 116%,transparent 63%,rgba(223,236,241,.11) 63.5%,transparent 64.2%),linear-gradient(90deg,transparent 0 72%,rgba(223,236,241,.055) 72% 72.4%,transparent 72.4%)!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="inner"]{position:relative!important;z-index:1!important;grid-template-columns:66px minmax(0,1fr)!important;gap:14px!important;align-items:center!important;min-height:102px!important;padding:max(12px,env(safe-area-inset-top)) 16px 14px!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="identity"]{grid-column:2;grid-row:1;min-width:0;padding-right:50px!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-panel"]{grid-column:1;grid-row:1;width:66px!important;min-height:66px!important;padding:0!important;border-radius:0!important;background:transparent!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-mark"]{width:60px!important;height:60px!important;filter:drop-shadow(0 10px 16px rgba(0,0,0,.30))!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="mode-row"]{gap:8px!important;flex-wrap:nowrap!important;min-width:0}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="badge"],[data-testid="coach-dashboard-identity-header"] [data-identity-role="team-name"]{font-size:11px!important;line-height:1.05!important;letter-spacing:.07em!important;white-space:nowrap!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="badge"]{min-height:auto!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#c8ff1a!important;font-weight:800!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="team-name"]{max-width:43vw!important;overflow:hidden!important;color:#aebcc2!important;font-weight:700!important;text-overflow:ellipsis!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="name"]{margin-top:6px!important;overflow:hidden!important;color:#f7fafb!important;font-size:26px!important;font-weight:820!important;line-height:.98!important;letter-spacing:-.045em!important;text-overflow:ellipsis!important;white-space:nowrap!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="tagline"]{display:block!important;margin:6px 0 0!important;color:#b8c5ca!important;font-size:12px!important;font-weight:590!important;line-height:1.15!important;letter-spacing:.01em!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-button"]{position:absolute!important;right:16px!important;top:50%!important;width:44px!important;min-height:44px!important;margin:0!important;padding:0!important;border:1px solid rgba(223,236,241,.15)!important;border-radius:13px!important;background:rgba(255,255,255,.055)!important;color:#dbe6ea!important;box-shadow:none!important;transform:translateY(-50%)!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-button"] span{display:none!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-button"]:focus-visible{outline:3px solid rgba(200,255,26,.24)!important;outline-offset:2px!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-button"]:active{transform:translateY(-50%) scale(.96)!important}
}`;

export default function CoachDashboardHeader({ heroRef, userName, onOpenTeamBranding }) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const teamName = branding?.teamName || branding?.name || "ShotLab Team";
  const displayName = String(userName || "Demo Coach").trim();

  return <>
    <style>{MOBILE_COACH_IDENTITY_CSS}</style>
    <section ref={heroRef} className={`${styles.header} ${styles.coach}`} data-testid="coach-dashboard-identity-header" data-mobile-chrome="native-identity">
      <div className={styles.inner} data-identity-role="inner">
        <div className={styles.identity} data-identity-role="identity">
          <div className={styles.modeRow} data-identity-role="mode-row">
            <span className={styles.badge} data-identity-role="badge">Coach Mode</span>
            <span className={styles.teamName} data-identity-role="team-name">{teamName}</span>
          </div>
          <h1 className={styles.name} data-identity-role="name">{displayName}</h1>
          <p className={styles.tagline} data-identity-role="tagline">Lead. Develop. Dominate.</p>
          <button type="button" onClick={onOpenTeamBranding} className={styles.brandBtn} data-identity-role="brand-button" aria-label="Team Branding Settings">
            <ShotLabIcon name="settings" size={17} />
            <span>Team Branding Settings</span>
          </button>
        </div>
        <div className={styles.brandPanel} data-identity-role="brand-panel" aria-label={`${teamName} identity`}>
          <img className={styles.brandMark} data-identity-role="brand-mark" src={logoSrc} alt={`${teamName} logo`} />
        </div>
      </div>
    </section>
  </>;
}
