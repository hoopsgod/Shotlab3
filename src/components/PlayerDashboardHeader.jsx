import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./DashboardIdentityHeader.module.css";

const MOBILE_PRODUCT_RESET_CSS = `
@media(max-width:700px){
  [data-testid="player-dashboard-identity-header"]{margin:0 16px 2px!important;border:0!important;box-shadow:none!important;background:transparent!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="inner"]{grid-template-columns:46px minmax(0,1fr)!important;gap:10px!important;align-items:center!important;min-height:62px!important;padding:max(7px,env(safe-area-inset-top)) 0 7px!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="identity"]{grid-column:2;grid-row:1;align-self:center}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-panel"]{grid-column:1;grid-row:1;width:46px!important;min-height:46px!important;place-items:center!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-mark"]{width:44px!important;height:44px!important;filter:drop-shadow(0 6px 12px rgba(17,26,33,.12))!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="mode-row"]{gap:6px!important;flex-wrap:nowrap!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="badge"],[data-testid="player-dashboard-identity-header"] [data-identity-role="team-name"]{font-size:9px!important;line-height:1.1!important;white-space:nowrap!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="team-name"]{max-width:42vw!important;overflow:hidden!important;text-overflow:ellipsis!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="name"]{margin-top:3px!important;overflow:hidden!important;font-size:20px!important;line-height:1!important;letter-spacing:-.025em!important;text-overflow:ellipsis!important;white-space:nowrap!important}
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
