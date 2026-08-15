import { useTeamBranding } from "../context/TeamBrandingContext";
import ShotLabIcon from "./ShotLabIcon";
import styles from "./DashboardIdentityHeader.module.css";

const MOBILE_COACH_IDENTITY_CSS = `
@media(max-width:700px){
  [data-testid="coach-dashboard-identity-header"]{margin:0 16px 5px!important;overflow:visible!important;border:0!important;border-bottom:1px solid rgba(17,26,33,.09)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
  [data-testid="coach-dashboard-identity-header"]::before{display:none!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="inner"]{position:relative!important;grid-template-columns:44px minmax(0,1fr)!important;gap:10px!important;align-items:center!important;min-height:62px!important;padding:max(6px,env(safe-area-inset-top)) 0 8px!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="identity"]{grid-column:2;grid-row:1;min-width:0;padding-right:39px}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-panel"]{grid-column:1;grid-row:1;width:44px!important;min-height:44px!important;padding:0!important;border-radius:0!important;background:transparent!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-mark"]{width:41px!important;height:41px!important;filter:drop-shadow(0 5px 9px rgba(17,26,33,.1))!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="mode-row"]{gap:5px!important;flex-wrap:nowrap!important;min-width:0}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="badge"],[data-testid="coach-dashboard-identity-header"] [data-identity-role="team-name"]{font-size:8.7px!important;line-height:1.05!important;letter-spacing:.055em!important;white-space:nowrap!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="badge"]{min-height:auto!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="team-name"]{max-width:48vw!important;overflow:hidden!important;text-overflow:ellipsis!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="name"]{margin-top:3px!important;overflow:hidden!important;font-size:20px!important;line-height:1!important;letter-spacing:-.035em!important;text-overflow:ellipsis!important;white-space:nowrap!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="tagline"]{display:none!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-button"]{position:absolute!important;right:0!important;top:50%!important;width:34px!important;min-height:34px!important;margin:0!important;padding:0!important;border-radius:10px!important;background:transparent!important;transform:translateY(-50%)!important}
  [data-testid="coach-dashboard-identity-header"] [data-identity-role="brand-button"] span{display:none!important}
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
