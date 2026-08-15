import { useTeamBranding } from "../context/TeamBrandingContext";
import styles from "./DashboardIdentityHeader.module.css";

const MOBILE_PRODUCT_RESET_CSS = `
@media(max-width:700px){
  [data-testid="player-dashboard-identity-header"]{position:relative!important;margin:0!important;overflow:hidden!important;border:0!important;border-bottom:1px solid rgba(200,255,26,.15)!important;border-radius:0!important;background:radial-gradient(circle at 92% -34%,rgba(200,255,26,.16),transparent 42%),linear-gradient(126deg,#061923 0%,#082430 58%,#0b2d37 100%)!important;box-shadow:0 14px 34px rgba(7,28,40,.14)!important;color:#f5f8f9!important}
  [data-testid="player-dashboard-identity-header"]::before{display:block!important;content:""!important;position:absolute!important;inset:0!important;pointer-events:none!important;background:radial-gradient(ellipse 168px 92px at 104% 118%,transparent 63%,rgba(223,236,241,.11) 63.5%,transparent 64.2%),linear-gradient(90deg,transparent 0 72%,rgba(223,236,241,.055) 72% 72.4%,transparent 72.4%)!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="inner"]{position:relative!important;z-index:1!important;grid-template-columns:64px minmax(0,1fr)!important;gap:14px!important;align-items:center!important;min-height:96px!important;padding:max(12px,env(safe-area-inset-top)) 16px 14px!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="identity"]{grid-column:2;grid-row:1;align-self:center;min-width:0}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-panel"]{grid-column:1;grid-row:1;width:64px!important;min-height:64px!important;padding:0!important;place-items:center!important;border-radius:0!important;background:transparent!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-mark"]{width:58px!important;height:58px!important;filter:drop-shadow(0 10px 16px rgba(0,0,0,.28))!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="mode-row"]{gap:8px!important;flex-wrap:nowrap!important;min-width:0}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="badge"],[data-testid="player-dashboard-identity-header"] [data-identity-role="team-name"]{font-size:11px!important;line-height:1.05!important;letter-spacing:.07em!important;white-space:nowrap!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="badge"]{min-height:auto!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#c8ff1a!important;font-weight:800!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="team-name"]{max-width:48vw!important;overflow:hidden!important;color:#aebcc2!important;font-weight:700!important;text-overflow:ellipsis!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="name"]{margin-top:6px!important;overflow:hidden!important;color:#f7fafb!important;font-size:25px!important;font-weight:820!important;line-height:.98!important;letter-spacing:-.045em!important;text-overflow:ellipsis!important;white-space:nowrap!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="tagline"]{display:block!important;margin:6px 0 0!important;color:#b8c5ca!important;font-size:12px!important;font-weight:590!important;line-height:1.15!important;letter-spacing:.01em!important}
  [data-testid="player-dashboard-identity-header"] [data-identity-role="mission"]{display:none!important}

  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"]{margin:2px 16px 8px!important;overflow:visible!important;border:0!important;border-left:3px solid var(--team-brand-primary,var(--accent,#8fae25))!important;border-bottom:0!important;background:transparent!important;box-shadow:none!important;color:#151a16!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"]::before{display:none!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="inner"]{grid-template-columns:62px minmax(0,1fr)!important;gap:12px!important;min-height:68px!important;padding:5px 0 7px 10px!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-panel"]{width:62px!important;min-height:58px!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="brand-mark"]{width:58px!important;height:58px!important;filter:drop-shadow(0 7px 12px rgba(7,28,40,.12))!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="badge"]{color:#617900!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="team-name"]{color:#68716a!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] [data-identity-role="name"]{margin-top:5px!important;color:#151a16!important;font-size:26px!important;line-height:.96!important}
  .performance-shell--player.is-mobile:not([data-workspace-tab="home"]) [data-testid="player-dashboard-identity-header"] :is([data-identity-role="tagline"],[data-identity-role="mission"]){display:none!important}
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
    <section className={`${styles.header} ${styles.player}`} data-dashboard-header="player-premium" data-testid="player-dashboard-identity-header" data-layout-role="compact-identity" data-mobile-product-reset="phase-1" data-mobile-chrome="native-identity">
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
