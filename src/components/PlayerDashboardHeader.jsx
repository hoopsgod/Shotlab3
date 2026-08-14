import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./DashboardIdentityHeader.module.css";

const MOBILE_PRODUCT_RESET_CSS = `
@media(max-width:700px){
  [data-testid="player-dashboard-identity-header"]{margin:0 16px 4px!important;border:0!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="inner"]{grid-template-columns:58px minmax(0,1fr)!important;gap:12px!important;align-items:center!important;min-height:84px!important;padding:max(10px,env(safe-area-inset-top)) 0 10px!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="identity"]{grid-column:2;grid-row:1;align-self:center}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-panel"]{grid-column:1;grid-row:1;width:58px!important;min-height:58px!important;place-items:center!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-mark"]{width:56px!important;height:56px!important;filter:drop-shadow(0 9px 17px rgba(17,26,33,.14))!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="mode-row"]{gap:7px!important;flex-wrap:nowrap!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="badge"]{font-size:10px!important;letter-spacing:.055em!important;white-space:nowrap!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="team-name"]{max-width:38vw!important;font-size:10px!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="name"]{margin-top:5px!important;overflow:hidden!important;font-size:24px!important;line-height:1!important;text-overflow:ellipsis!important;white-space:nowrap!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="tagline"],[data-testid="player-dashboard-identity-header"] [data-identity-role="mission"]{display:none!important}
}`;

export default function PlayerDashboardHeader({
  userName,
  subtitle = "Train. Track. Improve.",
  mission = "Today's mission awaits",
}) {
  const { branding } = useTeamBranding();
  const logoSrc = branding?.logoUrl || branding?.logoMarkUrl || "/branding/titans-exact-logo.png.PNG";
  const teamName = branding?.teamName || branding?.name || "ShotLab Team";
  const displayName = String(userName || "Demo Player").trim();

  return <>
    <style>{MOBILE_PRODUCT_RESET_CSS}</style>
    <section className={`${styles.header} ${styles.player}`} data-dashboard-header="player-premium" data-testid="player-dashboard-identity-header" data-layout-role="editorial-header" data-mobile-product-reset="phase-1">
      <div className={styles.inner} data-identity-role="inner">
        <div className={styles.identity} data-identity-role="identity">
          <div className={styles.modeRow} data-identity-role="mode-row">
            <span className={styles.badge} data-identity-role="badge">Player Mode</span>
            <span className={styles.teamName} data-identity-role="team-name">{teamName}</span>
          </div>
          <h1 className={styles.name} data-identity-role="name">{displayName}</h1>
          <p className={styles.tagline} data-identity-role="tagline">{subtitle}</p>
          <div className={styles.mission} data-identity-role="mission">
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.missionLabel}>Today</span>
            <strong>{mission}</strong>
          </div>
        </div>
        <div className={styles.brandPanel} data-identity-role="brand-panel" aria-hidden="true">
          <img className={styles.brandMark} data-identity-role="brand-mark" src={logoSrc} alt="" />
        </div>
      </div>
    </section>
  </>;
}
